import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const [response, subResponse, listedResponse, listedSmeResponse] = await Promise.all([
      fetch('https://www.investorgain.com/report/live-ipo-gmp/331/', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        cache: 'no-store'
      }),
      fetch('https://www.investorgain.com/report/ipo-subscription-live/333/ipo/', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        cache: 'no-store'
      }),
      fetch('https://www.investorgain.com/report/ipo-gmp-performance-tracker/377/ipo/?year=2026', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        cache: 'no-store'
      }),
      fetch('https://www.investorgain.com/report/ipo-gmp-performance-tracker/377/sme/?year=2026', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        cache: 'no-store'
      })
    ]);
    
    if (!response.ok) {
      throw new Error(`Scraper returned status ${response.status}`);
    }
    
    const html = await response.text();
    const subHtml = subResponse.ok ? await subResponse.text() : '';
    const listedHtml = listedResponse.ok ? await listedResponse.text() : '';
    const listedSmeHtml = listedSmeResponse.ok ? await listedSmeResponse.text() : '';
    
    const $ = cheerio.load(html);
    const $sub = cheerio.load(subHtml);
    const $listed = cheerio.load(listedHtml);
    const $listedSme = cheerio.load(listedSmeHtml);

    const subData = new Map();
    $sub('table tbody tr').each((_, el) => {
      const cols = $sub(el).find('td');
      if (cols.length >= 7) {
        let nameRaw = $sub(cols[0]).text().replace(/IPOGMP.*$/g, '').trim();
        nameRaw = nameRaw.replace(/(NSE|BSE|SME)/gi, '').trim();
        subData.set(nameRaw.toLowerCase(), {
          qib: $sub(cols[2]).text().trim(),
          nii: $sub(cols[5]).text().trim(),
          retail: $sub(cols[6]).text().trim()
        });
      }
    });

    const mappedIpos: any[] = [];
    $('table tbody tr').each((i, el) => {
      // Pull up to 50 IPOs
      if (i > 50) return;
      
      const cols = $(el).find('td');
      if (cols.length >= 8) {
        let nameRaw = $(cols[0]).text().trim();
        nameRaw = nameRaw.replace(/\[email\s*protected\]/gi, '').replace(/\([0-9.%+-]+\)/g, '').trim();
        let detailUrl = $(cols[0]).find('a').attr('href') || '';
        
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
        const cleanForSub = nameRaw.replace(/(NSE|BSE|SME)/gi, '').trim().toLowerCase();
        
        let subInfo;
        for (const [subName, info] of subData.entries()) {
          if (cleanForSub.includes(subName) || subName.includes(cleanForSub)) {
            subInfo = info;
            break;
          }
        }

        
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
        let boaDateRaw = $(cols[9]).text().trim().split('GMP')[0].trim();
        let listDateRaw = $(cols[10]).text().trim().split('GMP')[0].trim();
        
        let openDate = openDateRaw && openDateRaw !== '--' ? `${openDateRaw}-${new Date().getFullYear()}` : 'TBA';
        let closeDate = closeDateRaw && closeDateRaw !== '--' ? `${closeDateRaw}-${new Date().getFullYear()}` : 'TBA';
        let allotmentDate = boaDateRaw && boaDateRaw !== '--' ? `${boaDateRaw}-${new Date().getFullYear()}` : 'TBA';
        let listingDate = listDateRaw && listDateRaw !== '--' ? `${listDateRaw}-${new Date().getFullYear()}` : 'TBA';
        
        if (openDate !== 'TBA' && closeDate !== 'TBA') {
          try {
            const nowStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
            const now = new Date(nowStr);

            const openD = new Date(openDate + " 10:00:00 GMT+0530");
            const closeD = new Date(closeDate + " 17:00:00 GMT+0530");

            const listD = listingDate !== 'TBA' ? new Date(listingDate + " 10:00:00 GMT+0530") : null;

            if (listD && now >= listD) {
               status = 'Listed';
            } else if (status === 'Allotment Out' || status === 'Allotment Awaited') {
               // Preserve the exact 'Allotment Out' or 'Allotment Awaited' status directly from the website's badge
            } else if (now < openD) {
               status = 'Upcoming';
            } else if (now >= openD && now < closeD) {
               status = 'Live';
            } else if (now >= closeD) {
               status = 'Closed';
            }
          } catch (e) {
            console.error("Date parsing error", e);
          }
        }
        
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
          subsQib: subInfo && subInfo.qib !== '0.00' ? subInfo.qib + 'x' : '--',
          subsNii: subInfo && subInfo.nii !== '0.00' ? subInfo.nii + 'x' : '--',
          subsRetail: subInfo && subInfo.retail !== '0.00' ? subInfo.retail + 'x' : '--',
          status: status,
          gmp: gmp,
          allotmentDate: allotmentDate,
          listingDate: listingDate,
          exchange: isSME ? 'SME' : 'NSE/BSE',
          detailUrl: detailUrl.startsWith('/') ? `https://www.investorgain.com${detailUrl}` : detailUrl
        });
      }
    });

    try {
      const listedUrl = 'https://www.investorgain.com/report/ipo-gmp-performance-tracker/377/ipo/?year=2026';
      const listedResponse = await fetch(listedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'text/html'
        },
        cache: 'no-store'
      });
      
      if (listedResponse.ok) {
        const listedHtml = await listedResponse.text();
        const $listed = cheerio.load(listedHtml);
        
        $listed('table tbody tr').each((i, el) => {
          const cols = $listed(el).find('td');
          if (cols.length >= 11) {
            const rawName = $listed(cols[0]).text().trim();
            const cleanName = rawName.replace(/(NSE|BSE)/gi, '').replace(/\[email protected\]/gi, '').replace(/\([0-9.%+-]+\)/g, '').trim() || rawName;
            let detailUrl = $listed(cols[0]).find('a').attr('href') || '';
            
            // Skip the header-like row "NSE" or "BSE"
            if (cleanName === 'NSE' || cleanName === 'BSE' || cleanName === '') return;
            
            mappedIpos.push({
              name: cleanName,
              symbol: $listed(cols[1]).text().trim() || cleanName.toUpperCase().substring(0, 10).replace(/\s+/g, '_') + '.NS',
              date: $listed(cols[2]).text().trim(),
              closeDate: $listed(cols[2]).text().trim(),
              issueSize: $listed(cols[3]).text().trim(),
              subs: $listed(cols[4]).text().trim(),
              gmp: $listed(cols[5]).text().trim(),
              priceRange: $listed(cols[6]).text().trim(),
              estListingPrice: $listed(cols[7]).text().trim(),
              actualListingPrice: $listed(cols[8]).text().trim(),
              listingDayClose: $listed(cols[9]).text().trim(),
              currentLtp: $listed(cols[10]).text().trim(),
              status: 'Listed',
              exchange: 'NSE/BSE',
              allotmentDate: 'TBA',
              listingDate: $listed(cols[2]).text().trim(),
              minLot: 1, 
              minAmount: parseInt($listed(cols[6]).text().replace(/[^\d]/g, '')) || 0,
              detailUrl: detailUrl.startsWith('/') ? `https://www.investorgain.com${detailUrl}` : detailUrl
            });
          }
        });

        // Add SME listed IPOs
        $listedSme('table tbody tr').each((i, el) => {
          const cols = $listedSme(el).find('td');
          if (cols.length >= 11) {
            const rawName = $listedSme(cols[0]).text().trim();
            const cleanName = rawName.replace(/(NSE|BSE)/gi, '').replace(/\[email protected\]/gi, '').replace(/\([0-9.%+-]+\)/g, '').trim() || rawName;
            let detailUrl = $listedSme(cols[0]).find('a').attr('href') || '';
            
            // Skip the header-like row "NSE" or "BSE"
            if (cleanName === 'NSE' || cleanName === 'BSE' || cleanName === '') return;
            
            mappedIpos.push({
              name: cleanName,
              symbol: $listedSme(cols[1]).text().trim() || cleanName.toUpperCase().substring(0, 10).replace(/\s+/g, '_') + '.NS',
              date: $listedSme(cols[2]).text().trim(),
              closeDate: $listedSme(cols[2]).text().trim(),
              issueSize: $listedSme(cols[3]).text().trim(),
              subs: $listedSme(cols[4]).text().trim(),
              gmp: $listedSme(cols[5]).text().trim(),
              priceRange: $listedSme(cols[6]).text().trim(),
              estListingPrice: $listedSme(cols[7]).text().trim(),
              actualListingPrice: $listedSme(cols[8]).text().trim(),
              listingDayClose: $listedSme(cols[9]).text().trim(),
              currentLtp: $listedSme(cols[10]).text().trim(),
              status: 'Listed',
              exchange: 'SME',
              allotmentDate: 'TBA',
              listingDate: $listedSme(cols[2]).text().trim(),
              minLot: 1, 
              minAmount: parseInt($listedSme(cols[6]).text().replace(/[^\d]/g, '')) || 0,
              detailUrl: detailUrl.startsWith('/') ? `https://www.investorgain.com${detailUrl}` : detailUrl
            });
          }
        });
      }
    } catch (err) {
      console.error('Failed to fetch listed IPOs', err);
    }

    // Sort so most recent / upcoming are at the top (Ascending by Date, with TBA at bottom)
    mappedIpos.sort((a, b) => {
      if (a.date === 'TBA') return 1;
      if (b.date === 'TBA') return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    // Remove duplicates (e.g. if an IPO is both in upcoming and listed tables)
    // Priority to the one with actualListingPrice (which comes from the listed tables)
    const uniqueMap = new Map();
    for (const ipo of mappedIpos) {
       const key = ipo.symbol;
       if (uniqueMap.has(key)) {
           const existing = uniqueMap.get(key);
           if (ipo.actualListingPrice && !existing.actualListingPrice) {
               uniqueMap.set(key, ipo);
           }
       } else {
           uniqueMap.set(key, ipo);
       }
    }
    const finalIpos = Array.from(uniqueMap.values());

    return NextResponse.json(finalIpos);
    
  } catch (error: any) {
    console.error("IPO API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch IPOs" }, { status: 500 });
  }
}
