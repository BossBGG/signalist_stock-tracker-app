import stocksData from '@/lib/data/stocks.json';
import { symbol } from 'zod';

export const searchStocks = (query: string) => {
    if(!query) return [];

    const lowerQuery = query.toLowerCase();

    const filteredStocks = stocksData.filter((stock: any) => 
        (stock.symbol && stock.symbol.toLowerCase().includes(lowerQuery)) 
    ).slice(0,20);

    return filteredStocks.map((stock: any) => ({
        symbol: stock.symbol,
        name: stock.description,
        exchange: '',
        type: '',
        isInWatchlist: false
    }))
}