import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = 'https://www.investorgain.com/report/live-ipo-gmp/331/';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Scraper returned status ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const mappedIpos: any[] = [];
    $('table tbody tr').each((i, el) => {
      // Pull up to 50 IPOs
      if (i > 50) return;
      
      const cols = $(el).find('td');
      if (cols.length >= 8) {
        let nameRaw = $(cols[0]).text().trim();
        
        // Check if SME
        const isSME = nameRaw.includes('SME');
        
        // Determine status from suffix
        let status = 'Upcoming';
        if (nameRaw.includes('IPOCAllotted')) status = 'Allotment Out';
        else if (nameRaw.includes('IPOC')) status = 'Allotment Awaited';
        else if (nameRaw.includes('IPOU')) status = 'Upcoming';
        else if (nameRaw.includes('IPO')) status = 'Live'; // if it's currently live it might just say IPO
        
        // Clean up name suffixes
        nameRaw = nameRaw.replace(/IPOCAllotted|IPOC|IPOU|IPO/gi, '').trim();
        
        let gmpRaw = $(cols[1]).text().trim();
        let gmp = gmpRaw.includes(')') ? gmpRaw.substring(0, gmpRaw.indexOf(')') + 1).trim() : gmpRaw;
        if (gmp === '' || gmp.includes('--')) gmp = '₹0 (0%)';

        let subs = $(cols[3]).text().trim();
        if (subs === '' || subs === '-') subs = '0.00x';
        
        let priceStr = $(cols[4]).text().trim();
        let issueSize = $(cols[5]).text().trim();
        let lotSize = parseInt($(cols[6]).text().replace(/,/g, '')) || 1;
        
        // Parse prices to calculate min amount (Price might be range like "140-148")
        let maxPrice = priceStr;
        if (priceStr.includes('-')) {
          maxPrice = priceStr.split('-')[1].trim();
        }
        let minAmount = (parseInt(maxPrice) || 0) * lotSize;
        
        let openDateRaw = $(cols[7]).text().trim().split('GMP')[0].trim();
        let closeDateRaw = $(cols[8]).text().trim().split('GMP')[0].trim();
        
        let openDate = openDateRaw && openDateRaw !== '--' ? `${openDateRaw}-${new Date().getFullYear()}` : 'TBA';
        let closeDate = closeDateRaw && closeDateRaw !== '--' ? `${closeDateRaw}-${new Date().getFullYear()}` : 'TBA';
        
        if (!nameRaw) return;
        
        mappedIpos.push({
          symbol: nameRaw.toUpperCase().substring(0, 10).replace(/\s+/g, '_') + '.NS',
          name: nameRaw,
          date: openDate,
          closeDate: closeDate,
          priceRange: `₹${priceStr}`,
          minLot: lotSize,
          minAmount: minAmount,
          issueSize: issueSize,
          subs: subs,
          status: status,
          gmp: gmp,
          exchange: isSME ? 'SME' : 'NSE/BSE'
        });
      }
    });

    // Sort so most recent / upcoming are at the top (Ascending by Date, with TBA at bottom)
    mappedIpos.sort((a, b) => {
      if (a.date === 'TBA') return 1;
      if (b.date === 'TBA') return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    // Inject high-profile upcoming pipeline IPOs requested by the user
    const pipelineIpos = [
      {
        symbol: 'HEROMOTORS.NS',
        name: 'Hero Motors',
        date: 'TBA',
        closeDate: 'TBA',
        priceRange: 'TBA',
        minLot: 1,
        minAmount: 0,
        issueSize: '₹900 Cr',
        subs: '0.00x',
        status: 'Upcoming',
        gmp: '₹0 (0%)',
        exchange: 'NSE/BSE'
      },
      {
        symbol: 'RENTOMOJO.NS',
        name: 'Rentomojo',
        date: 'TBA',
        closeDate: 'TBA',
        priceRange: 'TBA',
        minLot: 1,
        minAmount: 0,
        issueSize: 'TBA',
        subs: '0.00x',
        status: 'Upcoming',
        gmp: '₹0 (0%)',
        exchange: 'NSE/BSE'
      },
      {
        symbol: 'NSE.NS',
        name: 'National Stock Exchange (NSE)',
        date: 'TBA',
        closeDate: 'TBA',
        priceRange: 'TBA',
        minLot: 1,
        minAmount: 0,
        issueSize: '₹10,000 Cr',
        subs: '0.00x',
        status: 'Upcoming',
        gmp: '₹0 (0%)',
        exchange: 'NSE/BSE'
      }
    ];

    pipelineIpos.forEach(pIpo => {
      // Add if not already scraped
      if (!mappedIpos.find(i => i.name.toLowerCase().includes(pIpo.name.toLowerCase().split(' ')[0]))) {
        mappedIpos.push(pIpo);
      }
    });

    return NextResponse.json(mappedIpos);
    
  } catch (error: any) {
    console.error("IPO API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch IPOs" }, { status: 500 });
  }
}
