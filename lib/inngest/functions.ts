import { inngest } from "@/lib/inngest/client";
import {
  NEWS_SUMMARY_EMAIL_PROMPT,
  PERSONALIZED_WELCOME_EMAIL_PROMPT,
} from "./prompts";
import { sendNewsSummaryEmail, sendStockAlertEmail, sendWelcomeEmail } from "../nodemailer";
import { getAllUsersForNewsEmail } from "../actions/user.actions";
import { getWatchlistSymbolsByEmail } from "../actions/watchlist.actions";
import { fetchJSON, getNews } from "../actions/finnhub.actions";
import { getFormattedTodayDate } from "../utils";
import { connectToDatabase } from "@/database/mongoose";
import { AlertModel } from "@/database/models/alert.model";
import { tr } from "zod/v4/locales";


export const sendSignUpEmail = inngest.createFunction(
  { id: "sign-up-email" },
  { event: "app/user.created" },
  async ({ event, step }) => {
    const userProfile = ` 
            - Country: ${event.data.country} 
            - Investment goals: ${event.data.investmentGoals}
            - Risk tolerance: ${event.data.riskTolerance} 
            - Investment goals: ${event.data.preferredIndustry}
        `;

    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
      "{{userProfile}}",
      userProfile
    );

    const response = await step.ai.infer("genrate-welcome-intro", {
      model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
      body: {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      },
    });

    await step.run("send-welcome-email", async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const introText =
        (part && "text" in part ? part.text : null) ||
        "Thanks for joining Signalist. You now have the tools to track markets and make smarter moves.";

      const {
        data: { email, name },
      } = event;

      return await sendWelcomeEmail({
        email,
        name,
        intro: introText,
      });
    });

    return {
      success: true,
      message: "Welcome email sent successfully",
    };
  }
);

export const sendDailyNewsSummary = inngest.createFunction(
  { id: "daily-news-summary" },
  [{ event: "app/send.daily.news" }, { cron: "0 12 * * *" }],
  async ({ step }) => {
    // Step #1: Get all users for news delivery
    const users = await step.run("get-all-users", getAllUsersForNewsEmail);

    if (!users || users.length === 0)
      return { success: false, message: "No users found for news email" };
    // Step #2: Fetch personalized news for each user
    const results = await step.run("fetch-user-news", async () => {
      const perUser: Array<{
        user: UserForNewsEmail;
        articles: MarketNewsArticle[];
      }> = [];
      for (const user of users as UserForNewsEmail[]) {
        try {
          const symbols = await getWatchlistSymbolsByEmail(user.email);
          let articles = await getNews(symbols);
          // Enforce max 6 articles per user
          articles = (articles || []).slice(0, 6);
          //If still empty, fallback to general
          if (!articles || articles.length === 0) {
            articles = await getNews();
            articles = (articles || []).slice(0, 6);
          }
          perUser.push({ user, articles });
        } catch (e) {
          console.error("daily-news: error preparing user news", user.email, e);
          perUser.push({ user, articles: [] });
        }
      }
      return perUser;
    });
    // Step #3: Summarize news via AI
    const userNewsSummaries: {
      user: UserForNewsEmail;
      newsContent: string | null;
    }[] = [];

    for (const { user, articles } of results) {
      try {
        const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
          "{{newsData}}",
          JSON.stringify(articles, null, 2)
        );

        const response = await step.ai.infer(`summarize-news-${user.email}`, {
          model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
          body: {
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
          },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        const newsContent =
          (part && "text" in part ? part.text : null) || "No market news.";

        userNewsSummaries.push({ user, newsContent });
      } catch (e) {
        console.error("Failed to summarize news for", user.email);
        userNewsSummaries.push({ user, newsContent: null });
      }
    }
    // Step #4: Send emails
    await step.run("send-news-emails", async () => {
      await Promise.all(
        userNewsSummaries.map(async ({ user, newsContent }) => {
          if (!newsContent) return false;

          return await sendNewsSummaryEmail({
            email: user.email,
            date: getFormattedTodayDate(),
            newsContent,
          });
        })
      );
    });

    return { success: true , message: "Daily news summary email sent successfully"}
  }
);

export const checkAndTriggerAlerts = inngest.createFunction(
  { id: "check-stock-alerts"},
  { cron: "* * * * *"},
  async ({ step }) => {
    await connectToDatabase();

    const now = new Date();

    // get all alerts
    const alertsToCheck = await step.run("fetch-due-alerts", async () => {
      const oneMinAgo = new Date(now.getTime() - 60 * 1000);
      const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const fifteenMinAgo = new Date(now.getTime() -  15 * 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      return await AlertModel.find({
        active: true,
        $or: [
          { lastTriggeredAt: null},
          { frequency: 'once_per_minute', lastTriggeredAt: { $lte: oneMinAgo}},
          { frequency: 'once_per_5_minute', lastTriggeredAt: { $lte: fiveMinAgo}},
          { frequency: 'once_per_15_minute', lastTriggeredAt: { $lte: fifteenMinAgo}},
          { frequency: 'once_per_hour', lastTriggeredAt: { $lte: oneHourAgo}},
          { frequency: 'once_per_day', lastTriggeredAt: { $lte: oneDayAgo}},
        ]
      }).lean()
    });

    if(!alertsToCheck.length) return {message: "No alerts due for checking"};
    //Fetch Market Data (Optimized Batching)
    const uniqueSymbols = [...new Set(alertsToCheck.map((a: any) => a.symbol))];
    const token = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    // get market data
    const marketData = await step.run("fetch-market-data", async () => {
      const data: Record<string , any> = {};
      await Promise.all(
        uniqueSymbols.map(async (symbol) => {
          try {
            const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${token}`;
            const quote = await fetchJSON<QuoteData>(url);
            data[symbol as string] = quote;
          } catch (e) {
            console.error(`Failed to fetch quote for ${symbol}`, e);
          }
        })
      );
      return data;
    });

    //Process Logic & Prepare Actions
    const actionsToTake = alertsToCheck.map((alert: any) => {
      const quote = marketData[alert.symbol];
      if(!quote) return null;

      const currentPrice = quote.c;
      const currentVolume = quote.v;
      const threshold = alert.threshold;
      let isTriggered = false;
      let emailType: 'upper' | 'lower' | 'volume' = 'upper';

      if(alert.alertType === 'price') {
        if(alert.condition === 'greater' && currentPrice >= threshold) {
          isTriggered = true; emailType = 'upper';
        } else if (alert.condition === 'less' && currentPrice <= threshold) {
          isTriggered = true; emailType = 'lower';
        }
      } else if (alert.alertType === 'volume') {
        if(alert.condition === 'greater' && currentVolume >= threshold) {
          isTriggered = true
        }
      }

      if (isTriggered) {
        return {
          alert,
          emailType,
          quote
        };
      }
      return null;
    }).filter(item => item !== null);

    if (actionsToTake.length === 0) return { success: true, triggeredCount: 0};

    const results = await step.run("execute-actions", async () => {
        const db = (await connectToDatabase()).connection.db;

        const emailPromises = actionsToTake.map(async (action: any) => {
          const user = await db?.collection("user").findOne({ id: action.alert.userId });
          if (user?.email) {
            return sendStockAlertEmail({
              email: user.email,
              type: action.emailType,
              alertData: {
                symbol: action.alert.symbol,
                company: action.alert.company,
                currentPrice: action.quote.c,
                threshold: action.alert.threshold, 
                currentVolume: (action.quote.v / 1000000).toFixed(2) + 'M',
                changePercent: action.quote.dp
              }
            })
          }
        });

        const dbPromises = actionsToTake.map((action: any) => 
          AlertModel.findByIdAndUpdate(action.alert._id, { lastTriggeredAt: now })
        );

        await Promise.all([
          ...emailPromises,
          ...dbPromises
        ]);

        return actionsToTake.length;
    });

    return { success: true, triggeredCount: results };
  }
);