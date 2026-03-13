import { prisma } from './db';

export async function fetchGasPrices() {
  const symbols = ['TTF', 'NBP'];
  const results = [];

  for (const symbol of symbols) {
    try {
      // Get latest price from DB
      const latest = await prisma.gasPrice.findFirst({
        where: { symbol },
        orderBy: { timestamp: 'desc' },
      });

      const prev = await prisma.gasPrice.findFirst({
        where: { symbol },
        orderBy: { timestamp: 'desc' },
        skip: 1,
      });

      const price = latest?.price ?? 0;
      const prevPrice = prev?.price ?? price;
      const change = price - prevPrice;
      const changePercent = prevPrice > 0 ? (change / prevPrice) * 100 : 0;
      const high = latest?.high ?? price;
      const low = latest?.low ?? price;

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

    const history = await prisma.gasPrice.findMany({
      where: { symbol, timestamp: { gte: ninetyDaysAgo } },
      orderBy: { timestamp: 'asc' },
    });

    return history.map((h: { timestamp: Date; price: number }) => ({
      date: h.timestamp.toISOString().split('T')[0],
      price: h.price,
    }));
  } catch (e) {
    console.error('fetchPriceHistory error', e);
    return [];
  }
}
