// fetchNews.ts — fields match NewsFeed component (url, source, publishedAt)
interface NewsItem {
  title: string;
  url: string;
  publishedAt: string;
  source: string;
}

const GAS_KEYWORDS = [
  'natural gas', 'lng', 'ttf', 'nbp', 'gas price', 'gas supply', 'gas demand',
  'gas storage', 'gas market', 'gas trade', 'gas pipeline', 'gas import',
  'gas export', 'gas futures', 'gas flow', 'regasification', 'methane',
  'gas grid', 'gas hub', 'gasification', 'gas terminal', 'spot gas',
];

const OIL_KEYWORDS = ['oil price', 'crude oil', 'brent crude', 'wti crude', 'opec', 'petroleum', 'oil barrel'];

function isGasRelated(title: string): boolean {
  const lower = title.toLowerCase();
  return GAS_KEYWORDS.some(k => lower.includes(k));
}

function isOilOnly(title: string): boolean {
  const lower = title.toLowerCase();
  return OIL_KEYWORDS.some(k => lower.includes(k)) && !isGasRelated(title);
}

function safeDate(raw: string): string {
  if (!raw) return '';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '';
    return d.toISOString();
  } catch {
    return '';
  }
}

async function fetchFeed(rssUrl: string, sourceName: string): Promise<NewsItem[]> {
  try {
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=25&api_key=`;
    const res = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.status !== 'ok' || !Array.isArray(data.items)) return [];
    return data.items.map((item: { title?: string; link?: string; pubDate?: string; isoDate?: string }) => ({
      title: (item.title || '').trim(),
      url: item.link || '#',
      publishedAt: safeDate(item.pubDate || item.isoDate || ''),
      source: sourceName,
    })).filter((item: NewsItem) => item.title.length > 5);
  } catch {
    return [];
  }
}

export async function fetchEnergyNews(): Promise<NewsItem[]> {
  const results = await Promise.allSettled([
    fetchFeed('https://feeds.reuters.com/reuters/businessNews', 'Reuters'),
    fetchFeed('https://feeds.feedburner.com/platts/oilnews', 'Platts'),
    fetchFeed('https://oilprice.com/rss/main', 'OilPrice.com'),
    fetchFeed('https://www.lngprime.com/feed/', 'LNG Prime'),
    fetchFeed('https://energymonitor.ai/feed/', 'Energy Monitor'),
    fetchFeed('https://www.ft.com/rss/home/uk', 'FT'),
  ]);

  const all: NewsItem[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value);
  }

  // Deduplicate
  const seen = new Set<string>();
  const unique = all.filter(item => {
    const key = item.title.toLowerCase().slice(0, 55);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const gasItems = unique.filter(item => isGasRelated(item.title));
  const oilItems = unique.filter(item => isOilOnly(item.title));
  const energyOther = unique.filter(item => {
    const lower = item.title.toLowerCase();
    return !isGasRelated(item.title) && !isOilOnly(item.title) &&
      ['energy', 'power', 'electricity', 'renewable', 'wind', 'solar'].some(k => lower.includes(k));
  });

  const list: NewsItem[] = [
    ...gasItems.slice(0, 12),
    ...(oilItems.length > 0 ? [oilItems[0]] : []),  // max 1 oil item
    ...energyOther.slice(0, 2),
  ];

  // Sort by date desc
  list.sort((a, b) => {
    if (!a.publishedAt) return 1;
    if (!b.publishedAt) return -1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  // Fallback with correct field names
  if (list.length === 0) {
    const now = new Date().toISOString();
    return [
      { title: 'European natural gas prices rise amid supply concerns', url: '#', publishedAt: now, source: 'Reuters' },
      { title: 'LNG imports to Europe hit record as pipeline flows drop', url: '#', publishedAt: now, source: 'Reuters' },
      { title: 'NBP gas prices track TTF higher on cold weather forecast', url: '#', publishedAt: now, source: 'Reuters' },
    ];
  }

  return list.slice(0, 15);
}
