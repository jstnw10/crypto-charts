const BASE_URL = `https://benchmarks.pyth.network/v1`;

export type Benchmark = {
  s: string;
  t: number[];
  o: number[];
  h: number[];
  l: number[];
  c: number[];
  v: number[];
};

export async function getBenchmarkData(ticker = "BTC/USD"): Promise<Benchmark> {
  const now = Date.now() / 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
  const searchParams = new URLSearchParams({ symbol: `Crypto.${ticker}`, resolution: "60", from: thirtyDaysAgo.toFixed(0), to: now.toFixed(0) });
  const url = `${BASE_URL}/shims/tradingview/history?${searchParams.toString()}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return (await res.json()) as Benchmark;
}

type ComplexPriceFeed = {
  id: string;
  market_hours: Market_hours;
  attributes: Attributes;
};
type Market_hours = {
  is_open: boolean;
  next_open: null;
  next_close: null;
};
type Attributes = {
  symbol: string;
  asset_type: string;
  base: string;
  description: string;
  generic_symbol: string;
  publish_interval: string;
  quote_currency: string;
  weekly_schedule: string;
};

export type SimplePriceFeed = {
  symbol: string;
  description: string;
  base: string;
};

export async function getPriceFeedsData(): Promise<SimplePriceFeed[]> {
  const url = `${BASE_URL}/price_feeds/?asset_type=crypto`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();

  const priceFeedData: ComplexPriceFeed[] = data;

  return priceFeedData.map((priceFeed) => {
    return {
      symbol: priceFeed.attributes.symbol.replace("Crypto.", ""),
      description: priceFeed.attributes.description,
      base: priceFeed.attributes.base,
    };
  });
}
