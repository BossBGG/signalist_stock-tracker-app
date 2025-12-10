import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';

interface PeerData {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  logo: string | null;
}

const RelatedStocks = ({ peers }: { peers: PeerData[] }) => {
  return (
    <Card className="bg-[#161616] p-6 border-none shadow-none w-full text-white ">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg font-bold text-white tracking-wide">
          Related stocks
        </CardTitle>
      </CardHeader>
      
      <CardContent className="px-0 p-0">
        <div className="flex flex-col max-h-[450px] overflow-y-auto scrollbar-hide-default">
            {peers.length > 0 ? (
                peers.map((peer) => (
                    <Link key={peer.symbol} href={`/stocks/${peer.symbol}`}>
                        <div className="group flex items-center justify-between py-4 border-b border-gray-800 last:border-none hover:bg-white/5 transition-colors rounded-lg px-2 cursor-pointer">
                            
                            {/* Left Side: Logo + Name + Price */}
                            <div className="flex items-center gap-4">
                                {/* Logo Box */}
                                <div className="w-12 h-12 rounded-xl bg-[#27272a] border border-gray-700 p-2 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                     {peer.logo ? (
                                        <img src={peer.logo} alt={peer.symbol} className="object-contain w-full h-full" />
                                     ) : (
                                        <span className="text-sm font-bold text-gray-400">{peer.symbol.slice(0,1)}</span>
                                     )}
                                </div>

                                {/* Name (Top) & Price (Bottom) */}
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm text-gray-300 font-medium truncate max-w-[140px] md:max-w-[200px]">
                                        {peer.name}
                                    </span>
                                    <span className="text-lg font-bold text-white">
                                        ${peer.price?.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Right Side: Symbol + Change % */}
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-sm font-medium text-gray-400 uppercase">
                                    {peer.symbol}
                                </span>
                                <span className={`text-sm font-bold ${peer.changePercent >= 0 ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                                    {peer.changePercent > 0 ? '+' : ''}{peer.changePercent?.toFixed(2)}%
                                </span>
                            </div>

                        </div>
                    </Link>
                ))
            ) : (
                <div className="py-10 text-center text-gray-500">No related stocks found.</div>
            )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RelatedStocks;