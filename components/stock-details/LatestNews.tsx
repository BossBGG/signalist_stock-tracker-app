"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTimeAgo } from "@/lib/utils";

const LatestNews = ({ news }: { news: any[] }) => {
  const newsList = news.filter((n) => n.headline && n.image).slice(0, 3);

  return (
    <Card className="bg-[#161616] border-none shadow-none p-6 text-white h-full w-full">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl font-bold text-white tracking-wide">
          Latest News
        </CardTitle>
      </CardHeader>

      <CardContent className="px-0 p-0">
        {newsList.length > 0 ? (
          <div className="space-y-6">
            {newsList.map((item) => (
              <div
                key={item.id}
                className="group flex gap-4 md:gap-6 items-start border-b border-gray-800 pb-6 last:border-0 last:pb-0"
              >
                {/* Left Side: Content */}
                <div className="flex-1 flex flex-col justify-between">
                  {/* Source & Time */}
                  <div className="flex items-center text-sm text-gray-400 mb-2 font-medium">
                    <span>{item.source}</span>
                    <span className="mx-2 text-gray-600">•</span>
                    <span>{getTimeAgo(item.datetime)}</span>
                  </div>

                  {/* Headline */}
                  <h3 className="text-base md:text-lg font-semibold text-gray-100 leading-snug mb-4 group-hover:text-blue-400 transition-colors line-clamp-2">
                    {item.headline}
                  </h3>

                  {/* Read More Button */}
                  <div className="mt-auto">
                    <a href={item.url} target="_blank" rel="noreferrer">
                      <Button
                        variant="secondary"
                        className="bg-[#27272a] hover:bg-[#3f3f46] text-gray-300 hover:text-white rounded-full h-8 px-4 text-xs font-medium border border-gray-700"
                      >
                        Read More
                      </Button>
                    </a>
                  </div>
                </div>

                {/* Right Side: Thumbnail Image */}
                <div className="flex-shrink-0 w-32 h-20 md:w-40 md:h-24 bg-gray-800 rounded-lg overflow-hidden">
                  <img
                    src={item.image}
                    alt="news thumbnail"
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-gray-500">
            No news available.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LatestNews;
