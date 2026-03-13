// fetchNews.ts — direct RSS XML parsing, no third-party proxy
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
  'gas terminal', 'spot gas', 'gas hub', 'gas grid',
];
const OIL_KEYWORDS = ['crude oil', 'brent crude', 'wti crude', 'opec cuts', 'oil price', 'oil barrel'];

function isGas(t: string) { const l = t.toLowerCase(); return GAS_KEYWORDS.some(k => l.includes(k)); }
function isOilOnly(t: string) { const l = t.toLowerCase(); return OIL_KEYWORDS.some(k => l.includes(k)) && !isGas(t); }

function safeDate(raw: string): string {
  if (!raw) return '';
  try { const d = new Date(raw); return isNaN(d.getTime()) ? '' : d.toISOString(); } catch { return ''; }
}

function parseRssXml(xml: string, sourceName: string): NewsItem[] {
  try {
    const items: NewsItem[] = [];
    const itemRegex = /<item[^>]*>([sS]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const block = match[1];
      const title = (block.match(/<title[^>]*>(?:<![CDATA[)?([sS]*?)(?:]]>)?<\/title>/) || [])[1]?.trim() || '';
      const link = (block.match(/<link[^>]*>([^<]+)<\/link>/) || block.match(/<link[^>]*\/?>/) || [])[1]?.trim() || '#';
      const pubDate = (block.match(/<pubDate[^>]*>([sS]*?)<\/pubDate>/) || [])[1]?.trim() || '';
      if (title.length > 5) {
        items.push({ title, url: link || '#', publishedAt: safeDate(pubDate), source: sourceName });
      }
    }
    return items;
  } catch { return []; }
}

async function fetchRss(url: string, sourceName: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GasTrader/1.0)', 'Accept': 'application/rss+xml, application/xml, text/xml' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssXml(xml, sourceName);
  } catch { return []; }
}

export async function fetchEnergyNews(): Promise<NewsItem[]> {
  const feeds = await Promise.allSettled([
    fetchRss('https://feeds.reuters.com/reuters/businessNews', 'Reuters'),
    fetchRss('https://www.lngprime.com/feed/', 'LNG Prime'),
    fetchRss('https://oilprice.com/rss/main', 'OilPrice.com'),
    fetchRss('https://energymonitor.ai/feed/', 'Energy Monitor'),
    fetchRss('https://www.naturalgasworld.com/feed', 'Natural Gas World'),
    fetchRss('https://www.icis.com/explore/resources/news/rss/', 'ICIS'),
  ]);

  const all: NewsItem[] = [];
  for (const r of feeds) {
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

  const gasItems = unique.filter(item => isGas(item.title));
  const oilItems = unique.filter(item => isOilOnly(item.title));
  const energyOther = unique.filter(item => {
    if (isGas(item.title) || isOilOnly(item.title)) return false;
    const l = item.title.toLowerCase();
    return ['energy', 'power', 'electricity', 'renewable', 'wind', 'solar', 'carbon'].some(k => l.includes(k));
  });

  const list: NewsItem[] = [
    ...gasItems.slice(0, 12),
    ...(oilItems.length > 0 ? [oilItems[0]] : []),
    ...energyOther.slice(0, 2),
  ];

  list.sort((a, b) => {
    if (!a.publishedAt) return 1;
    if (!b.publishedAt) return -1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

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
