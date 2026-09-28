const cheerio = require('cheerio');
fetch('https://www.investorgain.com/report/ipo-gmp-performance-tracker/377/sme/?year=2026')
.then(r => r.text())
.then(html => {
  const $ = cheerio.load(html);
  let count = 0;
  $('table tbody tr').each((i, el) => {
    count++;
  });
  console.log("SME listed count:", count);
});
