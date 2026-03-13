import { prisma } from './db';

export async function fetchGasPrices() {
  const symbols = ['TTF', 'NBP'];
  const results = [];

  for (const symbol of symbols) {
    try {
      // Get latest price from DB history
      const latest = await prisma.priceHistory.findFirst({
        where: { symbol },
        orderBy: { date: 'desc' },
      });

      const prev = await prisma.priceHistory.findFirst({
        where: { symbol },
        orderBy: { date: 'desc' },
        skip: 1,
      });

      const price = latest?.price ?? 0;
      const prevPrice = prev?.price ?? price;
      const change = price - prevPrice;
      const changePercent = prevPrice > 0 ? (change / prevPrice) * 100 : 0;

      // For TTF also get high/low from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const history30 = await prisma.priceHistory.findMany({
        where: { symbol, date: { gte: thirtyDaysAgo } },
        orderBy: { date: 'asc' },
      });
      const prices30 = history30.map((h: { price: number }) => h.price);
      const high = prices30.length ? Math.max(...prices30) : price;
      const low = prices30.length ? Math.min(...prices30) : price;

      results.push({ symbol, price, change, changePercent, high, low });
    } catch (e) {
      console.error('fetchGasPrices error for', symbol, e);
      results.push({ symbol, price: 0, change: 0, changePercent: 0 });
    }
  }

  return results;
}

export async function fetchPriceHistory(symbol: string) {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const history = await prisma.priceHistory.findMany({
      where: { symbol, date: { gte: ninetyDaysAgo } },
      orderBy: { date: 'asc' },
    });

    return history.map((h: { date: Date; price: number }) => ({
      date: h.date.toISOString().split('T')[0],
      price: h.price,
    }));
  } catch (e) {
    console.error('fetchPriceHistory error', e);
    return [];
  }
}
