'use client'
import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface PricePoint { date: string; price: number }

export default function PriceChart({ symbol }: { symbol: string }) {
  const [data, setData] = useState<PricePoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/prices?history=1&symbol=${symbol}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [symbol])

  const color = symbol === 'TTF' ? '#3b82f6' : '#8b5cf6'
  const latest = data[data.length - 1]?.price || 0
  const first = data[0]?.price || 0
  const totalChange = first ? ((latest - first) / first * 100).toFixed(1) : '0'

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{symbol} — 3 Month Chart</h2>
          <p className="text-xs text-gray-600 mt-0.5">EUR/MWh · Daily close</p>
        </div>
        <p className={`text-sm font-mono font-bold ${Number(totalChange) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {Number(totalChange) >= 0 ? '+' : ''}{totalChange}%
        </p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-600">Loading...</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} interval={14} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} domain={['auto', 'auto']} />
            <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
              labelStyle={{ color: '#9ca3af' }} itemStyle={{ color }} formatter={(v: any) => [`${Number(v).toFixed(3)} EUR/MWh`, symbol]} />
            <Line type="monotone" dataKey="price" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
