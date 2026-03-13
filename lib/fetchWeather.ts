const LOCATIONS = [
  { name: 'Rotterdam', lat: 51.9225, lng: 4.4792 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050 },
]

function getWeatherDescription(code: number): string {
  if (code === 0) return 'Clear sky'
  if (code <= 3) return 'Partly cloudy'
  if (code <= 49) return 'Foggy'
  if (code <= 59) return 'Drizzle'
  if (code <= 69) return 'Rain'
  if (code <= 79) return 'Snow'
  if (code <= 82) return 'Rain showers'
  return 'Thunderstorm'
}

export async function fetchWeather() {
  const results = []
  for (const loc of LOCATIONS) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lng}&current=temperature_2m,wind_speed_10m,weather_code`
      const res = await fetch(url, { next: { revalidate: 1800 } })
      const data = await res.json()
      results.push({
        location: loc.name,
        temperature: data.current.temperature_2m,
        windSpeed: data.current.wind_speed_10m,
        weatherCode: data.current.weather_code,
        description: getWeatherDescription(data.current.weather_code),
      })
    } catch (e) { console.error(`Failed weather for ${loc.name}:`, e) }
  }
  return results
}
