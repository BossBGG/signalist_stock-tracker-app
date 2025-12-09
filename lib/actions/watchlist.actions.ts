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

    const watchlistWithData = await Promise.all(
      watchlisItems.map(async (item: any) => {
        try {
          const quoteUrl = `${FINNHUB_BASE_URL}/quote?symbol=${item.symbol}&token=${FINNHUB_API_KEY}`;
          const profileUrl = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${item.symbol}&token=${FINNHUB_API_KEY}`;

          const [quote, profile] = await Promise.all([
            fetchJSON<QuoteData>(quoteUrl),
            fetchJSON<ProfileData>(profileUrl),
          ]);

          return {
            ...item,
            _id: item._id.toString(),
            currentPrice: quote.c || 0,
            changePercent: quote.dp || 0,
            logo: profile.logo || "",
            marketCap: profile.marketCapitalization || 0, 
            /*
              marketCap: profile.marketCapitalization
              ? `${profile.marketCapitalization.toFixed(2)}M`
              : "N/A", 
            */
            peRatio: profile.name ? "N/A" : "N/A",
          };
        } catch (e) {
          console.error(`Failed to fetch data for ${item.symbol}`, e);
          return {
            ...item,
            _id: item._id.toString(),
            currentPrice: 0,
            changePercent: 0,
          };
        }
      })
    );
    return watchlistWithData;
  } catch (error) {
    console.error("Get Watchlist Error:", error);
    return [];
  }
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
