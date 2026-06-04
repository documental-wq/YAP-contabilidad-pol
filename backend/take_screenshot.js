import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
    console.log('Starting puppeteer...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    try {
        console.log('Navigating to http://127.0.0.1:5173...');
        await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle2', timeout: 60000 });

        console.log('Waiting for login form...');
        await page.waitForSelector('input[type="email"]', { timeout: 30000 });

        console.log('Typing credentials...');
        await page.type('input[type="email"]', 'admin@coraza.com');
        await page.type('input[type="password"]', 'Admin123!');

        console.log('Submitting form...');
        await page.click('button[type="submit"]');

        console.log('Waiting for navigation to /inicio...');
        await page.waitForFunction(() => window.location.pathname.includes('/inicio'), { timeout: 30000 });

        console.log('Logged in. Waiting for dashboard content...');
        // Wait for a common dashboard element, e.g. a stats card or the sidebar
        await new Promise(r => setTimeout(r, 5000)); // Wait a bit more for data to fetch

        const screenshotPath = path.resolve('dashboard_screenshot.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Screenshot saved to ${screenshotPath}`);

    } catch (error) {
        console.error('Error during execution:', error);
        // Take a screenshot of the error state if possible
        try {
            await page.screenshot({ path: path.resolve('error_screenshot.png') });
            console.log('Error screenshot saved');
        } catch (e) { }
    } finally {
        await browser.close();
        console.log('Browser closed.');
    }
})();

