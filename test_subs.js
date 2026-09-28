const cheerio = require('cheerio');
fetch('https://www.investorgain.com/report/ipo-subscription-live/333/ipo/', { headers: { 'User-Agent': 'Mozilla/5.0' } })
  .then(r => r.text())
  .then(html => {
    const $ = cheerio.load(html);
    $('table thead tr').each((i, el) => {
      const rowData = [];
      $(el).find('th').each((_, cell) => {
        rowData.push($(cell).text().replace(/\s+/g, ' ').trim());
      });
      if(rowData.length > 0) console.log(rowData.join(' | '));
    });
  });
