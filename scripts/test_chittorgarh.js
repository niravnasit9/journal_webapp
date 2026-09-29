const cheerio = require('cheerio');
fetch('https://www.investorgain.com/report/ipo-allotment-status/335/', {
  headers: { 'User-Agent': 'Mozilla/5.0' }
})
.then(r => r.text())
.then(html => {
  const $ = cheerio.load(html);
  const out = [];
  $('table tbody tr').each((i, el) => {
    if (i > 15) return;
    const cols = $(el).find('td');
    if (cols.length >= 6) {
      out.push({
        name: $(cols[0]).text().trim(),
        allotmentStatus: $(cols[4]).text().trim()
      });
    }
  });
  console.log(out.slice(0, 10));
});
