// scripts/browser_audit/verify_live_production_decluttered.mjs
import puppeteer from '../../frontend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROD_URL = 'https://agri2value.vercel.app';
const ARTIFACT_DIR = 'C:\\Users\\Sarvesh Kulkarni\\.gemini\\antigravity\\brain\\3cb2df03-6d76-4390-8e30-9f5e5e0a8314';

async function verifyLiveProductionDecluttered() {
  console.log('================================================================');
  console.log(`VERIFYING LIVE PRODUCTION: ${PROD_URL}`);
  console.log('================================================================');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Landing Page
  console.log('\n--- 1. Checking Live Production Landing Page ---');
  await page.goto(`${PROD_URL}/`, { waitUntil: 'networkidle2', timeout: 35000 });
  await new Promise(r => setTimeout(r, 1000));
  const landingShot = path.join(ARTIFACT_DIR, 'phase6_live_prod_landing_clean.png');
  await page.screenshot({ path: landingShot });

  // 2. Login to Authenticated Console
  console.log('\n--- 2. Logging into Live Authenticated Console ---');
  await page.goto(`${PROD_URL}/login`, { waitUntil: 'networkidle2', timeout: 35000 });
  await new Promise(r => setTimeout(r, 800));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const submitBtn = buttons.find(b => b.getAttribute('type') === 'submit' || b.textContent.includes('Verify & Enter') || b.textContent.includes('Verify OTP'));
    if (submitBtn) submitBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const results = {};

  // 3. Farmer Profile (/app/profile)
  console.log('\n--- 3. Checking Live Farmer Profile Overview ---');
  await page.goto(`${PROD_URL}/app/profile`, { waitUntil: 'networkidle2', timeout: 35000 });
  await new Promise(r => setTimeout(r, 1500));
  const profileShot = path.join(ARTIFACT_DIR, 'phase6_live_prod_profile_clean.png');
  await page.screenshot({ path: profileShot });

  const profileCheck = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasAvatar: text.includes('Farmer') && text.includes('100%'),
      has4Pastels: text.includes('TOTAL BOOKINGS') && text.includes('UPCOMING') && text.includes('MY LISTINGS') && text.includes('NET PROFIT'),
      hasServicesHeader: text.includes('SMART FARMING SERVICES'),
      hasColdStorageLocator: text.includes('Cold Storage Locator'),
      hasClaims: text.includes('Crop Protection Claims') || text.includes('Claims'),
      hasScanner: text.includes('Crop Disease Scanner') || text.includes('Scanner'),
      hasAnalyzer: text.includes('Profit & Risk Analyzer'),
      hasIoT: text.includes('ESP32 LIVE') && text.includes('SOIL MOISTURE'),
      hasMandi: text.includes('Mandi Market Advisor'),
      hasDamageFund: text.includes('Damage Protection Fund'),
      hasRecentActivity: text.includes('Recent Activity'),
    };
  });
  console.log('Profile checks:', profileCheck);
  results.profile = profileCheck;

  // 4. Cold Storage & Map (/app/infra)
  console.log('\n--- 4. Checking Live Cold Storage Map & Hubs ---');
  await page.goto(`${PROD_URL}/app/infra`, { waitUntil: 'networkidle2', timeout: 35000 });
  await new Promise(r => setTimeout(r, 2000));
  const infraShot = path.join(ARTIFACT_DIR, 'phase6_live_prod_infra_clean.png');
  await page.screenshot({ path: infraShot });

  const infraCheck = await page.evaluate(() => {
    const text = document.body.innerText;
    const hasSearch = !!document.querySelector('input[placeholder*="Search nearby cold storage"]');
    const hasFilterPills = text.includes('ALL') && text.includes('FRUITS') && text.includes('VEGETABLES') && text.includes('DAIRY');
    const hasFacilities = text.includes('Shri Krishna Cold Storage') && text.includes('Pioneer Agro Cooling');
    const hasLeaflet = !!document.querySelector('.leaflet-container');
    const hasMarker = !!document.querySelector('.cold-storage-marker-icon');
    return { hasSearch, hasFilterPills, hasFacilities, hasLeaflet, hasMarker };
  });
  console.log('Infra checks:', infraCheck);
  results.coldStorage = infraCheck;

  // 5. IoT & Telematics (/app/iot)
  console.log('\n--- 5. Checking Live IoT Telematics (Decluttered Simulator) ---');
  await page.goto(`${PROD_URL}/app/iot`, { waitUntil: 'networkidle2', timeout: 35000 });
  await new Promise(r => setTimeout(r, 1500));
  const iotShot = path.join(ARTIFACT_DIR, 'phase6_live_prod_iot_clean.png');
  await page.screenshot({ path: iotShot });

  const iotCheck = await page.evaluate(() => {
    const text = document.body.innerText;
    const hasGauges = text.includes('Soil Volumetric Moisture') && text.includes('Ambient Air Temperature');
    const hasCollapsibleSim = text.includes('Microclimate Scenario Simulator') && text.includes('Open Simulator');
    const hasTrends = text.includes('Environmental Intelligence & Time-Series Trends');
    const hasCollapsibleLedger = text.includes('Sensor Telemetry & Ingestion Ledger') && text.includes('View Ledger');
    return { hasGauges, hasCollapsibleSim, hasTrends, hasCollapsibleLedger };
  });
  console.log('IoT checks:', iotCheck);
  results.iot = iotCheck;

  // 6. Crop Rescue (/app/rescue)
  console.log('\n--- 6. Checking Live Crop Rescue ---');
  await page.goto(`${PROD_URL}/app/rescue`, { waitUntil: 'networkidle2', timeout: 35000 });
  await new Promise(r => setTimeout(r, 1500));
  const rescueShot = path.join(ARTIFACT_DIR, 'phase6_live_prod_rescue_clean.png');
  await page.screenshot({ path: rescueShot });

  const rescueCheck = await page.evaluate(() => {
    const text = document.body.innerText;
    const hasUrgency = text.includes('URGENT RESCUE REQUIRED');
    const hasPathways = text.includes('Emergency Cold Chain Stash') || text.includes('Salvage');
    const hasCollapsibleSim = text.includes('What-If Scenario Simulator');
    return { hasUrgency, hasPathways, hasCollapsibleSim };
  });
  console.log('Crop rescue checks:', rescueCheck);
  results.cropRescue = rescueCheck;

  // 7. Check Floating Circular Chat Button
  const hasChatFloating = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Open Krishi Advisory"]');
    return !!btn;
  });
  console.log('Floating circular chat button:', hasChatFloating);
  results.hasChatFloating = hasChatFloating;

  // Save summary artifact
  const auditSummaryPath = path.join(ARTIFACT_DIR, 'phase6_live_production_decluttered_audit.json');
  fs.writeFileSync(auditSummaryPath, JSON.stringify(results, null, 2));

  await browser.close();
  console.log('\n================================================================');
  console.log('LIVE PRODUCTION AUDIT COMPLETED SUCCESSFULLY!');
  console.log('================================================================');
}

verifyLiveProductionDecluttered().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});

