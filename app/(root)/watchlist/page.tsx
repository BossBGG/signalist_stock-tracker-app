import { getAlerts } from '@/lib/actions/alert.actions'
import { getNews, searchStocks } from '@/lib/actions/finnhub.actions'
import { getWatchlist } from '@/lib/actions/watchlist.actions'
import React from 'react'
import WatchlistClient from './WatchlistClient'

const WatchlistPage = async () => {
  
  const [watchlistData, alertsData, initialStocks] = await Promise.all([
    getWatchlist(),
    getAlerts(),
    searchStocks() 
  ]);

  
  const symbols = Array.isArray(watchlistData) ? watchlistData.map((w: any) => w.symbol) : [];

  const newsData = symbols.length > 0 ? await getNews(symbols) : await getNews(); 
  const slicedNews = newsData.slice(0, 8); // Ensure max 8

  return (
    <div className="flex flex-col gap-10">
      <WatchlistClient 
        watchlist={watchlistData} 
        alerts={alertsData} 
        news={slicedNews}
        initalStocks={initialStocks}
      />
    </div>
  );
};

export default WatchlistPage;