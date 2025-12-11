// components/TodayFinancialNews.tsx
import React from 'react';
import Image from 'next/image';
import { getMarketNews } from '@/lib/actions/finnhub.actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getTodayFinancialNewsTimeAgo } from '@/lib/utils';



const NewsItem = ({ news }: { news: any }) => (
  <a 
    href={news.url} 
    target="_blank" 
    rel="noopener noreferrer"
    className="group flex justify-between gap-4 py-4 border-b border-gray-800 last:border-none cursor-pointer hover:bg-white/5 transition-colors rounded-lg px-2 "
  >
    {/* Left Side: Content */}
    <div className="flex flex-col justify-between flex-1 min-w-0 pr-2">
      <div>
        {/* Source & Time */}
        <div className="flex items-center gap-2 mb-2 text-xs text-gray-400 font-medium">
            <span>{news.source}</span>
            <span className="text-gray-600">•</span>
            <span>{getTodayFinancialNewsTimeAgo(news.datetime)}</span>
        </div>

        {/* Headline */}
        <h4 className="text-sm md:text-base font-semibold text-gray-100 leading-snug line-clamp-3 group-hover:text-blue-400 transition-colors">
          {news.headline}
        </h4>
      </div>
      
      {/* Footer: Ticker Tag */}
      <div className="mt-3">
         {news.related ? (
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#27272a] border border-gray-700">
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                    {news.related}
                </span>
                {/* Mock percent change styling to match design (Since API might not give realtime change here) */}
                {/* <span className="ml-2 text-[10px] text-red-500 font-medium">↓ 1.74%</span> */}
            </div>
         ) : (
            // Empty placeholder if no related stock to keep spacing consistent or omit
            <div className="h-6"></div> 
         )}
      </div>
    </div>

    {/* Right Side: Image */}
    <div className="relative h-20 w-32 md:h-24 md:w-40 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800 border border-gray-800">
      {news.image ? (
        <Image 
          src={news.image} 
          alt="news thumbnail" 
          fill
          className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
        />
      ) : (
        <div className="flex items-center justify-center h-full w-full text-gray-500 text-xs">
            No Image
        </div>
      )}
    </div>
  </a>
);

const TodayFinancialNews = async () => {
  const topStories = await getMarketNews("general");
  // const localMarket = await getMarketNews("merger"); 
  const cryptoMarket = await getMarketNews("crypto");   

  const RELIABLE_NEWS_URL = "https://www.bloomberg.com/markets";

  return (
    <Card className="h-full bg-[#161616] border-none shadow-none text-white p-6">
      <CardHeader className="px-0 pt-0 pb-2">
        <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold tracking-wide">Today's Financial News</CardTitle>
            <a 
                href={RELIABLE_NEWS_URL}
                target="_blank" 
                rel="noreferrer"
                className="text-sm text-gray-400 hover:text-white transition-colors"
            >
                View all
            </a>
        </div>
      </CardHeader>
      
      <CardContent className="px-0">
        <Tabs defaultValue="top" className="w-full">
          {/* Custom Tabs List Style (Pills) */}
          <TabsList className="flex justify-start w-full bg-transparent p-0 gap-3 mb-6">
            <TabsTrigger 
                value="top" 
                className="rounded-full px-4 py-1.5 text-sm font-medium border border-transparent bg-transparent text-gray-500 data-[state=active]:bg-[#27272a] data-[state=active]:text-white data-[state=active]:border-gray-700 transition-all"
            >
                Top stories
            </TabsTrigger>
            {/* <TabsTrigger 
                value="local" 
                disabled 
                className="rounded-full px-4 py-1.5 text-sm font-medium border border-transparent bg-transparent text-gray-500 data-[state=active]:bg-[#27272a] data-[state=active]:text-white data-[state=active]:border-gray-700 transition-all opacity-50 cursor-not-allowed"
            >
                Local market
            </TabsTrigger> */}
            <TabsTrigger 
                value="world" 
                className="rounded-full px-4 py-1.5 text-sm font-medium border border-transparent bg-transparent text-gray-500 data-[state=active]:bg-[#27272a] data-[state=active]:text-white data-[state=active]:border-gray-700 transition-all"
            >
                Crypto markets
            </TabsTrigger>
          </TabsList>
          
          <div className="space-y-2 max-h-[450px] overflow-y-auto scrollbar-hide-default">
              {/* Top Stories Content */}
              <TabsContent value="top" className="mt-0">
                {topStories.length > 0 ? (
                    topStories.slice(0, 10).map((news: any) => <NewsItem key={news.id} news={news} />)
                ) : <p className="text-center text-gray-500 py-10">No top stories available.</p>}
              </TabsContent>

              {/* Crypto Markets Content */}
              <TabsContent value="world" className="mt-0">
                {cryptoMarket.length > 0 ? (
                    cryptoMarket.slice(0, 10).map((news: any) => <NewsItem key={news.id} news={news} />)
                ) : <p className="text-center text-gray-500 py-10">No crypto news available.</p>}
              </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TodayFinancialNews;