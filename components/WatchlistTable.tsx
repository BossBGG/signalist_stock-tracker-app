"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Assuming you have shadcn table installed
import { WATCHLIST_TABLE_HEADER } from "@/lib/constants";
import { formatMarketCap, formatPrice, getChangeColorClass } from "@/lib/utils";
import WatchlistButton from "./ui/WatchlistButton";
import { Button } from "./ui/button";

interface WatchlistTableProps {
  watchlist: any[];
  onAddAlert: (symbol: string, company: string) => void;
}

const WatchlistTable = ({ watchlist, onAddAlert }: WatchlistTableProps) => {
  return (
    <div className="watchlist-table">
      <Table>
        <TableHeader>
          <TableRow className="table-header-row hover:bg-gray-700 border-gray-600">
            {WATCHLIST_TABLE_HEADER.map((head) => (
              <TableHead key={head} className="table-header text-gray-400">
                {head}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {watchlist.length === 0 ? (
             <TableRow>
                <TableCell colSpan={8} className="text-center  text-gray-500  py-10 items-center justify-center">
                    Your watchlist is empty. Add stocks to track them.
                </TableCell>
             </TableRow>
          ) : (
            watchlist.map((stock) => (
                <TableRow key={stock.symbol} className="table-row">
                <TableCell className="table-cell font-bold text-white">{stock.company}</TableCell>
                <TableCell className="table-cell">{stock.symbol}</TableCell>
                <TableCell className="table-cell">{formatPrice(stock.currentPrice)}</TableCell>
                <TableCell className={`table-cell ${getChangeColorClass(stock.changePercent)}`}>
                    {stock.changePercent > 0 ? "+" : ""}
                    {stock.changePercent.toFixed(2)}%
                </TableCell>
                <TableCell className="table-cell">{formatMarketCap(stock.marketCap)}</TableCell>
                <TableCell className="table-cell">{stock.peRatio || 'N/A'}</TableCell>
                <TableCell className="table-cell">
                    <Button 
                        onClick={() => onAddAlert(stock.symbol, stock.company)}
                        className="add-alert"
                    >
                        Add Alert
                    </Button>
                </TableCell>
                <TableCell className="table-cell">
                    <div className="flex items-center">
                        <WatchlistButton 
                            symbol={stock.symbol} 
                            company={stock.company} 
                            isInWatchlist={true} 
                            type="icon"
                            showTrashIcon={true}
                        />
                    </div>
                </TableCell>
                </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default WatchlistTable;