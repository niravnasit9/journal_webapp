export interface PnLParams {
  symbol: string;
  direction: "BUY" | "SELL";
  lotSize: number;
  openPrice: number;
  closePrice: number;
  accountCurrency: "USD" | "INR";
  usdInrRate: number; // Used only if accountCurrency === "INR"
}

export function calculatePnL(params: PnLParams): number {
  const { symbol, direction, lotSize, openPrice, closePrice, accountCurrency, usdInrRate } = params;

  if (!openPrice || !closePrice || !lotSize) return 0;

  let contractSize = 100000; // Default Standard Forex Lot
  let isCrypto = false;
  let isJpyPair = symbol.toUpperCase().includes("JPY");
  let isXau = symbol.toUpperCase().includes("XAU") || symbol.toUpperCase() === "GOLD";
  let isIndices = symbol.toUpperCase().includes("US30") || symbol.toUpperCase().includes("NAS") || symbol.toUpperCase().includes("SPX");

  const sym = symbol.toUpperCase();

  // Basic Heuristics for Contract Sizes
  if (sym.includes("BTC") || sym.includes("ETH") || sym.includes("XRP") || sym.includes("SOL")) {
    isCrypto = true;
    contractSize = 1; // 1 lot = 1 coin for crypto usually
  } else if (isXau) {
    contractSize = 100; // 1 lot = 100 oz of gold
  } else if (isIndices) {
    contractSize = 1; // Sometimes 10, but usually 1 unit per lot for indices CFDs
  }

  const priceDifference = direction === "BUY" ? (closePrice - openPrice) : (openPrice - closePrice);
  
  let profitInQuoteCurrency = priceDifference * lotSize * contractSize;

  // If Forex, quote currency is the second half of the pair (e.g. EURUSD -> USD)
  // For JPY pairs, profit is in JPY. We need to convert it to USD.
  // We approximate the JPYUSD conversion using the close price if it's XXXJPY.
  if (isJpyPair) {
    profitInQuoteCurrency = profitInQuoteCurrency / closePrice;
  }

  // By now, profitInQuoteCurrency is roughly in USD for XXXUSD pairs or Crypto against USD.
  let profitInUSD = profitInQuoteCurrency;

  // Convert to INR if necessary
  if (accountCurrency === "INR") {
    return profitInUSD * usdInrRate;
  }

  return profitInUSD;
}
