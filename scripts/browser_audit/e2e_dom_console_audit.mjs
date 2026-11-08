import puppeteer from '../../frontend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'https://agri2value.vercel.app';

const ROUTES_TO_AUDIT = [
  // Public
  { name: 'Public Home', path: '/' },
  { name: 'Public About', path: '/about' },
  { name: 'Public How It Works', path: '/how-it-works' },
  { name: 'Public Features', path: '/features' },
  { name: 'Public Contact', path: '/contact' },
  { name: 'Auth Login', path: '/login' },
  { name: 'Auth Register', path: '/register' },
  // Authenticated Dashboard & Core
  { name: 'App Dashboard', path: '/app/dashboard' },
  { name: 'App Farms & Land', path: '/app/farms' },
  { name: 'App Harvest Lots', path: '/app/lots' },
  { name: 'App Profit Engine', path: '/app/decision' },
  { name: 'App Market & Weather', path: '/app/market' },
  { name: 'App Buyers Network', path: '/app/buyers' },
  { name: 'App Infrastructure & Cold Storage', path: '/app/infra' },
  { name: 'App Execution Tracker', path: '/app/execution' },
  { name: 'App Crop Rescue', path: '/app/rescue' },
  { name: 'App Protection Fund', path: '/app/protection' },
  { name: 'App IoT Monitoring', path: '/app/iot' },
  { name: 'App Farmer Profile', path: '/app/profile' },
  { name: 'App Specs & Architecture', path: '/app/specs' },
  { name: 'App Govt Schemes', path: '/app/schemes' },
  { name: 'App Equipment Hiring', path: '/app/equipment' },
  { name: 'App Pesticide Exchange', path: '/app/pesticide-exchange' },
  { name: 'App Labour Hiring', path: '/app/labour' },
  { name: 'App Legal Advisor', path: '/app/legal-advisor' },
];

(async () => {
  console.log(`=======================================================`);
  console.log(`Starting Comprehensive End-to-End DOM & Console Audit`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`=======================================================\n`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const auditResults = [];

  for (const route of ROUTES_TO_AUDIT) {
    console.log(`Auditing [${route.name}] (${route.path}) ...`);
    const routeErrors = [];
    const routeWarnings = [];
    const failedRequests = [];
    const brokenImages = [];

    const consoleHandler = msg => {
      const type = msg.type();
      const text = msg.text();
      // Filter out benign Vite/React dev warnings if any
      if (type === 'error') {
        routeErrors.push({ type: 'CONSOLE_ERROR', text });
      } else if (type === 'warning' || type === 'warn') {
        if (!text.includes('download the React DevTools') && !text.includes('React Router Future Flag Warning')) {
          routeWarnings.push({ type: 'CONSOLE_WARN', text });
        }
      }
    };

    const pageErrorHandler = err => {
      routeErrors.push({ type: 'PAGE_EXCEPTION', text: err.toString(), stack: err.stack });
    };

    const responseHandler = resp => {
      const status = resp.status();
      const url = resp.url();
      if (status >= 400 && !url.includes('favicon.ico')) {
        failedRequests.push({ url, status, statusText: resp.statusText() });
      }
    };

    const requestFailedHandler = req => {
      const url = req.url();
      const failure = req.failure();
      const errorText = failure?.errorText || '';
      // Map tile aborts on route transition are standard browser behavior
      if (errorText.includes('ERR_ABORTED') && (url.includes('tile.openstreetmap.org') || url.includes('.png'))) {
        return;
      }
      if (!url.includes('favicon.ico')) {
        failedRequests.push({ url, errorText: errorText || 'Unknown failure' });
      }
    };

    page.on('console', consoleHandler);
    page.on('pageerror', pageErrorHandler);
    page.on('response', responseHandler);
    page.on('requestfailed', requestFailedHandler);

    try {
      const fullUrl = `${BASE_URL}${route.path}`;
      const res = await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 1200));

      // Inspect DOM for broken images
      const images = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs.map(img => ({
          src: img.src,
          naturalWidth: img.naturalWidth,
          complete: img.complete,
          alt: img.alt
        })).filter(img => img.complete && img.naturalWidth === 0 && img.src && !img.src.startsWith('data:'));
      });
      if (images.length > 0) {
        brokenImages.push(...images);
      }

      // Check key DOM interactivity: Click some buttons or tabs if present
      const interactiveElements = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button:not([disabled])'));
        const links = Array.from(document.querySelectorAll('a[href]'));
        return {
          buttonCount: btns.length,
          linkCount: links.length,
          hasMain: !!document.querySelector('main'),
          title: document.title
        };
      });

      // Try interacting with tab buttons or filter buttons on this page
      const filterPills = await page.$$('button');
      if (filterPills.length > 0) {
        for (let i = 0; i < Math.min(filterPills.length, 3); i++) {
          try {
            const btn = filterPills[i];
            const isVisible = await btn.isIntersectingViewport();
            if (isVisible) {
              await btn.click().catch(() => {});
              await new Promise(r => setTimeout(r, 200));
            }
          } catch {}
        }
      }

      auditResults.push({
        name: route.name,
        path: route.path,
        httpStatus: res ? res.status() : 'Unknown',
        interactivity: interactiveElements,
        errors: routeErrors,
        warnings: routeWarnings,
        failedRequests,
        brokenImages,
        passed: routeErrors.length === 0 && failedRequests.length === 0 && brokenImages.length === 0
      });

      const statusMarker = (routeErrors.length === 0 && failedRequests.length === 0) ? 'PASS' : 'FAIL';
      console.log(`  -> ${statusMarker} (Errors: ${routeErrors.length}, FailedReqs: ${failedRequests.length}, Warnings: ${routeWarnings.length})\n`);

    } catch (e) {
      console.error(`  -> ERROR testing ${route.path}:`, e.message);
      auditResults.push({
        name: route.name,
        path: route.path,
        errors: [{ type: 'NAVIGATION_ERROR', text: e.message }],
        warnings: [],
        failedRequests: [],
        brokenImages: [],
        passed: false
      });
    } finally {
      page.off('console', consoleHandler);
      page.off('pageerror', pageErrorHandler);
      page.off('response', responseHandler);
      page.off('requestfailed', requestFailedHandler);
    }
  }

  // Test Floating Chatbot interaction
  console.log(`Auditing Floating AI Farmer Advisor Chatbot ...`);
  try {
    await page.goto(`${BASE_URL}/app/dashboard`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    const chatBtn = await page.$('button[aria-label="Open AI Advisor Chat"], button.fixed.bottom-6.right-6, button:has(svg.lucide-bot)');
    if (chatBtn) {
      console.log('  Found floating chatbot button, clicking...');
      await chatBtn.click();
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: 'C:/Users/Sarvesh Kulkarni/.gemini/antigravity/brain/3cb2df03-6d76-4390-8e30-9f5e5e0a8314/audit_chatbot_opened.png' });
    }
  } catch (err) {
    console.log('  Chatbot audit note:', err.message);
  }

  await browser.close();

  // Print Complete Summary
  console.log(`\n=======================================================`);
  console.log(`AUDIT COMPLETE SUMMARY`);
  console.log(`=======================================================`);
  let totalErrors = 0;
  let totalFailedReqs = 0;
  let totalBrokenImgs = 0;

  for (const res of auditResults) {
    totalErrors += res.errors.length;
    totalFailedReqs += res.failedRequests.length;
    totalBrokenImgs += res.brokenImages.length;
    if (!res.passed) {
      console.log(`\n[FAILED] ${res.name} (${res.path}):`);
      if (res.errors.length > 0) console.log('  Errors:', JSON.stringify(res.errors, null, 2));
      if (res.failedRequests.length > 0) console.log('  Failed Requests:', JSON.stringify(res.failedRequests, null, 2));
      if (res.brokenImages.length > 0) console.log('  Broken Images:', JSON.stringify(res.brokenImages, null, 2));
    }
  }

  console.log(`\nTOTALS:`);
  console.log(`  Routes Audited: ${auditResults.length}`);
  console.log(`  Passed Routes: ${auditResults.filter(r => r.passed).length}`);
  console.log(`  Failed Routes: ${auditResults.filter(r => !r.passed).length}`);
  console.log(`  Total Console Errors: ${totalErrors}`);
  console.log(`  Total Failed Requests: ${totalFailedReqs}`);
  console.log(`  Total Broken Images: ${totalBrokenImgs}`);

  // Write detailed audit json to disk for reporting
  import('fs').then(fs => {
    fs.writeFileSync(
      'C:/Users/Sarvesh Kulkarni/.gemini/antigravity/brain/3cb2df03-6d76-4390-8e30-9f5e5e0a8314/comprehensive_dom_audit.json',
      JSON.stringify(auditResults, null, 2)
    );
  });
})();

