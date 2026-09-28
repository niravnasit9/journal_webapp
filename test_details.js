const cheerio = require('cheerio');
fetch('https://www.investorgain.com/ipo/bharat-coking-coal-ipo/1580/', { headers: { 'User-Agent': 'Mozilla/5.0' } })
  .then(r => r.text())
  .then(html => {
    const $ = cheerio.load(html);
    $('table').each((tableIdx, table) => {
      console.log('--- TABLE ' + tableIdx + ' ---');
      $(table).find('tr').each((i, el) => {
        const rowData = [];
        $(el).find('th, td').each((_, cell) => {
          rowData.push($(cell).text().replace(/\s+/g, ' ').trim());
        });
        if(rowData.length > 0) console.log(rowData.join(' | '));
      });
    });
  });
