import { NextResponse } from 'next/server';

// TTF forward contracts on Yahoo Finance (NYM exchange)
// Month codes: F=Jan, G=Feb, H=Mar, J=Apr, K=May, M=Jun, N=Jul, Q=Aug, U=Sep, V=Oct, X=Nov, Z=Dec
const FORWARD_SYMBOLS = [
  { label: 'APR-26', yahoo: 'TTFJ26.NYM' },
  { label: 'MAY-26', yahoo: 'TTFK26.NYM' },
  { label: 'JUN-26', yahoo: 'TTFM26.NYM' },
  { label: 'JUL-26', yahoo: 'TTFN26.NYM' },
  { label: 'AUG-26', yahoo: 'TTFQ26.NYM' },
  { label: 'SEP-26', yahoo: 'TTFU26.NYM' },
];

async function fetchYahooSpot(symbol: string): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 300 } });
    const data = await res.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return typeof price === 'number' && price > 0 ? price : null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const prices = await Promise.all(
      FORWARD_SYMBOLS.map(async ({ label, yahoo }) => {
        const price = await fetchYahooSpot(yahoo);
        return { label, price };
      })
    );

    const available = prices.filter(p => p.price !== null);

    // Derived aggregates
    const apr = available.find(p => p.label === 'APR-26')?.price;
    const may = available.find(p => p.label === 'MAY-26')?.price;
    const jun = available.find(p => p.label === 'JUN-26')?.price;
    const jul = available.find(p => p.label === 'JUL-26')?.price;
    const aug = available.find(p => p.label === 'AUG-26')?.price;
    const sep = available.find(p => p.label === 'SEP-26')?.price;

    const avg = (vals: (number | undefined)[]) => {
      const valid = vals.filter((v): v is number => typeof v === 'number');
      return valid.length > 0 ? Number((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(3)) : null;
    };

    const q226 = avg([apr, may, jun]);
    const sum26 = avg([apr, may, jun, jul, aug, sep]);

    const aggregates = [
      { label: 'Q2-26', price: q226, note: 'Apr–Jun avg' },
      { label: 'SUM-26', price: sum26, note: 'Apr–Sep avg' },
      { label: 'CAL-27', price: null, note: 'N/A on Yahoo' },
    ];

    return NextResponse.json({ months: prices, aggregates });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch forwards' }, { status: 500 });
  }
}
