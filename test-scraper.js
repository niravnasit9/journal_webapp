const cheerio = require('cheerio');

async function testScraper() {
  const url = 'https://www.investorgain.com/report/live-ipo-gmp/331/';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  
  $('table tbody tr').each((i, row) => {
    if (i > 5) return;
    const nameTd = $(row).find('td').first();
    const link = nameTd.find('a').attr('href');
    console.log(nameTd.text().trim(), '=>', link);
  });
}

testScraper();
