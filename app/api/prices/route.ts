import { NextResponse } from 'next/server'
import { fetchGasPrices, fetchPriceHistory } from '@/lib/fetchPrices'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const history = searchParams.get('history')
  const symbol = searchParams.get('symbol') || 'TTF'
  try {
    if (history) return NextResponse.json(await fetchPriceHistory(symbol))
    return NextResponse.json(await fetchGasPrices())
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
