const cheerio = require('cheerio');
fetch('https://www.investorgain.com/ipo/bharat-coking-coal-ipo/1580/', { headers: { 'User-Agent': 'Mozilla/5.0' } })
  .then(r => r.text())
  .then(html => {
    const $ = cheerio.load(html);
    $('tr').each((i, el) => {
      const text = $(el).text().toLowerCase();
      if (text.includes('allotment status')) {
        console.log('Found row:', text);
        console.log('Link:', $(el).find('a').attr('href'));
      }
    });
  });
