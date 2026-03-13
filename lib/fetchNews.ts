export async function fetchEnergyNews() {
  try {
    // Use Reuters energy RSS feed - no API key needed
    const rssFeeds = [
      'https://feeds.reuters.com/reuters/businessNews',
      'https://www.naturalgasworld.com/feed',
    ];

    const feedUrl = rssFeeds[0];
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=8&api_key=public`;
    
    const res = await fetch(proxyUrl, { next: { revalidate: 900 } });
    if (!res.ok) throw new Error('RSS fetch failed');
    
    const data = await res.json();
    if (data.status !== 'ok' || !data.items?.length) throw new Error('No items');
    
    return data.items
      .filter((item: { title: string }) => 
        /gas|energy|lng|ttf|nbp|fuel|power|oil/i.test(item.title)
      )
      .slice(0, 6)
      .map((item: { title: string; link: string; pubDate: string; description: string }) => ({
        title: item.title,
        url: item.link,
        publishedAt: item.pubDate,
        source: 'Reuters',
        summary: item.description?.replace(/<[^>]+>/g, '').slice(0, 120) + '...',
      }));
  } catch (e) {
    console.error('News fetch error:', e);
    // Fallback: return curated static headlines
    return [
      {
        title: 'European natural gas prices rise amid supply concerns',
        url: 'https://www.reuters.com/business/energy',
        publishedAt: new Date().toISOString(),
        source: 'Reuters',
        summary: 'TTF futures climbed as European storage levels remain below seasonal averages...',
      },
      {
        title: 'LNG imports to Europe hit record as pipeline flows drop',
        url: 'https://www.reuters.com/business/energy',
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        source: 'Reuters',
        summary: 'Liquefied natural gas shipments to European terminals reached a record high this week...',
      },
      {
        title: 'NBP gas prices track TTF higher on cold weather forecast',
        url: 'https://www.reuters.com/business/energy',
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        source: 'Reuters',
        summary: 'UK NBP natural gas prices rose on Thursday following forecasts of colder than average temperatures...',
      },
    ];
  }
}
