import { NextResponse } from 'next/server'
import { fetchEnergyNews } from '@/lib/fetchNews'

export async function GET() {
  try { return NextResponse.json(await fetchEnergyNews()) }
  catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
