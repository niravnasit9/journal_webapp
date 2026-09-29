import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const newsItems: any[] = [];

    // Fetch Economic Times IPO RSS
    try {
      const etResponse = await fetch('https://economictimes.indiatimes.com/markets/ipos/fpos/rssfeeds/14655708.cms', { cache: 'no-store' });
      if (etResponse.ok) {
        const etXml = await etResponse.text();
        const $et = cheerio.load(etXml, { xmlMode: true });
        
        $et('item').each((_, el) => {
          newsItems.push({
            title: $et(el).find('title').text(),
            link: $et(el).find('link').text(),
            pubDate: $et(el).find('pubDate').text(),
            source: 'Economic Times'
          });
        });
      }
    } catch (e) {
      console.error("Failed to fetch ET news", e);
    }

    // Fetch Moneycontrol IPO RSS
    try {
      const mcResponse = await fetch('https://www.moneycontrol.com/rss/iponews.xml', { cache: 'no-store' });
      if (mcResponse.ok) {
        const mcXml = await mcResponse.text();
        const $mc = cheerio.load(mcXml, { xmlMode: true });
        
        $mc('item').each((_, el) => {
          newsItems.push({
            title: $mc(el).find('title').text(),
            link: $mc(el).find('link').text(),
            pubDate: $mc(el).find('pubDate').text(),
            source: 'Moneycontrol'
          });
        });
      }
    } catch (e) {
      console.error("Failed to fetch MC news", e);
    }

    // Sort by publish date (newest first)
    newsItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    return NextResponse.json(newsItems.slice(0, 20)); // Return top 20 news items

  } catch (error: any) {
    console.error("News API Error:", error);
    return NextResponse.json({ error: "Failed to fetch IPO news" }, { status: 500 });
  }
}
