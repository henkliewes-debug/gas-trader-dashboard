import { NextResponse } from 'next/server'
import { fetchWeather } from '@/lib/fetchWeather'

export async function GET() {
  try { return NextResponse.json(await fetchWeather()) }
  catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
