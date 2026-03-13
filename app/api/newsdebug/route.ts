import { NextResponse } from 'next/server';

const FEEDS = [
  'https://www.lngprime.com/feed/',
  'https://oilprice.com/rss/main',
  'https://www.naturalgasworld.com/feed',
  'https://feeds.reuters.com/reuters/businessNews',
  'https://rss.dw.com/rdf/rss-en-bus',
  'https://feeds.bbci.co.uk/news/business/rss.xml',
  'https://www.ft.com/rss/home/uk',
];

export async function GET() {
  const results = await Promise.all(FEEDS.map(async (url) => {
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(6000),
      });
      const text = await r.text();
      const count = (text.match(/<item/g) || []).length;
      const firstTitle = (text.match(/<title[^>]*>(?:<![CDATA[)?(.*?)(?:]]>)?</title>/s) || [])[1]?.slice(0, 60) || '';
      return { url, ok: r.ok, status: r.status, itemCount: count, firstTitle };
    } catch (e) {
      return { url, ok: false, error: String(e).slice(0, 80) };
    }
  }));
  return NextResponse.json(results);
}
