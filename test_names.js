const cheerio = require('cheerio');
fetch('https://www.investorgain.com/report/ipo-gmp-performance-tracker/377/ipo/?year=2026', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Accept': 'text/html'
  }
})
.then(r => r.text())
.then(html => {
  const $ = cheerio.load(html);
  $('table thead tr').each((i, el) => {
    console.log($(el).text().replace(/\s+/g, ' ').trim());
  });
});
