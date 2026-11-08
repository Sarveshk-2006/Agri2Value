// scripts/browser_audit/verify_live_deployed_features.mjs
import puppeteer from '../../frontend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const LIVE_URL = 'https://agri2value.vercel.app';
const ARTIFACT_DIR = 'C:\\Users\\Sarvesh Kulkarni\\.gemini\\antigravity\\brain\\3cb2df03-6d76-4390-8e30-9f5e5e0a8314';

async function verifyLiveDeployment() {
  console.log('================================================================');
  console.log('AGRI2VALUE: VERIFYING LIVE PRODUCTION DEPLOYMENT AT VERCEL URL');
  console.log('Target:', LIVE_URL);
  console.log('================================================================');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const auditReport = {
    liveUrl: LIVE_URL,
    timestamp: new Date().toISOString(),
    pages: {}
  };

  try {
    // 1. Landing Page
    console.log('\n--- 1. Testing Live Landing Page ---');
    await page.goto(`${LIVE_URL}`, { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise(r => setTimeout(r, 1500));

    const landingShot = path.join(ARTIFACT_DIR, 'phase6_live_production_landing.png');
    await page.screenshot({ path: landingShot });
    console.log('Saved live landing screenshot:', landingShot);

    const landingText = await page.evaluate(() => document.body.innerText);
    auditReport.pages.landing = {
      hasHeroHeadline: landingText.includes('AGRICULTURE. CONNECTED.') && landingText.includes('INTELLIGENT. PROFITABLE.'),
      hasConsoleBtn: landingText.includes('Open Farmer Console')
    };

    // 2. Govt Schemes View
    console.log('\n--- 2. Testing Live /app/schemes ---');
    await page.goto(`${LIVE_URL}/app/schemes`, { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise(r => setTimeout(r, 1500));

    const schemesShot = path.join(ARTIFACT_DIR, 'phase6_live_production_schemes.png');
    await page.screenshot({ path: schemesShot });
    console.log('Saved live schemes screenshot:', schemesShot);

    const schemesText = await page.evaluate(() => document.body.innerText);
    auditReport.pages.schemes = {
      hasTitle: schemesText.includes('Government Subsidies & Schemes'),
      hasCalculator: schemesText.includes('Estimate Your Total Government Benefits'),
      hasPmfby: schemesText.includes('PM Fasal Bima Yojana'),
      hasSmam: schemesText.includes('Sub-Mission on Agricultural Mechanization'),
      hasKusum: schemesText.includes('PM-KUSUM')
    };

    // 3. Equipment Marketplace View
    console.log('\n--- 3. Testing Live /app/equipment ---');
    await page.goto(`${LIVE_URL}/app/equipment`, { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise(r => setTimeout(r, 1500));

    const equipmentShot = path.join(ARTIFACT_DIR, 'phase6_live_production_equipment.png');
    await page.screenshot({ path: equipmentShot });
    console.log('Saved live equipment screenshot:', equipmentShot);

    const equipmentText = await page.evaluate(() => document.body.innerText);
    auditReport.pages.equipment = {
      hasTitle: equipmentText.includes('Farm Implements & Equipment Marketplace'),
      hasMahindra: equipmentText.includes('Mahindra 575 DI'),
      hasJohnDeere: equipmentText.includes('John Deere 5050D'),
      hasHourlyTariff: equipmentText.includes('/hr')
    };

    // 4. Pesticide Exchange View
    console.log('\n--- 4. Testing Live /app/pesticide-exchange ---');
    await page.goto(`${LIVE_URL}/app/pesticide-exchange`, { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise(r => setTimeout(r, 1500));

    const pesticideShot = path.join(ARTIFACT_DIR, 'phase6_live_production_pesticide_exchange.png');
    await page.screenshot({ path: pesticideShot });
    console.log('Saved live pesticide exchange screenshot:', pesticideShot);

    const pesticideText = await page.evaluate(() => document.body.innerText);
    auditReport.pages.pesticideExchange = {
      hasTitle: pesticideText.includes('Agrochemical & Bio-Input Safety Exchange'),
      hasSuperNova: pesticideText.includes('Super Nova'),
      hasSafetyStandard: pesticideText.includes('Agronomic Safety Standard')
    };

    // 5. Labour Coordinator View
    console.log('\n--- 5. Testing Live /app/labour ---');
    await page.goto(`${LIVE_URL}/app/labour`, { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise(r => setTimeout(r, 1500));

    const labourShot = path.join(ARTIFACT_DIR, 'phase6_live_production_labour.png');
    await page.screenshot({ path: labourShot });
    console.log('Saved live labour screenshot:', labourShot);

    const labourText = await page.evaluate(() => document.body.innerText);
    auditReport.pages.labour = {
      hasTitle: labourText.includes('Agricultural Labour & Harvesting Crews'),
      hasSquad: labourText.includes('Sahyadri Tomato & Grape Harvest Squad'),
      hasDailyWage: labourText.includes('/ worker / day')
    };

    // 6. Legal Advisor View
    console.log('\n--- 6. Testing Live /app/legal-advisor ---');
    await page.goto(`${LIVE_URL}/app/legal-advisor`, { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise(r => setTimeout(r, 1500));

    const legalShot = path.join(ARTIFACT_DIR, 'phase6_live_production_legal_advisor.png');
    await page.screenshot({ path: legalShot });
    console.log('Saved live legal advisor screenshot:', legalShot);

    const legalText = await page.evaluate(() => document.body.innerText);
    auditReport.pages.legal = {
      hasTitle: legalText.includes('Legal & MSP Contract Protector'),
      hasT3Mandate: legalText.includes('T+3 Payment Mandate') || legalText.includes('T+3'),
      hasZeroLandAttachment: legalText.includes('Zero Land Attachment')
    };

    // 7. Cold Storage Split Map View (/app/infra)
    console.log('\n--- 7. Testing Live /app/infra ---');
    await page.goto(`${LIVE_URL}/app/infra`, { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise(r => setTimeout(r, 1500));

    const infraShot = path.join(ARTIFACT_DIR, 'phase6_live_production_cold_storage.png');
    await page.screenshot({ path: infraShot });
    console.log('Saved live cold storage screenshot:', infraShot);

    const infraData = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasTitle: text.includes('Logistics, Cold Storage & Transport Network'),
        hasShriKrishna: text.includes('Shri Krishna Cold Storage'),
        hasPioneer: text.includes('Pioneer Agro Cooling'),
        hasLeaflet: !!document.querySelector('.leaflet-container')
      };
    });
    auditReport.pages.infra = infraData;

    // 8. Farmer Profile View (/app/profile)
    console.log('\n--- 8. Testing Live /app/profile ---');
    await page.goto(`${LIVE_URL}/app/profile`, { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise(r => setTimeout(r, 1500));

    const profileShot = path.join(ARTIFACT_DIR, 'phase6_live_production_profile.png');
    await page.screenshot({ path: profileShot });
    console.log('Saved live profile screenshot:', profileShot);

    const profileData = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasTrustBadge: text.includes('Trusted Farmer') || text.includes('100% Trust Index'),
        hasSmartFarmingServices: text.includes('SMART FARMING SERVICES'),
        hasPastelCards: text.includes('TOTAL BOOKINGS') && text.includes('NET PROFIT')
      };
    });
    auditReport.pages.profile = profileData;

    console.log('\n--- LIVE AUDIT COMPLETE ---');
    console.log(JSON.stringify(auditReport, null, 2));

    const reportFile = path.join(ARTIFACT_DIR, 'phase6_live_deployment_verification.json');
    fs.writeFileSync(reportFile, JSON.stringify(auditReport, null, 2));
    console.log('Audit results saved to:', reportFile);

  } catch (err) {
    console.error('Live audit error:', err);
  } finally {
    await browser.close();
  }
}

verifyLiveDeployment();

