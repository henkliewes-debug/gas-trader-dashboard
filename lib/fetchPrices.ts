export async function fetchGasPrices() {
  const symbols = { TTF: 'TTF=F', NBP: 'NBP=F' }
  const results = []
  for (const [name, symbol] of Object.entries(symbols)) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 300 } })
      const data = await res.json()
      const quote = data?.chart?.result?.[0]?.meta
      if (quote) results.push({
        symbol: name,
        price: quote.regularMarketPrice || 0,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        high: quote.regularMarketDayHigh,
        low: quote.regularMarketDayLow,
      })
    } catch (e) { console.error(`Failed to fetch ${name}:`, e) }
  }
  return results
}

export async function fetchPriceHistory(symbol: string) {
  const yahooSymbol = symbol === 'TTF' ? 'TTF=F' : 'NBP=F'
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=3mo`
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  const data = await res.json()
  const timestamps = data?.chart?.result?.[0]?.timestamp || []
  const closes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []
  return timestamps.map((ts: number, i: number) => ({
    date: new Date(ts * 1000).toISOString().split('T')[0],
    price: closes[i] ? Number(closes[i].toFixed(3)) : null,
  })).filter((d: any) => d.price !== null)
}
