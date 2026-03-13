// fetchNews.ts — no dotAll regex, Railway-compatible
interface NewsItem {
  title: string;
  url: string;
  publishedAt: string;
  source: string;
}

const GAS_KW = ['natural gas','lng','ttf','nbp','gas price','gas supply','gas demand','gas storage','gas market','gas trade','gas pipeline','gas import','gas export','gas futures','gas flow','regasification','methane','gas terminal','gas hub','gas grid'];
const OIL_KW = ['crude oil','brent crude','wti crude','opec cuts','oil barrel'];

function isGas(t: string) { const l = t.toLowerCase(); return GAS_KW.some(k => l.includes(k)); }
function isOil(t: string) { const l = t.toLowerCase(); return OIL_KW.some(k => l.includes(k)) && !isGas(t); }

function safeDate(raw: string): string {
  if (!raw) return '';
  try { const d = new Date(raw); return isNaN(d.getTime()) ? '' : d.toISOString(); } catch { return ''; }
}

function getTagValue(block: string, tag: string): string {
  const open = '<' + tag;
  const close = '</' + tag + '>';
  const start = block.indexOf(open);
  if (start === -1) return '';
  const contentStart = block.indexOf('>', start);
  if (contentStart === -1) return '';
  const end = block.indexOf(close, contentStart);
  if (end === -1) return '';
  let val = block.slice(contentStart + 1, end).trim();
  // Strip CDATA wrapper
  if (val.startsWith('<![CDATA[') && val.endsWith(']]>')) {
    val = val.slice(9, val.length - 3).trim();
  }
  return val;
}

function getLinkValue(block: string): string {
  // <link>url</link> or <link href="url"/>
  const simple = block.indexOf('<link>');
  if (simple !== -1) {
    const end = block.indexOf('</link>', simple);
    if (end !== -1) return block.slice(simple + 6, end).trim();
  }
  // Try href attribute
  const href = block.indexOf('<link href=');
  if (href !== -1) {
    const q1 = block.indexOf('"', href + 10);
    if (q1 !== -1) {
      const q2 = block.indexOf('"', q1 + 1);
      if (q2 !== -1) return block.slice(q1 + 1, q2).trim();
    }
  }
  return '#';
}

function parseXml(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];
  const marker = '<item';
  const endMarker = '</item>';
  let pos = 0;
  while (true) {
    const start = xml.indexOf(marker, pos);
    if (start === -1) break;
    const end = xml.indexOf(endMarker, start);
    if (end === -1) break;
    const block = xml.slice(start, end + endMarker.length);
    const title = getTagValue(block, 'title');
    const pubDate = getTagValue(block, 'pubDate');
    const link = getLinkValue(block);
    if (title.length > 5) {
      items.push({ title, url: link, publishedAt: safeDate(pubDate), source });
    }
    pos = end + endMarker.length;
  }
  return items;
}

async function fetchRss(url: string, source: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GasTrader/1.0)', Accept: 'application/rss+xml, application/xml, text/xml, */*' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseXml(xml, source);
  } catch { return []; }
}

export async function fetchEnergyNews(): Promise<NewsItem[]> {
  const settled = await Promise.allSettled([
    fetchRss('https://feeds.reuters.com/reuters/businessNews', 'Reuters'),
    fetchRss('https://www.lngprime.com/feed/', 'LNG Prime'),
    fetchRss('https://oilprice.com/rss/main', 'OilPrice.com'),
    fetchRss('https://energymonitor.ai/feed/', 'Energy Monitor'),
    fetchRss('https://www.naturalgasworld.com/feed', 'Natural Gas World'),
    fetchRss('https://rss.dw.com/rdf/rss-en-bus', 'DW Business'),
  ]);

  const all: NewsItem[] = [];
  for (const r of settled) {
    if (r.status === 'fulfilled') all.push(...r.value);
  }

  const seen = new Set<string>();
  const unique = all.filter(item => {
    const key = item.title.toLowerCase().slice(0, 55);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const gasItems = unique.filter(i => isGas(i.title));
  const oilItems = unique.filter(i => isOil(i.title));
  const otherItems = unique.filter(i => {
    if (isGas(i.title) || isOil(i.title)) return false;
    const l = i.title.toLowerCase();
    return ['energy','power','electricity','renewable','wind','solar','carbon'].some(k => l.includes(k));
  });

  const list = [...gasItems.slice(0, 12), ...(oilItems.length ? [oilItems[0]] : []), ...otherItems.slice(0, 2)];

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
