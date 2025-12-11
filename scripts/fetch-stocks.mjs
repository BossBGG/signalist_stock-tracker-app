import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { symbol } from 'zod';

dotenv.config({ path: '.env' }); 

const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

async function fetchAllStocks() {
    if(!FINNHUB_API_KEY) {
        console.error('Error: FINNHUB_API_KEY is missing in .env.local');
        return;
    }

    try {
        console.log('Fetching stock symbols from Finnhub...');

        const respose = await fetch(
            `https://finnhub.io/api/v1/stock/symbol?exchange=US&token=${FINNHUB_API_KEY}`
        );

        const data = await respose.json();

        const filteredStocks = data.filter(item => item.type === 'Common Stock').map(item => ({
            symbol: item.symbol,
            description: item.description,
            displaySymbol: item.displaySymbol,
        }));

        console.log(`Fetched ${filteredStocks.length} stocks.`);

        const outputPath = path.join(process.cwd(), 'lib','data','stocks.json');

        const dir = path.dirname(outputPath);
        if(!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(outputPath, JSON.stringify(filteredStocks, null, 2));
        console.log(`Successfully saved to ${outputPath}`);

    } catch (error) {
        console.error("Error: ", error);
    }
}

fetchAllStocks();