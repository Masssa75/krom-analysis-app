interface TokenPrice {
  usd: number;
  timestamp: number;
}

interface OHLCVData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  price_usd: number;
  fdv_usd?: number;
  market_cap_usd?: number;
  pool_address?: string;
  total_supply?: string;
  circulating_supply?: string;
}

const GECKOTERMINAL_BASE_URL = 'https://api.geckoterminal.com/api/v2';
const COINGECKO_BASE_URL = 'https://pro-api.coingecko.com/api/v3';

export class GeckoTerminalAPI {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Helper to add delay between requests to respect rate limits
  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get token info by contract address
  async getTokenInfo(network: string, address: string): Promise<TokenInfo | null> {
    try {
      const url = `${GECKOTERMINAL_BASE_URL}/networks/${network}/tokens/${address}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch token info: ${response.status}`);
      }
      
      const data = await response.json();
      const token = data.data?.attributes;
      
      if (!token) return null;
      
      return {
        address: address,
        name: token.name,
        symbol: token.symbol,
        price_usd: parseFloat(token.price_usd || '0'),
        fdv_usd: parseFloat(token.fdv_usd || '0'),
        market_cap_usd: parseFloat(token.market_cap_usd || '0'),
        total_supply: token.total_supply,
        circulating_supply: token.circulating_supply,
      };
    } catch (error) {
      console.error('Error fetching token info:', error);
      return null;
    }
  }

  // Get pools for a token
  async getTokenPools(network: string, tokenAddress: string): Promise<any[]> {
    try {
      const url = `${GECKOTERMINAL_BASE_URL}/networks/${network}/tokens/${tokenAddress}/pools`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch token pools: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching token pools:', error);
      return [];
    }
  }

  // Get historical OHLCV data for a pool
  async getHistoricalOHLCV(
    network: string, 
    poolAddress: string, 
    timeframe: 'day' | 'hour' | 'minute' = 'day',
    aggregate: number = 1,
    beforeTimestamp?: number,
    limit: number = 100
  ): Promise<OHLCVData[]> {
    try {
      let url = `${GECKOTERMINAL_BASE_URL}/networks/${network}/pools/${poolAddress}/ohlcv/${timeframe}`;
      
      const params = new URLSearchParams();
      params.append('aggregate', aggregate.toString());
      params.append('limit', limit.toString());
      params.append('currency', 'usd');
      
      if (beforeTimestamp) {
        params.append('before_timestamp', beforeTimestamp.toString());
      }
      
      url += '?' + params.toString();
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch OHLCV data: ${response.status}`);
      }
      
      const data = await response.json();
      const ohlcvArray = data.data?.attributes?.ohlcv_list || [];
      
      return ohlcvArray.map((item: any[]) => ({
        timestamp: item[0],
        open: item[1],
        high: item[2],
        low: item[3],
        close: item[4],
        volume: item[5]
      }));
    } catch (error) {
      console.error('Error fetching OHLCV data:', error);
      return [];
    }
  }

  // Get token price at a specific timestamp
  async getTokenPriceAtTimestamp(
    network: string,
    tokenAddress: string,
    targetTimestamp: number
  ): Promise<number | null> {
    try {
      // First, get the pools for this token
      const pools = await this.getTokenPools(network, tokenAddress);
      
      if (pools.length === 0) {
        console.log('No pools found for token');
        return null;
      }
      
      // Sort pools by liquidity/volume to get the most liquid pool
      const sortedPools = pools.sort((a, b) => {
        const liquidityA = parseFloat(a.attributes?.reserve_in_usd || '0');
        const liquidityB = parseFloat(b.attributes?.reserve_in_usd || '0');
        return liquidityB - liquidityA;
      });
      
      const mainPool = sortedPools[0];
      const poolAddress = mainPool.attributes?.address;
      
      if (!poolAddress) {
        console.log('No valid pool address found');
        return null;
      }
      
      // Add small delay to respect rate limits
      await this.delay(100);
      
      // Get OHLCV data around the target timestamp
      const ohlcvData = await this.getHistoricalOHLCV(
        network,
        poolAddress,
        'day',
        1,
        targetTimestamp + 86400, // Add 1 day to get data before this timestamp
        30 // Get 30 days of data
      );
      
      if (ohlcvData.length === 0) {
        console.log('No OHLCV data found');
        return null;
      }
      
      // Find the closest price to our target timestamp
      let closestPrice = null;
      let closestTimeDiff = Infinity;
      
      for (const candle of ohlcvData) {
        const timeDiff = Math.abs(candle.timestamp - targetTimestamp);
        if (timeDiff < closestTimeDiff) {
          closestTimeDiff = timeDiff;
          closestPrice = candle.close;
        }
      }
      
      return closestPrice;
    } catch (error) {
      console.error('Error getting token price at timestamp:', error);
      return null;
    }
  }

  // Get ATH (All Time High) since a specific timestamp
  async getATHSinceTimestamp(
    network: string,
    tokenAddress: string,
    sinceTimestamp: number
  ): Promise<{ price: number; timestamp: number } | null> {
    try {
      // Get pools
      const pools = await this.getTokenPools(network, tokenAddress);
      
      if (pools.length === 0) {
        return null;
      }
      
      // Get the most liquid pool
      const sortedPools = pools.sort((a, b) => {
        const liquidityA = parseFloat(a.attributes?.reserve_in_usd || '0');
        const liquidityB = parseFloat(b.attributes?.reserve_in_usd || '0');
        return liquidityB - liquidityA;
      });
      
      const mainPool = sortedPools[0];
      const poolAddress = mainPool.attributes?.address;
      
      if (!poolAddress) {
        return null;
      }
      
      let allOHLCV: OHLCVData[] = [];
      let currentTimestamp = Math.floor(Date.now() / 1000);
      
      // Fetch OHLCV data in batches going backwards from current time
      while (currentTimestamp > sinceTimestamp) {
        await this.delay(100); // Rate limit delay
        
        const batch = await this.getHistoricalOHLCV(
          network,
          poolAddress,
          'day',
          1,
          currentTimestamp,
          1000 // Max limit
        );
        
        if (batch.length === 0) break;
        
        allOHLCV = [...allOHLCV, ...batch];
        
        // Update timestamp to the oldest candle in this batch
        currentTimestamp = batch[batch.length - 1].timestamp - 86400; // Go back 1 day
        
        // If we've gone far enough back, stop
        if (currentTimestamp < sinceTimestamp) break;
      }
      
      // Filter to only include data since our target timestamp
      const relevantData = allOHLCV.filter(candle => candle.timestamp >= sinceTimestamp);
      
      if (relevantData.length === 0) {
        return null;
      }
      
      // Find the highest price
      let maxPrice = 0;
      let maxPriceTimestamp = 0;
      
      for (const candle of relevantData) {
        if (candle.high > maxPrice) {
          maxPrice = candle.high;
          maxPriceTimestamp = candle.timestamp;
        }
      }
      
      return {
        price: maxPrice,
        timestamp: maxPriceTimestamp
      };
    } catch (error) {
      console.error('Error getting ATH:', error);
      return null;
    }
  }

  // Get current token price
  async getCurrentPrice(network: string, tokenAddress: string): Promise<number | null> {
    try {
      const tokenInfo = await this.getTokenInfo(network, tokenAddress);
      return tokenInfo?.price_usd || null;
    } catch (error) {
      console.error('Error getting current price:', error);
      return null;
    }
  }

  // Calculate market cap from price and supply
  calculateMarketCap(price: number | null, supply: string | null): number | null {
    if (!price || !supply) return null;
    
    try {
      const supplyNum = parseFloat(supply);
      if (isNaN(supplyNum) || supplyNum <= 0) return null;
      
      return price * supplyNum;
    } catch (error) {
      console.error('Error calculating market cap:', error);
      return null;
    }
  }

  // Get comprehensive token data with market caps at different price points
  async getTokenDataWithMarketCaps(
    network: string,
    tokenAddress: string,
    callTimestamp: number
  ): Promise<{
    tokenInfo: TokenInfo | null;
    priceAtCall: number | null;
    currentPrice: number | null;
    ath: { price: number; timestamp: number } | null;
    marketCapAtCall: number | null;
    currentMarketCap: number | null;
    athMarketCap: number | null;
    fdvAtCall: number | null;
    currentFDV: number | null;
    athFDV: number | null;
  }> {
    try {
      // Get current token info (includes current price and FDV)
      const tokenInfo = await this.getTokenInfo(network, tokenAddress);
      
      if (!tokenInfo) {
        return {
          tokenInfo: null,
          priceAtCall: null,
          currentPrice: null,
          ath: null,
          marketCapAtCall: null,
          currentMarketCap: null,
          athMarketCap: null,
          fdvAtCall: null,
          currentFDV: null,
          athFDV: null
        };
      }
      
      // Get historical prices
      const [priceAtCall, athData] = await Promise.all([
        this.getTokenPriceAtTimestamp(network, tokenAddress, callTimestamp),
        this.getATHSinceTimestamp(network, tokenAddress, callTimestamp)
      ]);
      
      const currentPrice = tokenInfo.price_usd;
      
      // For simplicity, we'll focus on FDV which we can calculate from total supply
      // First try to get FDV from API, otherwise calculate it
      let currentFDV = tokenInfo.fdv_usd || null;
      
      // If no FDV from API but we have total supply, calculate it
      if (!currentFDV && tokenInfo.total_supply && currentPrice) {
        const supply = parseFloat(tokenInfo.total_supply);
        // Most tokens have 18 decimals, but some have different amounts
        // GeckoTerminal's total_supply should already be adjusted for decimals
        currentFDV = currentPrice * supply;
      }
      
      // Calculate historical FDVs based on price ratios
      let fdvAtCall = null;
      let athFDV = null;
      
      if (currentFDV && currentPrice && currentPrice > 0) {
        // Calculate FDVs based on price ratios
        if (priceAtCall) {
          fdvAtCall = (priceAtCall / currentPrice) * currentFDV;
        }
        if (athData?.price) {
          athFDV = (athData.price / currentPrice) * currentFDV;
        }
      }
      
      // For now, set market caps to same as FDV (can be refined later)
      const currentMarketCap = currentFDV;
      const marketCapAtCall = fdvAtCall;
      const athMarketCap = athFDV;
      
      return {
        tokenInfo,
        priceAtCall,
        currentPrice,
        ath: athData,
        marketCapAtCall,
        currentMarketCap,
        athMarketCap,
        fdvAtCall,
        currentFDV,
        athFDV
      };
    } catch (error) {
      console.error('Error getting token data with market caps:', error);
      return {
        tokenInfo: null,
        priceAtCall: null,
        currentPrice: null,
        ath: null,
        marketCapAtCall: null,
        currentMarketCap: null,
        athMarketCap: null,
        fdvAtCall: null,
        currentFDV: null,
        athFDV: null
      };
    }
  }

  // Determine network from contract address (basic heuristic)
  static guessNetwork(contractAddress: string): string {
    // Basic heuristic - can be improved
    if (contractAddress.startsWith('0x') && contractAddress.length === 42) {
      // Could be Ethereum, BSC, Polygon, etc.
      // For now, default to Ethereum
      return 'eth';
    } else if (contractAddress.length >= 32 && contractAddress.length <= 44) {
      // Likely Solana
      return 'solana';
    }
    
    // Default to Ethereum
    return 'eth';
  }
}