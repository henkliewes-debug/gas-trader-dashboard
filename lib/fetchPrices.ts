import { prisma } from './db';

export async function fetchGasPrices() {
  const symbols = { TTF: 'TTF=F', NBP: 'NBP=F' }
  const results = []
  for (const [name, symbol] of Object.entries(symbols)) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 300 } })
      const data = await res.json()
      const quote = data?.chart?.result?.[0]?.meta
      if (quote && quote.regularMarketPrice > 0) {
        results.push({
          symbol: name,
          price: quote.regularMarketPrice || 0,
          change: quote.regularMarketChange || 0,
          changePercent: quote.regularMarketChangePercent || 0,
          high: quote.regularMarketDayHigh,
          low: quote.regularMarketDayLow,
        })
        continue
      }
    } catch (e) { console.error(`Yahoo Finance failed for ${name}:`, e) }

    // Fallback: use latest price from DB history
    try {
      const latest = await prisma.gasPrice.findFirst({
        where: { symbol: name },
        orderBy: { timestamp: 'desc' },
      });
      const prev = await prisma.gasPrice.findFirst({
        where: { symbol: name },
        orderBy: { timestamp: 'desc' },
        skip: 1,
      });
      const price = latest?.price ?? 0;
      const prevPrice = prev?.price ?? price;
      const change = price - prevPrice;
      const changePercent = prevPrice > 0 ? (change / prevPrice) * 100 : 0;
      results.push({ symbol: name, price, change, changePercent, high: latest?.high ?? price, low: latest?.low ?? price });
    } catch (e) {
      console.error(`DB fallback failed for ${name}:`, e);
      results.push({ symbol: name, price: 0, change: 0, changePercent: 0 });
    }
  }
  return results
}

export async function fetchPriceHistory(symbol: string) {
  // Try Yahoo Finance first
  try {
    const yahooSymbol = symbol === 'TTF' ? 'TTF=F' : 'NBP=F'
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=3mo`
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    const data = await res.json()
    const timestamps = data?.chart?.result?.[0]?.timestamp || []
    const closes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []
    if (timestamps.length > 0) {
      return timestamps.map((ts: number, i: number) => ({
        date: new Date(ts * 1000).toISOString().split('T')[0],
        price: closes[i] ? Number(closes[i].toFixed(3)) : null,
      })).filter((d: any) => d.price !== null)
    }
  } catch (e) { console.error('Yahoo history failed:', e) }

  // Fallback: DB history
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
    console.error('DB history fallback failed:', e);
    return [];
  }
}
