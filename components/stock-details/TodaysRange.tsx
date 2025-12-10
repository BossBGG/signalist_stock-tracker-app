import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TodaysRangeProps {
  low: number;
  high: number;
  current: number;
  open: number;
  prevClose: number; 
}

const TodaysRange = ({ low, high, open }: TodaysRangeProps) => {
  return (
    
    <Card className="bg-[#161616] border-none rounded-lg p-6 shadow-none text-white w-full ">
      <CardHeader className="px-0 pt-0 ">
        <CardTitle className="text-lg font-bold text-white tracking-wide">
          Today's Range
        </CardTitle>
      </CardHeader>
      
      <CardContent className="px-0 pb-0">
        <div className="flex flex-col space-y-5">
          
          {/* Open Section: Yellow Dot, White Value */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]"></div>
              <span className="text-base text-gray-300 font-medium">Open:</span>
            </div>
            <span className="text-xl font-medium text-white">
              ${open?.toFixed(2)}
            </span>
          </div>

          {/* High Section: Cyan/Teal Dot, Cyan/Teal Value */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]"></div>
              <span className="text-base text-gray-300 font-medium">High:</span>
            </div>
            <span className="text-xl font-medium text-teal-400">
              ${high?.toFixed(2)}
            </span>
          </div>

          {/* Low Section: Red Dot, Red Value */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
              <span className="text-base text-gray-300 font-medium">Low:</span>
            </div>
            <span className="text-xl font-medium text-red-500">
              ${low?.toFixed(2)}
            </span>
          </div>

        </div>
      </CardContent>
    </Card>
  );
};

export default TodaysRange;