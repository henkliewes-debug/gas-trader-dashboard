import { prisma } from './db';

// NBP=F doesn't exist on Yahoo Finance. We fetch TTF from Yahoo and derive NBP.
// NBP (GBp/therm) ≈ TTF (EUR/MWh) * 3.3  (approximate market conversion)
const NBP_TTF_RATIO = 3.3;

async function fetchYahooPrice(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=3mo`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 300 } });
  const data = await res.json();
  return data?.chart?.result?.[0] ?? null;
}

export async function fetchGasPrices() {
  const results = [];

  // --- TTF ---
  try {
    const result = await fetchYahooPrice('TTF=F');
    const meta = result?.meta;
    if (meta?.regularMarketPrice > 0) {
      const ttfPrice = meta.regularMarketPrice;
      const ttfChange = meta.regularMarketChange || 0;
      const ttfChangePct = meta.regularMarketChangePercent || 0;

      results.push({
        symbol: 'TTF',
        price: ttfPrice,
        change: ttfChange,
        changePercent: ttfChangePct,
        high: meta.regularMarketDayHigh,
        low: meta.regularMarketDayLow,
      });

      // Derive NBP from TTF
      const nbpPrice = Number((ttfPrice * NBP_TTF_RATIO).toFixed(3));
      const nbpChange = Number((ttfChange * NBP_TTF_RATIO).toFixed(3));
      results.push({
        symbol: 'NBP',
        price: nbpPrice,
        change: nbpChange,
        changePercent: ttfChangePct,
        high: meta.regularMarketDayHigh ? Number((meta.regularMarketDayHigh * NBP_TTF_RATIO).toFixed(3)) : undefined,
        low: meta.regularMarketDayLow ? Number((meta.regularMarketDayLow * NBP_TTF_RATIO).toFixed(3)) : undefined,
      });
    }
  } catch (e) {
    console.error('Yahoo Finance TTF fetch failed:', e);
  }

  // Fallback to DB if Yahoo failed
  if (results.length === 0) {
    for (const symbol of ['TTF', 'NBP']) {
      try {
        const latest = await prisma.gasPrice.findFirst({ where: { symbol }, orderBy: { timestamp: 'desc' } });
        const prev = await prisma.gasPrice.findFirst({ where: { symbol }, orderBy: { timestamp: 'desc' }, skip: 1 });
        const price = latest?.price ?? 0;
        const prevPrice = prev?.price ?? price;
        const change = price - prevPrice;
        const changePercent = prevPrice > 0 ? (change / prevPrice) * 100 : 0;
        results.push({ symbol, price, change, changePercent, high: latest?.high ?? price, low: latest?.low ?? price });
      } catch (e) {
        results.push({ symbol, price: 0, change: 0, changePercent: 0 });
      }
    }
  }

  return results;
}

export async function fetchPriceHistory(symbol: string) {
  try {
    // TTF history from Yahoo; NBP derived from TTF history
    const yahooResult = await fetchYahooPrice('TTF=F');
    const timestamps = yahooResult?.timestamp || [];
    const closes = yahooResult?.indicators?.quote?.[0]?.close || [];
    if (timestamps.length > 0) {
      const multiplier = symbol === 'NBP' ? NBP_TTF_RATIO : 1;
      return timestamps.map((ts: number, i: number) => ({
        date: new Date(ts * 1000).toISOString().split('T')[0],
        price: closes[i] != null ? Number((closes[i] * multiplier).toFixed(3)) : null,
      })).filter((d: { price: number | null }) => d.price !== null);
    }
  } catch (e) {
    console.error('Yahoo history failed:', e);
  }

  // DB fallback
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const history = await prisma.gasPrice.findMany({
      where: { symbol, timestamp: { gte: ninetyDaysAgo } },
      orderBy: { timestamp: 'asc' },
    });
    return history.map((h: { timestamp: Date; price: number }) => ({
      date: h.timestamp.toISOString().split('T')[0],
      price: h.price,
    }));
  } catch (e) {
    return [];
  }
}
