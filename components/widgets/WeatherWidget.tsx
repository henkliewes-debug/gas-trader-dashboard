interface WeatherLocation {
  location: string
  temperature: number
  windSpeed: number
  description: string
  weatherCode: number
}

function weatherEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅'
  if (code <= 49) return '🌫️'
  if (code <= 69) return '🌧️'
  if (code <= 79) return '❄️'
  return '⛈️'
}

export default function WeatherWidget({ locations }: { locations: WeatherLocation[] }) {
  return (
    <div className="card">
      <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">🌡️ Key Markets Weather</h2>
      <div className="space-y-3">
        {locations.map((loc) => (
          <div key={loc.location} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
            <div className="flex items-center gap-2">
              <span className="text-xl">{weatherEmoji(loc.weatherCode)}</span>
              <div>
                <p className="text-sm font-medium text-gray-200">{loc.location}</p>
                <p className="text-xs text-gray-500">{loc.description}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-mono font-bold text-blue-400">{loc.temperature}°C</p>
              <p className="text-xs text-gray-500">💨 {loc.windSpeed} km/h</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
