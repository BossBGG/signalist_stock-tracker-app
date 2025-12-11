"use server";

import { cache } from "react";
import { formatArticle, getDateRange, validateArticle } from "../utils";
import { POPULAR_STOCK_SYMBOLS } from "../constants";
import { symbol } from "zod";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const NEXT_PUBLIC_FINNHUB_API_KEY =
  process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? "";

async function fetchJSON<T>(
  url: string,
  revalidateSeconds?: number
): Promise<T> {
  const options: RequestInit & { next?: { revalidate?: number } } =
    revalidateSeconds
      ? { cache: "force-cache", next: { revalidate: revalidateSeconds } }
      : { cache: "no-store" };

  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) {
      console.warn(`API limit reached: ${text}`);
    }
    throw new Error(`Fetch failed ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export { fetchJSON };

export async function getNews(
  symbols?: string[]
): Promise<MarketNewsArticle[]> {
  try {
    const range = getDateRange(5);
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) {
      throw new Error("FINNHUB API key is not configured");
    }
    const cleanSymbols = (symbols || [])
      .map((s) => s?.trim().toUpperCase())
      .filter((s): s is string => Boolean(s));

    const maxArticles = 6;
    // If we have symbols, try to fetch company news per symbol and round-robin select
    if (cleanSymbols.length > 0) {
      const perSymbolArticles: Record<string, RawNewsArticle[]> = {};

      await Promise.all(
        cleanSymbols.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(
              sym
            )}&from=${range.from}&to=${range.to}&token=${token}`;
            const articles = await fetchJSON<RawNewsArticle[]>(url, 300);
            perSymbolArticles[sym] = (articles || []).filter(validateArticle);
          } catch (e) {
            console.error("Error fetching news for", sym, e);
            perSymbolArticles[sym] = [];
          }
        })
      );

      const collected: MarketNewsArticle[] = [];
      // Round-robin up to 6 picks
      for (let round = 0; round < maxArticles; round++) {
        for (let i = 0; i < cleanSymbols.length; i++) {
          const sym = cleanSymbols[i];
          const list = perSymbolArticles[sym] || [];
          if (list.length === 0) continue;
          const article = list.shift();
          if (!article || !validateArticle(article)) continue;
          collected.push(formatArticle(article, true, sym, round));
          if (collected.length >= maxArticles) break;
        }
        if (collected.length >= maxArticles) break;
      }

      if (collected.length > 0) {
        // Sort by datetime desc
        collected.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
        return collected.slice(0, maxArticles);
      }
      // If none collected, fall through to general news
    }

    // General market news fallback or when no symbols provided
    const generalUrl = `${FINNHUB_BASE_URL}/news?category=general&token=${token}`;
    const general = await fetchJSON<RawNewsArticle[]>(generalUrl, 300);

    const seen = new Set<string>();
    const unique: RawNewsArticle[] = [];
    for (const art of general || []) {
      if (!validateArticle(art)) continue;
      const key = `${art.id}-${art.url}-${art.headline}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(art);
      if (unique.length >= 20) break;
    }

    const formatted = unique
      .slice(0, maxArticles)
      .map((a, idx) => formatArticle(a, false, undefined, idx));
    return formatted;
  } catch (err) {
    console.error("getNews error:", err);
    throw new Error("Failed to fetch news");
  }
}

async function searchStocksWithEmail(
  query?: string,
  userEmail?: string
): Promise<StockWithWatchlistStatus[]> {
  try {
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) {
      // If no token, log and return empty to avoid throwing per requirements
      console.error(
        "Error in stock search:",
        new Error("FINNHUB API key is not configured")
      );
      return [];
    }

    const trimmed = typeof query === "string" ? query.trim() : "";

    let results: FinnhubSearchResult[] = [];

    if (!trimmed) {
      // Fetch top 10 popular symbols' profiles
      const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
      const profiles = await Promise.all(
        top.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(
              sym
            )}&token=${token}`;
            // Revalidate every hour
            const profile = await fetchJSON<any>(url, 3600);
            return { sym, profile } as { sym: string; profile: any };
          } catch (e) {
            console.error("Error fetching profile for", sym, e);
            return { sym, profile: null } as { sym: string; profile: any };
          }
        })
      );

      results = profiles
        .map(({ sym, profile }) => {
          const symbol = sym.toUpperCase();
          const name: string | undefined =
            profile?.name || profile?.ticker || undefined;
          const exchange: string | undefined = profile?.exchange || undefined;
          if (!name) return undefined;
          const r: FinnhubSearchResult = {
            symbol,
            description: name,
            displaySymbol: symbol,
            type: "Common Stock",
          };
          // We don't include exchange in FinnhubSearchResult type, so carry via mapping later using profile
          // To keep pipeline simple, attach exchange via closure map stage
          // We'll reconstruct exchange when mapping to final type
          (r as any).__exchange = exchange;
          return r;
        })
        .filter((x): x is FinnhubSearchResult => Boolean(x));
    } else {
      const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(
        trimmed
      )}&token=${token}`;
      const data = await fetchJSON<FinnhubSearchResponse>(url, 1800);
      results = Array.isArray(data?.result) ? data.result : [];
    }

    let watchlistSymbols: string[] = [];
    if (userEmail) {
      const { getWatchlistSymbolsByEmail } = await import(
        "./watchlist.actions"
      );
      watchlistSymbols = await getWatchlistSymbolsByEmail(userEmail);
    }

    const mapped: StockWithWatchlistStatus[] = results
      .map((r) => {
        const upper = (r.symbol || "").toUpperCase();
        const name = r.description || upper;
        const exchangeFromDisplay =
          (r.displaySymbol as string | undefined) || undefined;
        const exchangeFromProfile = (r as any).__exchange as string | undefined;
        const exchange = exchangeFromDisplay || exchangeFromProfile || "US";
        const type = r.type || "Stock";
        const item: StockWithWatchlistStatus = {
          symbol: upper,
          name,
          exchange,
          type,
          isInWatchlist: watchlistSymbols.includes(upper),
        };
        return item;
      })
      .slice(0, 15);

    return mapped;
  } catch (err) {
    console.error("Error in stock search:", err);
    return [];
  }
}

export const searchStocks = cache(searchStocksWithEmail);

export async function searchStocksForClient(
  query?: string
): Promise<StockWithWatchlistStatus[]> {
  try {
    const { auth } = await import("@/lib/better-auth/auth");
    const { headers } = await import("next/headers");
    const session = await auth.api.getSession({ headers: await headers() });
    const userEmail = session?.user?.email;
    return searchStocksWithEmail(query, userEmail);
  } catch (err) {
    console.error("Error in searchStocksForClient:", err);
    return searchStocksWithEmail(query);
  }
}

export const getQuote = async (symbol: string) => {
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`,
    { next: { revalidate: 30 } }
  );

  if (!res.ok) {
    console.error(`Failed to fetch quote for ${symbol}: ${res.status}`);
    return null;
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error(`Invalid JSON response for quote ${symbol}`);
    return null;
  }
};

export const getCompanyProfile = async (symbol: string) => {
  const res = await fetch(
    `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return null;
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export const getCompanyNews = async (symbol: string) => {
  const today = new Date().toISOString().split("T")[0];
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const res = await fetch(
    `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${lastWeek}&to=${today}&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
};

export const getCompanyPeers = async (symbol: string) => {
  
  try {
    const peerRes = await fetch(
      `https://finnhub.io/api/v1/stock/peers?symbol=${symbol}&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`,
      { next: { revalidate: 86400 } }
    );

    if (!peerRes.ok) return [];

    const peersList: string[] = await peerRes.json();
    const topPeers = peersList.filter((p) => p !== symbol).slice(0, 10);

    const detailedPeers = await Promise.all(
      topPeers.map(async (peerSymbol) => {
        const [quote, profile] = await Promise.all([
          getQuote(peerSymbol),
          getCompanyProfile(peerSymbol),
        ]);
        return {
          symbol: peerSymbol,
          price: quote?.c || 0,
          changePercent: quote?.dp || 0,
          name: profile?.name || peerSymbol,
          logo: profile?.logo || null,
        };
      })
    );

    return detailedPeers;
  } catch (error) {
    console.error("Error fetching detailed peers:", error);
    return [];
  }
};

export const getMarketNews = async (category: string = "general") => {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/news?category=${category}&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`,
      { next: {revalidate: 1800}}
    );

    if(!res.ok) throw new Error("Failed to fetch news");

    const data = await res.json();
    return data.slice(0, 10);
  } catch (error) {
    console.error(`Error fetching ${category} news:`, error);
    return [];
  }
}
