import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type().toUpperCase()}]: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`[PAGE ERROR]: ${err.toString()}`);
  });

  console.log("Navigating to https://yap-app-don-francisco.surge.sh/login ...");
  await page.goto('https://yap-app-don-francisco.surge.sh/login', { waitUntil: 'networkidle0' });
  
  console.log("Done.");
  await browser.close();
})();
