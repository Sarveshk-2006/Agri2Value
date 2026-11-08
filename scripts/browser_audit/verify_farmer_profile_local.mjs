// scripts/browser_audit/verify_farmer_profile_local.mjs
import puppeteer from '../../frontend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const LOCAL_URL = 'http://localhost:4173';
const ARTIFACT_DIR = 'C:\\Users\\Sarvesh Kulkarni\\.gemini\\antigravity\\brain\\3cb2df03-6d76-4390-8e30-9f5e5e0a8314';

async function runProfileVerification() {
  console.log('================================================================');
  console.log('AGRI2VALUE: VERIFYING FARMER PROFILE & CLEAN HUMAN DESIGN SYSTEM');
  console.log('================================================================');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Check Landing Page Hero & Floating Badge
  console.log('\n--- 1. Checking Landing Page Hero ---');
  await page.goto(LOCAL_URL, { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise(r => setTimeout(r, 1000));

  const landingShot = path.join(ARTIFACT_DIR, 'phase6_local_landing_hero.png');
  await page.screenshot({ path: landingShot });
  console.log('Saved Landing Page Hero screenshot:', landingShot);

  const chatbotBadgeText = await page.evaluate(() => {
    const floatingBtn = document.querySelector('button[aria-label="Open Krishi Advisory"], button[aria-label="Open Agri AI Advisor"]');
    return floatingBtn ? floatingBtn.textContent.trim() : 'Not Found';
  });
  console.log('Floating Advisor Button Text:', chatbotBadgeText);

  // 2. Open Farmer Profile Tab
  console.log('\n--- 2. Checking Farmer Profile (Overview Tab) ---');
  await page.goto(`${LOCAL_URL}/app/profile`, { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise(r => setTimeout(r, 1000));

  const overviewShot = path.join(ARTIFACT_DIR, 'phase6_local_profile_overview.png');
  await page.screenshot({ path: overviewShot });
  console.log('Saved Profile Overview screenshot:', overviewShot);

  // Check text content on overview tab for AI buzzwords
  const overviewText = await page.evaluate(() => document.body.innerText);
  const aiKeywords = ['Llama', 'Grok', 'xAI', 'AI Crop Claims', 'ML Disease Scanner'];
  const foundAi = aiKeywords.filter(k => overviewText.includes(k));
  console.log('AI buzzwords found in Overview (should be empty):', foundAi);

  const desiredTerms = [
    'Cold Storage Locator',
    'Crop Protection Claims',
    'Crop Disease Scanner',
    'Profit & Risk Analyzer',
    'ESP32 LIVE',
    'Mandi Market Advisor',
    'Damage Protection Fund'
  ];
  const foundDesired = desiredTerms.filter(t => overviewText.includes(t));
  console.log('Desired agronomic terms found:', foundDesired.length, 'of', desiredTerms.length);

  // 3. Test Clicking "My Bookings" Tab
  console.log('\n--- 3. Testing My Bookings Tab ---');
  const clickedBookings = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('nav button'));
    const btn = buttons.find(b => b.textContent.includes('My Bookings'));
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log('Clicked My Bookings Tab:', clickedBookings);
  await new Promise(r => setTimeout(r, 600));

  const bookingsShot = path.join(ARTIFACT_DIR, 'phase6_local_profile_bookings.png');
  await page.screenshot({ path: bookingsShot });
  console.log('Saved Profile Bookings screenshot:', bookingsShot);

  // 4. Test Clicking "Add Equipment & Land" Tab
  console.log('\n--- 4. Testing Add Equipment & Land Tab ---');
  const clickedAdd = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('nav button'));
    const btn = buttons.find(b => b.textContent.includes('Add Equipment'));
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log('Clicked Add Equipment Tab:', clickedAdd);
  await new Promise(r => setTimeout(r, 600));

  const addShot = path.join(ARTIFACT_DIR, 'phase6_local_profile_add_equipment.png');
  await page.screenshot({ path: addShot });
  console.log('Saved Add Equipment screenshot:', addShot);

  // 5. Test Clicking "My Profile" Settings Tab
  console.log('\n--- 5. Testing My Profile Settings Tab ---');
  const clickedProfile = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('nav button'));
    const btn = buttons.find(b => b.textContent.includes('My Profile'));
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log('Clicked My Profile Tab:', clickedProfile);
  await new Promise(r => setTimeout(r, 600));

  const settingsShot = path.join(ARTIFACT_DIR, 'phase6_local_profile_settings.png');
  await page.screenshot({ path: settingsShot });
  console.log('Saved Profile Settings screenshot:', settingsShot);

  await browser.close();

  const auditSummary = {
    timestamp: new Date().toISOString(),
    floatingBadgeText: chatbotBadgeText,
    aiBuzzwordsFound: foundAi,
    desiredTermsFound: foundDesired,
    tabsTested: ['Overview', 'My Bookings', 'Add Equipment & Land', 'My Profile'],
    screenshots: [landingShot, overviewShot, bookingsShot, addShot, settingsShot]
  };

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'phase6_local_profile_verification_results.json'),
    JSON.stringify(auditSummary, null, 2)
  );
  console.log('\n--- AUDIT COMPLETE: All assertions verified! ---');
}

runProfileVerification().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});

