import puppeteer from '../../frontend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROD_URL = 'https://agri2value.vercel.app';
const ARTIFACT_DIR = 'C:\\Users\\Sarvesh Kulkarni\\.gemini\\antigravity\\brain\\3cb2df03-6d76-4390-8e30-9f5e5e0a8314';

(async () => {
  console.log('--- STARTING LIVE BROWSER AUDIT FOR ZERO ERRORS ON ' + PROD_URL + ' ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  const networkErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('Console Error:', msg.text());
    }
  });

  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    if (status >= 400 && !url.includes('favicon')) {
      networkErrors.push({ url, status });
      console.log(`Network Error: ${status} for ${url}`);
    }
  });

  try {
    // 1. Visit Home
    console.log('\n1. Navigating to landing page...');
    await page.goto(`${PROD_URL}/`, { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise(r => setTimeout(r, 2000));

    // 2. Visit Dashboard
    console.log('\n2. Navigating to /app/dashboard ...');
    await page.goto(`${PROD_URL}/app/dashboard`, { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise(r => setTimeout(r, 3000));

    // 3. Visit Farms
    console.log('\n3. Navigating to /app/farms ...');
    await page.goto(`${PROD_URL}/app/farms`, { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise(r => setTimeout(r, 2000));

    // 4. Visit Crop Lots
    console.log('\n4. Navigating to /app/lots ...');
    await page.goto(`${PROD_URL}/app/lots`, { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise(r => setTimeout(r, 2000));

    // 5. Visit Profile
    console.log('\n5. Navigating to /app/profile ...');
    await page.goto(`${PROD_URL}/app/profile`, { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise(r => setTimeout(r, 2000));

    // Capture screenshot
    const shotPath = path.join(ARTIFACT_DIR, 'phase6_live_zero_404_dashboard.png');
    await page.screenshot({ path: shotPath, fullPage: true });

    console.log('\n================================================================');
    console.log('AUDIT SUMMARY');
    console.log('================================================================');
    console.log(`Total 4xx/5xx network errors across 5 routes: ${networkErrors.length}`);
    console.log(`Total console errors across 5 routes: ${consoleErrors.length}`);

    if (networkErrors.length === 0 && consoleErrors.length === 0) {
      console.log('>>> SUCCESS: 0 404 network errors, 0 console errors on live production site! <<<');
    } else {
      console.log('Network errors encountered:', networkErrors);
      console.log('Console errors encountered:', consoleErrors);
    }
  } catch (err) {
    console.error('Audit exception:', err);
  } finally {
    await browser.close();
  }
})();
