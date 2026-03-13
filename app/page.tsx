import PriceWidget from '@/components/widgets/PriceWidget'
import PriceChart from '@/components/charts/PriceChart'
import WeatherWidget from '@/components/widgets/WeatherWidget'
import NewsFeed from '@/components/widgets/NewsFeed'
import TankerWidget from '@/components/widgets/TankerWidget'
import { fetchGasPrices } from '@/lib/fetchPrices'
import { fetchWeather } from '@/lib/fetchWeather'
import { fetchEnergyNews } from '@/lib/fetchNews'

export const revalidate = 300

export default async function Dashboard() {
  const [prices, weather, news] = await Promise.all([
    fetchGasPrices().catch(() => []),
    fetchWeather().catch(() => []),
    fetchEnergyNews().catch(() => []),
  ])

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">⛽</div>
            <div>
              <h1 className="text-xl font-bold text-white">Natural Gas Trader</h1>
              <p className="text-xs text-gray-500">TTF · NBP · LNG Markets</p>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {prices.map((p) => <PriceWidget key={p.symbol} {...p} />)}
          {prices.length >= 2 && (
            <div className="card col-span-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">TTF/NBP Spread</p>
              <p className="text-3xl font-mono font-bold text-yellow-400">{(prices[0]?.price - prices[1]?.price).toFixed(3)}</p>
              <p className="text-xs text-gray-500 mt-1">EUR/MWh differential</p>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PriceChart symbol="TTF" />
          <PriceChart symbol="NBP" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <WeatherWidget locations={weather} />
          <div className="md:col-span-2"><NewsFeed articles={news.slice(0, 8)} /></div>
        </div>
        <TankerWidget />
      </main>
    </div>
  )
}
