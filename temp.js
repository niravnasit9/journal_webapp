const cheerio = require('cheerio');
fetch('https://www.investorgain.com/report/live-ipo-gmp/331/ipo/', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Accept': 'text/html'
  }
})
  .then(r => r.text())
  .then(html => {
    const $ = cheerio.load(html);
    const table = $('table');
    console.log('Tables found:', table.length);
    const rows = $(table[0]).find('tbody tr');
    
    if (rows.length > 0) {
      const cols = $(rows[0]).find('td');
      cols.each((i, c) => console.log(`Col ${i}: ${$(c).text().trim().replace(/\\s+/g, ' ')}`));
    }
  });
