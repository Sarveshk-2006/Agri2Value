import puppeteer from '../../frontend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'https://agri2value.vercel.app';
const ARTIFACT_DIR = 'C:\\Users\\Sarvesh Kulkarni\\.gemini\\antigravity\\brain\\3cb2df03-6d76-4390-8e30-9f5e5e0a8314';

async function auditConsole() {
  console.log('================================================================');
  console.log('AGRI2VALUE PHASE 6: LIVE FARMER CONSOLE & JOURNEY BROWSER AUDIT');
  console.log('================================================================');

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
      failure: req.failure() ? req.failure().errorText : 'Unknown',
      method: req.method()
    });
  });

  page.on('response', res => {
    networkRequests.push({
      url: res.url(),
      status: res.status(),
      contentType: res.headers()['content-type'] || '',
      ok: res.ok()
    });
  });

  // 1. Visit Login / Register page
  console.log('\n--- 1. Testing /login and /register ---');
  await page.goto(`${TARGET_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase6_live_auth_login.png') });
  
  const loginAudit = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input')).map(i => ({
      name: i.name,
      type: i.type,
      placeholder: i.placeholder,
      value: i.value
    }));
    const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim());
    return {
      title: document.title,
      inputs,
      buttons,
      hasQuickPilot: document.body.textContent.includes('Quick Pilot') || document.body.textContent.includes('Ramesh Patil')
    };
  });
  console.log('Login DOM Audit:', JSON.stringify(loginAudit, null, 2));

  // 2. Click submit or login to enter Farmer Console
  console.log('\n--- 2. Authenticating into Farmer Console ---');
  // Attempt submit on login form
  const loginBtn = await page.$('button[type="submit"]');
  if (loginBtn) {
    await loginBtn.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
  } else {
    await page.goto(`${TARGET_URL}/app/dashboard`, { waitUntil: 'networkidle2', timeout: 30000 });
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase6_live_app_dashboard.png') });
  console.log('Navigated to /app/dashboard. URL:', page.url());

  // 3. Test All 14 Farmer Console Modules
  const modulesToTest = [
    { name: 'Dashboard', path: '/app/dashboard', shot: 'phase6_live_view_dashboard.png' },
    { name: 'Farms & Land Holdings', path: '/app/farms', shot: 'phase6_live_view_farms.png' },
    { name: 'Harvest Produce Lots', path: '/app/lots', shot: 'phase6_live_view_lots.png' },
    { name: 'Profit Decision Engine', path: '/app/decision', shot: 'phase6_live_view_decision.png' },
    { name: 'Market & Weather Intel', path: '/app/market', shot: 'phase6_live_view_market.png' },
    { name: 'Commercial Buyer Network', path: '/app/buyers', shot: 'phase6_live_view_buyers.png' },
    { name: 'Logistics & Infrastructure', path: '/app/infra', shot: 'phase6_live_view_infra.png' },
    { name: 'Smart Execution Tracker', path: '/app/execution', shot: 'phase6_live_view_execution.png' },
    { name: 'Crop Rescue Watchdog', path: '/app/rescue', shot: 'phase6_live_view_rescue.png' },
    { name: 'Farmer Protection Ledger', path: '/app/protection', shot: 'phase6_live_view_protection.png' },
    { name: 'IoT Telematics', path: '/app/iot', shot: 'phase6_live_view_iot.png' },
    { name: 'Farmer Profile', path: '/app/profile', shot: 'phase6_live_view_profile.png' },
    { name: 'System Specifications', path: '/app/specs', shot: 'phase6_live_view_specs.png' },
  ];

  const moduleResults = [];

  for (const mod of modulesToTest) {
    console.log(`\nTesting Module: ${mod.name} (${mod.path})...`);
    await page.goto(`${TARGET_URL}${mod.path}`, { waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 800));

    // Capture screenshot
    const shotPath = path.join(ARTIFACT_DIR, mod.shot);
    await page.screenshot({ path: shotPath, fullPage: false });

    // Inspect DOM of module
    const modDOM = await page.evaluate((modName) => {
      const scrollW = document.documentElement.scrollWidth;
      const clientW = document.documentElement.clientWidth;
      const overflow = scrollW > clientW;

      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => h.textContent.trim().replace(/\s+/g, ' '));
      const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim().replace(/\s+/g, ' ')).filter(t => t.length > 0 && t.length < 40);
      const tables = document.querySelectorAll('table').length;
      const cards = document.querySelectorAll('.rounded-2xl, .rounded-xl, .card').length;
      const badges = Array.from(document.querySelectorAll('.badge, span[class*="badge"], span[class*="rounded"]')).map(b => b.textContent.trim()).filter(t => t.length > 0 && t.length < 30);

      // Check for specific trust indicators
      const text = document.body.textContent;
      const hasSimulatedDisclaimer = text.includes('simulated') || text.includes('Simulated') || text.includes('Demo Mode note');
      const hasProvenanceIndicator = text.includes('Agmarknet') || text.includes('Open-Meteo') || text.includes('LIVE') || text.includes('CACHED');
      const hasBoundaryIndicator = text.includes('Boundary') || text.includes('GPS') || text.includes('Survey');

      return {
        modName,
        headings: headings.slice(0, 8),
        buttonCount: buttons.length,
        buttons: buttons.slice(0, 10),
        tableCount: tables,
        cardCount: cards,
        badgeCount: badges.length,
        badges: badges.slice(0, 10),
        overflow,
        hasSimulatedDisclaimer,
        hasProvenanceIndicator,
        hasBoundaryIndicator
      };
    }, mod.name);

    moduleResults.push({
      ...mod,
      ...modDOM,
      screenshot: shotPath
    });
    console.log(`  Headings: ${modDOM.headings.join(' | ')}`);
    console.log(`  Cards: ${modDOM.cardCount}, Buttons: ${modDOM.buttonCount}, Tables: ${modDOM.tableCount}, Overflow: ${modDOM.overflow}`);
  }

  // 4. Test Language Switching (English <-> Marathi)
  console.log('\n--- 4. Testing Language Switcher ---');
  await page.goto(`${TARGET_URL}/app/dashboard`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  const langBefore = await page.evaluate(() => document.body.textContent.slice(0, 300));
  
  // Find language switch button
  const langToggle = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const langBtn = buttons.find(b => b.textContent.includes('English') || b.textContent.includes('मराठी'));
    if (langBtn) {
      langBtn.click();
      return true;
    }
    return false;
  });

  await new Promise(r => setTimeout(r, 800));
  const shotMr = path.join(ARTIFACT_DIR, 'phase6_live_app_dashboard_marathi.png');
  await page.screenshot({ path: shotMr });

  const langAfter = await page.evaluate(() => {
    const text = document.body.textContent;
    const hasMarathi = /[\u0900-\u097F]/.test(text);
    return {
      hasMarathi,
      snippet: text.slice(0, 300).replace(/\s+/g, ' ')
    };
  });
  console.log('Language switch clicked:', langToggle);
  console.log('Marathi detected in DOM:', langAfter.hasMarathi);

  // 5. Test AI Chatbot Popover / Widget
  console.log('\n--- 5. Testing AI Chatbot Widget ---');
  const chatAudit = await page.evaluate(() => {
    const chatBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.textContent.includes('AI') || b.textContent.includes('Advisor') || b.getAttribute('aria-label')?.includes('AI')
    );
    if (chatBtn) {
      chatBtn.click();
      return { found: true, text: chatBtn.textContent.trim() };
    }
    return { found: false };
  });

  await new Promise(r => setTimeout(r, 800));
  const shotChat = path.join(ARTIFACT_DIR, 'phase6_live_ai_chatbot.png');
  await page.screenshot({ path: shotChat });

  await browser.close();

  // Save Comprehensive Result
  const report = {
    targetUrl: TARGET_URL,
    timestamp: new Date().toISOString(),
    loginAudit,
    moduleResults,
    languageSwitch: {
      toggleFound: langToggle,
      marathiRendered: langAfter.hasMarathi,
      sampleSnippet: langAfter.snippet
    },
    chatAudit,
    consoleLogs,
    failedRequests,
    totalConsoleErrors: consoleLogs.filter(l => l.type === 'error' || l.type === 'uncaught-error').length,
    totalNetworkFailures: failedRequests.length
  };

  const outFile = path.join(ARTIFACT_DIR, 'phase6_live_console_audit.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(`\nAudit successfully completed. Results written to ${outFile}`);
}

auditConsole().catch(err => {
  console.error('Fatal in auditConsole:', err);
  process.exit(1);
});

