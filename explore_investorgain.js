const cheerio = require('cheerio');

async function scrape(url, label) {
  try {
    const html = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }).then(r => r.text());
    const $ = cheerio.load(html);
    
    console.log(`\n=== ${label} ===`);
    console.log('Title:', $('title').text());
    
    $('table').each((i, table) => {
      console.log(`\nTable ${i} Headers:`);
      const headers = $(table).find('th').map((_, th) => $(th).text().trim()).get();
      console.log(headers.join(' | '));
      
      console.log('First Row:');
      const firstRow = $(table).find('tbody tr').first().find('td').map((_, td) => $(td).text().trim()).get();
      console.log(firstRow.join(' | '));
    });
  } catch (e) {
    console.error(`Error fetching ${label}:`, e.message);
  }
}

async function main() {
  await scrape('https://www.investorgain.com/report/ipo-gmp-performance-tracker/377/ipo/?year=2026', 'Listed IPOs Tracker (2026)');
  await scrape('https://www.investorgain.com/ipo-dashboard/mainline/', 'Mainline Dashboard');
}

main();
