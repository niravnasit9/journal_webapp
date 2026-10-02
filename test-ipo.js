fetch('https://www.investorgain.com/report/live-ipo-gmp/331/')
  .then(res => res.text())
  .then(html => {
     const cheerio = require('cheerio');
     const $ = cheerio.load(html);
     $('table tbody tr').each((i, el) => {
       const cols = $(el).find('td');
       if (cols.length >= 8) {
         let nameRaw = $(cols[0]).text().trim();
         if (nameRaw.includes('IPOCAllotted') || nameRaw.includes('IPOC') || nameRaw.includes('IPOListed')) {
            let listDateRaw = $(cols[10]).text().trim();
            console.log(nameRaw, ' => ', listDateRaw);
         }
       }
     });
  });
