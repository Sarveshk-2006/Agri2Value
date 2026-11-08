import puppeteer from '../../frontend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROD_URL = 'https://agri2value.vercel.app';
const ARTIFACT_DIR = 'C:\\Users\\Sarvesh Kulkarni\\.gemini\\antigravity\\brain\\3cb2df03-6d76-4390-8e30-9f5e5e0a8314';

(async () => {
  console.log('--- TESTING DASHBOARD LOADING ON ' + PROD_URL + '/app/dashboard ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleLogs = [];
  const errors = [];

  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('Console ERROR:', msg.text());
    }
  });

  page.on('pageerror', err => {
    errors.push(err.toString());
    console.log('Page Crash / Error:', err.toString());
  });

  try {
    await page.goto(`${PROD_URL}/app/dashboard`, { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise(r => setTimeout(r, 4000));

    // Verify key elements on Dashboard
    const welcomeHeader = await page.$eval('h1', el => el.textContent).catch(() => null);
    console.log('H1 Header Text:', welcomeHeader);

    const cardsCount = await page.$$eval('.card, section', els => els.length);
    console.log('Rendered Dashboard Cards/Sections:', cardsCount);

    const shotPath = path.join(ARTIFACT_DIR, 'phase6_dashboard_rendered_flawless.png');
    await page.screenshot({ path: shotPath, fullPage: true });
    console.log('Captured screenshot to:', shotPath);

    console.log('\nAudit Result:');
    console.log(`Total Errors: ${errors.length}`);
    if (errors.length === 0 && welcomeHeader && welcomeHeader.includes('Welcome back')) {
      console.log('✅ DASHBOARD LOADED FLAWLESSLY WITH ZERO RUNTIME ERRORS!');
    } else {
      console.log('❌ Dashboard had issues:', errors);
    }
  } catch (err) {
    console.error('Test failed with exception:', err);
  } finally {
    await browser.close();
  }
})();

