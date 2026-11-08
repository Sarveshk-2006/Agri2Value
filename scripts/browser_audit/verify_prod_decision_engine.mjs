import puppeteer from '../../frontend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROD_URL = 'https://agri2value.vercel.app';

(async () => {
  console.log('--- TESTING DECISION ENGINE & ALL TABS ON ' + PROD_URL + ' ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const network404s = [];
  const consoleErrors = [];

  page.on('response', resp => {
    if (resp.status() === 404) {
      network404s.push({ url: resp.url(), status: resp.status() });
      console.log('404 DETECTED:', resp.url());
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('CONSOLE ERROR:', msg.text());
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
    console.log('PAGE ERROR:', err.toString());
  });

  try {
    // 1. Visit /app/decision directly
    console.log('Navigating to /app/decision...');
    await page.goto(`${PROD_URL}/app/decision`, { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise(r => setTimeout(r, 3000));

    // Try finding and clicking evaluate / optimize button
    const buttons = await page.$$('button');
    console.log(`Found ${buttons.length} buttons on page.`);
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && (text.includes('Evaluate') || text.includes('Recalculate') || text.includes('Compare'))) {
        console.log(`Clicking button: "${text.trim()}"`);
        await btn.click();
        await new Promise(r => setTimeout(r, 2000));
        break;
      }
    }

    await page.screenshot({ path: 'C:/Users/Sarvesh Kulkarni/.gemini/antigravity/brain/3cb2df03-6d76-4390-8e30-9f5e5e0a8314/live_decision_engine_verified.png' });

    // 2. Also visit dashboard /app
    console.log('Navigating to /app...');
    await page.goto(`${PROD_URL}/app`, { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: 'C:/Users/Sarvesh Kulkarni/.gemini/antigravity/brain/3cb2df03-6d76-4390-8e30-9f5e5e0a8314/live_dashboard_verified.png' });

    console.log('\n--- VERIFICATION SUMMARY ---');
    console.log(`Total 404 responses: ${network404s.length}`);
    console.log(`Total console errors: ${consoleErrors.length}`);
    if (network404s.length === 0 && consoleErrors.length === 0) {
      console.log('SUCCESS: ZERO 404s and ZERO console errors!');
    } else {
      console.log('FAILURES:', { network404s, consoleErrors });
    }
  } catch (err) {
    console.error('Audit run error:', err);
  } finally {
    await browser.close();
  }
})();
