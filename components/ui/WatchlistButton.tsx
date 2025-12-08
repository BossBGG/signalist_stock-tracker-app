"use client";

import { toggleWatchlist } from "@/lib/actions/watchlist.actions";
import { cn } from "@/lib/utils";
import { Plus, Star, Trash2 } from "lucide-react";
import React, { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

// Minimal WatchlistButton implementation to satisfy page requirements.
// This component focuses on UI contract only. It toggles local state and
// calls onWatchlistChange if provided. Styling hooks match globals.css.

const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist,
  showTrashIcon = false,
  type = "button",
  onWatchlistChange,
}: WatchlistButtonProps) => {
  const [added, setAdded] = useState<boolean>(!!isInWatchlist);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setAdded(isInWatchlist);
  }, [isInWatchlist]);

  const label = useMemo(() => {
    if (type === "icon") return added ? "" : "";
    return added ? "Remove from Watchlist" : "Add to Watchlist";
  }, [added, type]);

  const handleClick = async (e: React.MouseEvent) => {

    e.preventDefault();
    e.stopPropagation();

    const nextState = !added;
    setAdded(nextState);
    if(onWatchlistChange) onWatchlistChange(symbol, nextState);
  
    startTransition(async () => {
      const result = await toggleWatchlist(symbol, company, nextState);
      if(!result.success) {
        setAdded(!nextState);
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
            className={cn("h-5 w-5", added ? "fill-yellow-500 text-yellow-500" : "text-gray-500")} 
        />
      </button>
    );
  }

  return (
    <button
      disabled={isPending}
      onClick={handleClick}
      className={cn(
        "watchlist-btn flex items-center justify-center gap-2",
        added ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-yellow-500 text-black hover:bg-yellow-400"
      )}
    >
      {added ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
      <span>{added ? "Remove from Watchlist" : "Add to Watchlist"}</span>
    </button>
  );
};

export default WatchlistButton;
