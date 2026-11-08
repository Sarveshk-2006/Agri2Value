// scripts/browser_audit/verify_decluttered_views.mjs
import puppeteer from '../../frontend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const LOCAL_URL = 'http://localhost:4173';
const ARTIFACT_DIR = 'C:\\Users\\Sarvesh Kulkarni\\.gemini\\antigravity\\brain\\3cb2df03-6d76-4390-8e30-9f5e5e0a8314';

async function verifyDeclutteredViews() {
  console.log('================================================================');
  console.log('AGRI2VALUE: AUDITING DECLUTTERED & MINIMAL USER-FRIENDLY UI');
  console.log('================================================================');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Step 0: Login via /login
  console.log('\n--- 0. Logging into Farmer Console ---');
  await page.goto(`${LOCAL_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 600));

  // Click Submit button to log in with default demo farmer credentials
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const submitBtn = buttons.find(b => b.getAttribute('type') === 'submit' || b.textContent.includes('Verify & Enter') || b.textContent.includes('Verify OTP'));
    if (submitBtn) submitBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const results = {
    coldStorage: false,
    profileOverview: false,
    cropRescue: false,
    protectionLedger: false,
    buyersNetwork: false,
    decisionEngine: false,
    floatingChatButton: false,
  };

  // 1. Audit Cold Storage Split Map (/app/infra)
  console.log('\n--- 1. Auditing Cold Storage & Infrastructure Tab ---');
  await page.goto(`${LOCAL_URL}/app/infra`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1200));

  const coldStorageShot = path.join(ARTIFACT_DIR, 'phase6_decluttered_cold_storage.png');
  await page.screenshot({ path: coldStorageShot });

  const infraCheck = await page.evaluate(() => {
    const text = document.body.innerText;
    const hasSearch = !!document.querySelector('input[placeholder*="Search nearby cold storage"]');
    const hasFilterPills = text.includes('ALL') && text.includes('FRUITS') && text.includes('VEGETABLES') && text.includes('DAIRY');
    const hasFacilities = text.includes('Shri Krishna Cold Storage') && text.includes('Pioneer Agro Cooling');
    const hasLeaflet = !!document.querySelector('.leaflet-container');
    const hasMarker = !!document.querySelector('.cold-storage-marker-icon');
    return { hasSearch, hasFilterPills, hasFacilities, hasLeaflet, hasMarker };
  });
  console.log('Cold storage checks:', infraCheck);
  results.coldStorage = Object.values(infraCheck).every(Boolean);

  // 2. Audit Farmer Profile (/app/profile)
  console.log('\n--- 2. Auditing Farmer Profile Overview (Matching Reference) ---');
  await page.goto(`${LOCAL_URL}/app/profile`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1200));

  const profileShot = path.join(ARTIFACT_DIR, 'phase6_decluttered_profile.png');
  await page.screenshot({ path: profileShot });

  const profileCheck = await page.evaluate(() => {
    const text = document.body.innerText;
    const hasAvatar = text.includes('Farmer') && text.includes('100%');
    const has4Pastels = text.includes('TOTAL BOOKINGS') && text.includes('UPCOMING') && text.includes('MY LISTINGS') && text.includes('NET PROFIT');
    const hasServicesHeader = text.includes('SMART FARMING SERVICES');
    const hasServices = text.includes('Cold Storage Locator') && text.includes('Profit & Risk Analyzer');
    const hasIoT = text.includes('ESP32 LIVE') && text.includes('SOIL MOISTURE') && text.includes('OPEN FARM PORTAL');
    const hasMandi = text.includes('Mandi Market Advisor');
    const hasDamageFund = text.includes('Damage Protection Fund') && text.includes('ACTIVE PROTECTION');
    const hasRecent = text.includes('Recent Activity');
    return { hasAvatar, has4Pastels, hasServicesHeader, hasServices, hasIoT, hasMandi, hasDamageFund, hasRecent };
  });
  console.log('Profile checks:', profileCheck);
  results.profileOverview = Object.values(profileCheck).every(Boolean);

  // Check floating chat button
  const chatButtonCheck = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Open Krishi Advisory"]');
    return !!btn;
  });
  console.log('Floating chat button present:', chatButtonCheck);
  results.floatingChatButton = chatButtonCheck;

  // 3. Audit Crop Rescue Tab (/app/rescue)
  console.log('\n--- 3. Auditing Crop Rescue (Minimal Uncluttered Layout) ---');
  await page.evaluate(() => {
    const rescueLink = Array.from(document.querySelectorAll('a, button')).find(el => el.textContent.includes('Crop Rescue') || el.textContent.includes('Rescue Mode'));
    if (rescueLink) rescueLink.click();
    else window.location.href = '/app/rescue';
  });
  await new Promise(r => setTimeout(r, 1500));

  const rescueShot = path.join(ARTIFACT_DIR, 'phase6_decluttered_crop_rescue.png');
  await page.screenshot({ path: rescueShot });

  const rescueCheck = await page.evaluate(() => {
    const text = document.body.innerText;
    const hasUrgency = text.includes('Emergency Perishable Salvage Protocol') || text.includes('Urgency Index') || text.includes('Urgency Score');
    const hasPathways = text.includes('Sahyadri') || text.includes('Food Processing') || text.includes('Distress') || text.includes('Salvage Pathways');
    const hasSimulatorButton = text.includes('What-If') || text.includes('Simulator');
    // Ensure raw factor percentages (35%, 30%, 20%, 15% breakdown text) are removed
    const hasClutter = text.includes('Urgency Score Factor Breakdown:');
    return { hasUrgency, hasPathways, hasSimulatorButton, clutterRemoved: !hasClutter };
  });
  console.log('Crop Rescue checks:', rescueCheck);
  results.cropRescue = Object.values(rescueCheck).every(Boolean);

  // 4. Audit Protection View (/app/protection)
  console.log('\n--- 4. Auditing Farmer Protection & Trust Ledger ---');
  await page.evaluate(() => {
    const protLink = Array.from(document.querySelectorAll('a, button')).find(el => el.textContent.includes('Protection') || el.textContent.includes('Trust Ledger'));
    if (protLink) protLink.click();
    else window.location.href = '/app/protection';
  });
  await new Promise(r => setTimeout(r, 1500));

  const protectionShot = path.join(ARTIFACT_DIR, 'phase6_decluttered_protection.png');
  await page.screenshot({ path: protectionShot });

  const protectionCheck = await page.evaluate(() => {
    const text = document.body.innerText;
    const hasStatCards = text.includes('Active Contracts') && text.includes('Expected Payout') && text.includes('Payments Settled') && text.includes('Escrow Protected');
    const hasCockpit = text.includes('Protected Settlement Ledger') && text.includes('Statutory Farmer Protection');
    const hasAgreementsList = text.includes('Active Commercial Agreements');
    // Ensure raw hash inspection text is clean
    const hasNoRawHashText = !text.includes('Inspect SHA-256 Hash');
    return { hasStatCards, hasCockpit, hasAgreementsList, hasNoRawHashText };
  });
  console.log('Protection checks:', protectionCheck);
  results.protectionLedger = Object.values(protectionCheck).every(Boolean);

  // 5. Audit Buyers View (/app/buyers)
  console.log('\n--- 5. Auditing Commercial Buyers Network ---');
  await page.goto(`${LOCAL_URL}/app/buyers`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1200));

  const buyersShot = path.join(ARTIFACT_DIR, 'phase6_decluttered_buyers.png');
  await page.screenshot({ path: buyersShot });

  const buyersCheck = await page.evaluate(() => {
    const text = document.body.innerText;
    const hasBuyers = text.includes('Sahyadri') || text.includes('Reliance');
    const hasSearch = !!document.querySelector('input[placeholder*="Search"]');
    return { hasBuyers, hasSearch };
  });
  console.log('Buyers checks:', buyersCheck);
  results.buyersNetwork = Object.values(buyersCheck).every(Boolean);

  // 6. Audit Profit Decision Engine (/app/decision)
  console.log('\n--- 6. Auditing Profit Decision Engine ---');
  await page.goto(`${LOCAL_URL}/app/decision`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1200));

  const decisionShot = path.join(ARTIFACT_DIR, 'phase6_decluttered_decision.png');
  await page.screenshot({ path: decisionShot });

  const decisionCheck = await page.evaluate(() => {
    const text = document.body.innerText;
    const hasNoDebugDropdown = !text.includes('PROCESSING_BOTTLENECK') && !text.includes('MISSING_DATA');
    const hasAction = text.includes('Calculate') || text.includes('Top Net Profit');
    return { hasNoDebugDropdown, hasAction };
  });
  console.log('Decision Engine checks:', decisionCheck);
  results.decisionEngine = Object.values(decisionCheck).every(Boolean);

  await browser.close();

  console.log('\n================================================================');
  console.log('FINAL AUDIT SUMMARY:');
  console.log(JSON.stringify(results, null, 2));
  console.log('================================================================');

  const reportPath = path.join(ARTIFACT_DIR, 'phase6_decluttered_ui_audit.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  return results;
}

verifyDeclutteredViews().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
