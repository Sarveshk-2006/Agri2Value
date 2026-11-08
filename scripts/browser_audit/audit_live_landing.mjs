import puppeteer from '../../frontend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'https://agri2value.vercel.app/';
const ARTIFACT_DIR = 'C:\\Users\\Sarvesh Kulkarni\\.gemini\\antigravity\\brain\\3cb2df03-6d76-4390-8e30-9f5e5e0a8314';

async function auditLanding() {
  console.log(`Starting Live Browser Audit of ${TARGET_URL}`);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleLogs = [];
  const networkRequests = [];
  const failedRequests = [];

  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  page.on('pageerror', err => {
    consoleLogs.push({
      type: 'uncaught-error',
      text: err.message,
      stack: err.stack
    });
  });

  page.on('requestfailed', req => {
    failedRequests.push({
      url: req.url(),
      failure: req.failure() ? req.failure().errorText : 'Unknown failure',
      method: req.method()
    });
  });

  page.on('response', res => {
    networkRequests.push({
      url: res.url(),
      status: res.status(),
      statusText: res.statusText(),
      contentType: res.headers()['content-type'] || '',
      ok: res.ok()
    });
  });

  console.log('Navigating to live landing page...');
  const navStart = performance.now();
  const response = await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 45000 });
  const navDuration = Math.round(performance.now() - navStart);

  const status = response ? response.status() : 0;
  const title = await page.title();

  console.log(`Navigation complete in ${navDuration}ms, Status: ${status}, Title: "${title}"`);

  // Inspect DOM Elements
  const domAudit = await page.evaluate(() => {
    const nav = document.querySelector('nav');
    const hero = document.querySelector('section');
    const buttons = Array.from(document.querySelectorAll('button, a')).map(el => ({
      tag: el.tagName,
      text: (el.textContent || '').trim().replace(/\s+/g, ' '),
      href: el.getAttribute('href'),
      role: el.getAttribute('role'),
      visible: el.offsetParent !== null
    })).filter(b => b.text.length > 0 && b.text.length < 50);

    const images = Array.from(document.querySelectorAll('img')).map(img => ({
      src: img.src,
      alt: img.alt,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      broken: img.naturalWidth === 0
    }));

    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => ({
      level: h.tagName,
      text: (h.textContent || '').trim().replace(/\s+/g, ' ')
    }));

    const scrollWidth = document.documentElement.scrollWidth;
    const clientWidth = document.documentElement.clientWidth;
    const hasHorizontalOverflow = scrollWidth > clientWidth;

    return {
      title: document.title,
      hasNav: !!nav,
      hasHero: !!hero,
      buttonCount: buttons.length,
      buttons: buttons.slice(0, 20),
      images,
      headings: headings.slice(0, 15),
      hasHorizontalOverflow,
      scrollWidth,
      clientWidth
    };
  });

  // Capture Screenshot
  const screenshotPath = path.join(ARTIFACT_DIR, 'phase6_live_landing_desktop_1440.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Saved screenshot to ${screenshotPath}`);

  // Responsive Viewports Audit
  const viewports = [
    { name: 'mobile_375', width: 375, height: 812 },
    { name: 'mobile_large_430', width: 430, height: 932 },
    { name: 'tablet_768', width: 768, height: 1024 },
    { name: 'laptop_1366', width: 1366, height: 768 },
    { name: 'desktop_1440', width: 1440, height: 900 },
    { name: 'large_desktop_1920', width: 1920, height: 1080 }
  ];

  const responsiveResults = [];
  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await new Promise(r => setTimeout(r, 600));

    const vpAudit = await page.evaluate((vpWidth) => {
      const scrollW = document.documentElement.scrollWidth;
      const clientW = document.documentElement.clientWidth;
      const overflow = scrollW > clientW + 1;
      return {
        overflow,
        scrollW,
        clientW
      };
    }, vp.width);

    const vpShot = path.join(ARTIFACT_DIR, `phase6_live_landing_${vp.name}.png`);
    await page.screenshot({ path: vpShot, fullPage: false });

    responsiveResults.push({
      ...vp,
      ...vpAudit,
      screenshot: vpShot
    });
  }

  await browser.close();

  const auditReport = {
    url: TARGET_URL,
    timestamp: new Date().toISOString(),
    status,
    title,
    navDurationMs: navDuration,
    domAudit,
    responsiveResults,
    consoleLogs,
    failedRequests,
    totalNetworkRequests: networkRequests.length,
    networkRequestsSummary: networkRequests.map(r => ({ status: r.status, url: r.url }))
  };

  const reportPath = path.join(ARTIFACT_DIR, 'phase6_live_landing_audit.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2));
  console.log(`Wrote audit JSON to ${reportPath}`);

  console.log('\n--- AUDIT SUMMARY ---');
  console.log(`Title: ${title}`);
  console.log(`Horizontal Overflow (Desktop): ${domAudit.hasHorizontalOverflow ? 'YES (BUG)' : 'NO (CLEAN)'}`);
  console.log(`Total Console Messages: ${consoleLogs.length}`);
  console.log(`Uncaught JS Errors: ${consoleLogs.filter(l => l.type === 'uncaught-error' || l.type === 'error').length}`);
  console.log(`Failed Network Requests: ${failedRequests.length}`);
  console.log(`Broken Images: ${domAudit.images.filter(i => i.broken).length}`);
  console.log('---------------------\n');
}

auditLanding().catch(err => {
  console.error('Fatal in auditLanding:', err);
  process.exit(1);
});
