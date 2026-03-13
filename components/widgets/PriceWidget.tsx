interface PriceWidgetProps {
  symbol: string
  price: number
  change: number
  changePercent: number
  high?: number
  low?: number
}

export default function PriceWidget({ symbol, price, change, changePercent, high, low }: PriceWidgetProps) {
  const isUp = change >= 0
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">{symbol}</p>
          <p className="text-xs text-gray-600">Natural Gas Futures</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isUp ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
          {isUp ? '▲' : '▼'} {Math.abs(changePercent).toFixed(2)}%
        </span>
      </div>
      <p className={`text-3xl font-mono font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
        {price.toFixed(3)}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">EUR/MWh</p>
      <div className="flex gap-3 mt-3 pt-3 border-t border-gray-800">
        <div><p className="text-xs text-gray-600">High</p><p className="text-xs text-gray-300 font-mono">{high?.toFixed(3) || '-'}</p></div>
        <div><p className="text-xs text-gray-600">Low</p><p className="text-xs text-gray-300 font-mono">{low?.toFixed(3) || '-'}</p></div>
        <div><p className="text-xs text-gray-600">Change</p><p className={`text-xs font-mono ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>{isUp ? '+' : ''}{change.toFixed(3)}</p></div>
      </div>
    </div>
  )
}
