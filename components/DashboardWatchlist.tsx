// components/DashboardWatchlist.tsx
import { getWatchlist } from "@/lib/actions/watchlist.actions";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import WatchlistButton from "./ui/WatchlistButton";

const DashboardWatchlist = async () => {
  const watchlistItems = await getWatchlist();
  
  const displayItems = watchlistItems?.slice(0, 6) || [];

  return (
    <Card className="h-full bg-[#161616] border-none shadow-none text-white w-full p-6">
      {/* Header Section */}
      <CardHeader className="flex flex-row items-center justify-between px-0 pt-0 pb-6">
        <CardTitle className="text-xl font-bold tracking-wide">Your Watchlist</CardTitle>
        <Link 
          href="/watchlist" 
          className="text-sm text-gray-400 hover:text-white transition-colors font-medium"
        >
          View all
        </Link>
      </CardHeader>

      <CardContent className="px-0 p-0 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayItems.length > 0 ? (
            displayItems.map((item: any) => (
              <div 
                key={item.symbol} 
                className="bg-[#212328] border border-white-700 rounded-xl p-5 flex flex-col justify-between h-[180px] hover:border-gray-600 transition-colors relative group"
              >
                
                {/* Top Row: Logo & Star */}
                <div className="flex justify-between items-start mb-3">
                    {/* Logo Box */}
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                        <Image 
                            src={item.logo || '/assets/icons/logo.svg'} 
                            alt={item.symbol}
                            fill
                            className="object-contain p-1" 
                        />
                    </div>
                    
                    {/* Star Button */}
                    <div>
                        <WatchlistButton 
                            symbol={item.symbol}
                            company={item.name}
                            isInWatchlist={true}
                            initialIsSaved={true}
                            type="icon"
                        />
                    </div>
                </div>

                {/* Middle Row: Name */}
                <div className="mb-4">
                    <h3 className="text-gray-300 font-medium text-sm line-clamp-2 leading-relaxed">
                        {item.company || item.symbol}
                    </h3>
                </div>

                {/* Bottom Row: Price & Change */}
                <div className="mt-auto">
                    <div className="text-xl font-bold text-white mb-1">
                        ${item.currentPrice?.toFixed(2) || '0.00'}
                    </div>
                    <div className={`text-xs font-semibold flex items-center gap-1 ${item.changePercent >= 0 ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                        <span>{item.changePercent >= 0 ? '+' : ''}{item.changePercent?.toFixed(2)}%</span>
                    </div>
                </div>

              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 text-gray-500 text-sm bg-[#18181b] rounded-xl border border-gray-800 border-dashed">
              No stocks in watchlist
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardWatchlist;