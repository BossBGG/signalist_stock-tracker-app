"use server";

import { connectToDatabase } from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { fetchJSON } from "./finnhub.actions";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY

export async function getWatchlistSymbolsByEmail(
  email: string
): Promise<string[]> {
  if (!email) return [];

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection not found");

    // Better Auth stores users in the "user" collection
    const user = await db
      .collection("user")
      .findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

    if (!user) return [];

    const userId = (user.id as string) || String(user._id || "");
    if (!userId) return [];

    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error("getWatchlistSymbolsByEmail error:", err);
    return [];
  }
}

export async function toggleWatchlist(
  symbol: string,
  company: string,
  isAdded: boolean
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Unauthorized");

    await connectToDatabase();

    if (isAdded) {
      await Watchlist.findOneAndUpdate(
        {
          userId: session.user.id,
          symbol: symbol.toUpperCase(),
        },
        {
          userId: session.user.id,
          symbol: symbol.toUpperCase(),
          company,
        },
        { upsert: true, new: true }
      );
    } else {
      await Watchlist.findOneAndDelete({
        userId: session.user.id,
        symbol: symbol.toUpperCase(),
      });
    }

    revalidatePath("/watchlist");
    revalidatePath("/");
    revalidatePath(`/stocks/${symbol}`);
    return { success: true };
  } catch (error) {
    console.error("Toggle watchlist error:", error);
    return { success: false, error: "Failed to update watchlist" };
  }
}

// Get Full Watchlist with Price Data
export async function getWatchlist() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return [];

    await connectToDatabase();

    const watchlisItems = await Watchlist.find({
      userId: session.user.id,
    }).lean();
    if (!watchlisItems.length) return [];

    // Batch API calls to reduce token usage
    const symbols = watchlisItems.map(item => item.symbol);
    const quotes = await batchFetchQuotes(symbols);
    const profiles = await batchFetchProfiles(symbols);

    const watchlistWithData = watchlisItems.map((item: any) => {
      const quote = quotes[item.symbol];
      const profile = profiles[item.symbol];
      
      return {
        ...item,
        _id: item._id.toString(),
        currentPrice: quote?.c || 0,
        changePercent: quote?.dp || 0,
        logo: profile?.logo || "",
        marketCap: profile?.marketCapitalization || 0,
        peRatio: profile?.name ? "N/A" : "N/A",
      };
    });

    return watchlistWithData;
  } catch (error) {
    console.error("Get Watchlist Error:", error);
    return [];
  }
}

// Batch fetch quotes to reduce API calls
async function batchFetchQuotes(symbols: string[]) {
  const results: Record<string, any> = {};
  
  // Process in batches of 10 to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (symbol) => {
        try {
          const quoteUrl = `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
          results[symbol] = await fetchJSON<QuoteData>(quoteUrl);
        } catch (e) {
          console.error(`Failed to fetch quote for ${symbol}`, e);
          results[symbol] = { c: 0, dp: 0 };
        }
      })
    );
    
    // Add small delay between batches to avoid rate limiting
    if (i + batchSize < symbols.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

// Batch fetch profiles to reduce API calls
async function batchFetchProfiles(symbols: string[]) {
  const results: Record<string, any> = {};
  
  // Process in batches of 10 to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (symbol) => {
        try {
          const profileUrl = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
          results[symbol] = await fetchJSON<ProfileData>(profileUrl);
        } catch (e) {
          console.error(`Failed to fetch profile for ${symbol}`, e);
          results[symbol] = {};
        }
      })
    );
    
    // Add small delay between batches to avoid rate limiting
    if (i + batchSize < symbols.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

export async function checkIsStockInWatchlist(symbol: string) {
  try {
    const session = await auth.api.getSession({headers: await headers() });
    if(!session?.user) return false;

    await connectToDatabase();

    const exists = await Watchlist.findOne({
      userId: session.user.id,
      symbol: symbol.toUpperCase(),
    });

    return !!exists;
  } catch (error){
    console.error("Error checking watchlist:", error);
    return false;
  }
}
