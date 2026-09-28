import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    let targetUrl = url;
    if (targetUrl.includes('/gmp/')) {
      targetUrl = targetUrl.replace('/gmp/', '/ipo/');
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch IPO details page: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const details = {
      faceValue: 'TBA',
      registrar: 'TBA',
      allotmentDate: 'TBA',
      listingDate: 'TBA',
      subsQib: '--',
      subsNii: '--',
      subsRetail: '--',
      allotmentUrl: ''
    };

    // Scrape details from all tables
    $('table tbody tr').each((_, el) => {
      const thText = $(el).find('th').text().trim().toLowerCase() || $(el).find('td:first-child').text().trim().toLowerCase();
      const tdText = $(el).find('td').last().text().trim();
      const hasLink = $(el).find('a').length > 0;
      
      if (!thText || (!tdText && !hasLink)) return;

      // IPO Details block
      if (thText.includes('face value')) details.faceValue = tdText;
      else if (thText.includes('registrar')) details.registrar = tdText;
      
      // Timeline block
      else if (thText.includes('basis of allotment') || (thText.includes('allotment date') && !thText.includes('status'))) details.allotmentDate = tdText;
      else if (thText.includes('listing date') && !thText.includes('listing at')) details.listingDate = tdText;

      // Subscription block
      else if (thText.includes('qib')) details.subsQib = tdText;
      else if (thText.includes('nii') || thText.includes('hni')) details.subsNii = tdText;
      else if (thText.includes('retail')) details.subsRetail = tdText;

      // Link extractions
      else if (thText.includes('allotment status')) {
        const link = $(el).find('a').attr('href');
        if (link) details.allotmentUrl = link;
      }
    });

    return NextResponse.json(details);

  } catch (error: any) {
    console.error("IPO Details API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch IPO details" }, { status: 500 });
  }
}
