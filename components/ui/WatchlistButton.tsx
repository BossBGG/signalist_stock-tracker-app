"use client";

import { toggleWatchlist } from "@/lib/actions/watchlist.actions";
import { cn } from "@/lib/utils";
import { Plus, Star, Trash2 } from "lucide-react";
import React, { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "./button";

// Minimal WatchlistButton implementation to satisfy page requirements.
// This component focuses on UI contract only. It toggles local state and
// calls onWatchlistChange if provided. Styling hooks match globals.css.


const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist,
  showTrashIcon = false,
  initialIsSaved,
  type = "button",
  onWatchlistChange,
}: WatchlistButtonProps) => {
  const [isSaved, setIsSaved] = useState<boolean>(initialIsSaved ?? isInWatchlist ?? false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setIsSaved(initialIsSaved ?? isInWatchlist ?? false);
  }, [isInWatchlist, initialIsSaved]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const nextState = !isSaved;
    setIsSaved(nextState);
    if(onWatchlistChange) onWatchlistChange(symbol, nextState);
  
    startTransition(async () => {
      const result = await toggleWatchlist(symbol, company, nextState);
      if(!result.success) {
        setIsSaved(!nextState);
        toast.error("Failed to update watchlist")
      } else {
        toast.success(nextState ? `Added ${symbol}` : `Removed ${symbol}`);
      }
    });
  };

  if (type === "icon") {
    return (
      <button
        disabled={isPending}
        onClick={handleClick}
        className="p-2 hover:bg-gray-800 rounded-full transition-colors z-50 relative"
      >
        <Star 
            className={cn("h-5 w-5", isSaved ? "fill-yellow-500 text-yellow-500" : "text-gray-500")} 
        />
      </button>
    );
  }

  return (
    <Button
      disabled={isPending}
      onClick={handleClick}
      variant={isSaved ? "secondary" : "default"}
      className={cn(
        "watchlist-btn flex items-center justify-center gap-2",
        isSaved ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-yellow-500 text-black hover:bg-yellow-400"
      )}
    >
      {isSaved ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
      <span>{isSaved ? "Remove from Watchlist" : "Add to Watchlist"}</span>
    </Button>
  );
};

export default WatchlistButton;
