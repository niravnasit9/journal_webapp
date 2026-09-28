const cheerio = require('cheerio');

async function scrapeListed() {
  const html = await fetch('https://www.investorgain.com/report/ipo-gmp-performance-tracker/377/ipo/?year=2026', { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.text());
  const $ = cheerio.load(html);
  
  const listedIpos = [];
  $('table tbody tr').each((i, el) => {
    if (i > 1) return; // just first 2
    const cols = $(el).find('td');
    if (cols.length >= 11) {
      listedIpos.push({
        name: $(cols[0]).text().trim(),
        symbol: $(cols[1]).text().trim(),
        listingDate: $(cols[2]).text().trim(),
        issueSize: $(cols[3]).text().trim(),
        subscription: $(cols[4]).text().trim(),
        finalGmp: $(cols[5]).text().trim(),
        issuePrice: $(cols[6]).text().trim(),
        estListingPrice: $(cols[7]).text().trim(),
        actualListingPrice: $(cols[8]).text().trim(),
        listingDayClose: $(cols[9]).text().trim(),
        currentLtp: $(cols[10]).text().trim(),
        status: 'Listed'
      });
    }
  });
  console.log(JSON.stringify(listedIpos, null, 2));
}

scrapeListed();
