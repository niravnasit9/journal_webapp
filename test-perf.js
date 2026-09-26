const cheerio = require('cheerio');
async function test() {
  const res = await fetch('https://www.investorgain.com/report/mainboard-ipo-performance/332/');
  const html = await res.text();
  const buildIdMatch = html.match(/"buildId":"([^"]+)"/);
  console.log("Build ID:", buildIdMatch ? buildIdMatch[1] : 'Not found');
  
  // print all JSON data embedded
  const scriptMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (scriptMatch) {
      console.log("Found __NEXT_DATA__!");
  } else {
      console.log("No __NEXT_DATA__ found.");
      // it might be app router RSC payload:
      const chunks = html.split('self.__next_f.push(');
      console.log("RSC chunks:", chunks.length);
      for (let i = 1; i < chunks.length; i++) {
          if (chunks[i].includes('Hero Motors') || chunks[i].includes('NSE') || chunks[i].includes('Rentomojo')) {
              console.log("FOUND USER IPOS IN CHUNK", i);
          }
      }
  }
}
test();
