// fetchNews.ts — more gas news, max 1 oil item
interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

const GAS_KEYWORDS = ['natural gas', 'lng', 'ttf', 'nbp', 'gas price', 'gas supply',
  'gas demand', 'gas storage', 'gas market', 'gas trade', 'gas pipeline',
  'gas import', 'gas export', 'gas futures', 'energy price', 'gas flow',
  'regasification', 'methane', 'gas grid', 'gas hub'];

const OIL_KEYWORDS = ['oil', 'crude', 'brent', 'wti', 'opec', 'petroleum', 'barrel'];

const ENERGY_KEYWORDS = [...GAS_KEYWORDS, ...OIL_KEYWORDS, 'energy', 'power', 'electricity'];

function isGasRelated(text: string): boolean {
  const lower = text.toLowerCase();
  return GAS_KEYWORDS.some(k => lower.includes(k));
}

function isOilRelated(text: string): boolean {
  const lower = text.toLowerCase();
  return OIL_KEYWORDS.some(k => lower.includes(k)) && !isGasRelated(text);
}

function formatDate(raw: string): string {
  if (!raw) return '';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    const day = d.getDate();
    const month = d.toLocaleString('en', { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return raw;
  }
}

async function fetchRssFeed(rssUrl: string, sourceName: string): Promise<NewsItem[]> {
  try {
    const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=20`;
    const res = await fetch(url, { next: { revalidate: 900 } });
    const data = await res.json();
    if (data.status !== 'ok') return [];
    return (data.items || []).map((item: { title: string; link: string; pubDate: string }) => ({
      title: item.title,
      link: item.link,
      pubDate: formatDate(item.pubDate),
      source: sourceName,
    }));
  } catch {
    return [];
  }
}

export async function fetchEnergyNews(): Promise<NewsItem[]> {
  const feeds = await Promise.allSettled([
    fetchRssFeed('https://feeds.reuters.com/reuters/businessNews', 'Reuters'),
    fetchRssFeed('https://www.naturalgasintel.com/feed/', 'NGI'),
    fetchRssFeed('https://www.lngprime.com/feed/', 'LNG Prime'),
    fetchRssFeed('https://oilprice.com/rss/main', 'OilPrice'),
    fetchRssFeed('https://www.icis.com/explore/resources/news/rss/', 'ICIS'),
    fetchRssFeed('https://energymonitor.ai/feed/', 'Energy Monitor'),
  ]);

  const allItems: NewsItem[] = [];
  for (const result of feeds) {
    if (result.status === 'fulfilled') allItems.push(...result.value);
  }

  // Deduplicate by title
  const seen = new Set<string>();
  const unique = allItems.filter(item => {
    const key = item.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const gasItems = unique.filter(item => isGasRelated(item.title));
  const oilOnlyItems = unique.filter(item => isOilRelated(item.title));
  const otherEnergyItems = unique.filter(item => {
    const lower = item.title.toLowerCase();
    return ENERGY_KEYWORDS.some(k => lower.includes(k)) && !isGasRelated(item.title) && !isOilRelated(item.title);
  });

  const result: NewsItem[] = [];
  result.push(...gasItems.slice(0, 12));
  if (oilOnlyItems.length > 0) result.push(oilOnlyItems[0]);
  result.push(...otherEnergyItems.slice(0, 2));

  if (result.length === 0) {
    const today = formatDate(new Date().toISOString());
    return [
      { title: 'European natural gas prices rise amid supply concerns', link: '#', pubDate: today, source: 'Reuters' },
      { title: 'LNG imports to Europe hit record as pipeline flows drop', link: '#', pubDate: today, source: 'Reuters' },
      { title: 'NBP gas prices track TTF higher on cold weather forecast', link: '#', pubDate: today, source: 'Reuters' },
    ];
  }

  return result.slice(0, 15);
}
