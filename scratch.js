const cheerio = require('cheerio');
fetch('https://www.investorgain.com/report/live-ipo-gmp/331/', {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
}).then(r => r.text()).then(async html => {
  const $ = cheerio.load(html);
  const links = [];
  $('table tbody tr').each((i, el) => {
    if (i > 10) return; // look at first 10
    const link = $(el).find('td:first-child a').attr('href');
    if (link) links.push(link);
  });
  
  if (links.length > 0) {
    const ipoUrl = links.find(l => l.includes('ipo-gmp')) || links[0];
    console.log('Fetching details for:', ipoUrl);
    
    const detailHtml = await fetch(ipoUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }).then(r => r.text());
    const $$ = cheerio.load(detailHtml);
    
    console.log('--- Page Title ---');
    console.log($$('title').text());
    
    console.log('--- Tables ---');
    $$('table').each((i, table) => {
      console.log(`Table ${i}:`, $$(table).find('th').map((_, th) => $$(th).text().trim()).get().join(' | '));
    });
  }
});
