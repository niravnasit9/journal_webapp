const cheerio = require('cheerio');
fetch('https://www.investorgain.com/report/live-ipo-gmp/331/')
  .then(r => r.text())
  .then(html => {
    const $ = cheerio.load(html);
    let moneyviewUrl = '';
    $('table tbody tr').each((i, el) => {
      if ($(el).text().toLowerCase().includes('moneyview')) {
        moneyviewUrl = $(el).find('a').attr('href');
      }
    });
    console.log('Moneyview URL:', moneyviewUrl);
    if(moneyviewUrl) {
      if(moneyviewUrl.startsWith('/')) moneyviewUrl = 'https://www.investorgain.com' + moneyviewUrl;
      fetch(moneyviewUrl).then(r=>r.text()).then(detailHtml => {
         const $d = cheerio.load(detailHtml);
         let registrar = '';
         $d('table.table-bordered tbody tr').each((i, el) => {
           const label = $d(el).find('td').first().text().trim().toLowerCase();
           if (label.includes('registrar')) {
             registrar = $d(el).find('td').last().text().trim();
           }
         });
         console.log('Registrar:', registrar);
      });
    }
  });
