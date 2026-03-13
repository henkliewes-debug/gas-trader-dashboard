const RSS_FEEDS = [
  { url: 'https://oilprice.com/rss/main', source: 'OilPrice.com' },
  { url: 'https://www.lngprime.com/feed/', source: 'LNG Prime' },
]

export async function fetchEnergyNews() {
  const articles = []
  for (const feed of RSS_FEEDS) {
    try {
      const res = await fetch(
        `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&count=5`,
        { next: { revalidate: 900 } }
      )
      const data = await res.json()
      if (data.items) {
        for (const item of data.items.slice(0, 5)) {
          articles.push({
            title: item.title,
            summary: item.description?.replace(/<[^>]*>/g, '').slice(0, 200) + '...',
            url: item.link,
            source: feed.source,
            publishedAt: new Date(item.pubDate),
          })
        }
      }
    } catch (e) { console.error(`Failed news:`, e) }
  }
  return articles.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
}
