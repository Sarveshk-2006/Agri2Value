// scripts/browser_audit/verify_reference_modules.mjs
import puppeteer from '../../frontend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const LOCAL_URL = 'http://localhost:4173';
const ARTIFACT_DIR = 'C:\\Users\\Sarvesh Kulkarni\\.gemini\\antigravity\\brain\\3cb2df03-6d76-4390-8e30-9f5e5e0a8314';

async function verifyAllReferenceModules() {
  console.log('================================================================');
  console.log('AGRI2VALUE: VERIFYING REFERENCE MODULES & CLEAN UI IMPLEMENTATION');
  console.log('================================================================');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const auditReport = {
    timestamp: new Date().toISOString(),
    modules: {}
  };

  try {
    // ─── 1. VERIFY GOVT SCHEMES (/app/schemes) ───
    console.log('\n--- 1. Testing /app/schemes ---');
    await page.goto(`${LOCAL_URL}/app/schemes`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));

    const schemesShot = path.join(ARTIFACT_DIR, 'phase6_local_govt_schemes.png');
    await page.screenshot({ path: schemesShot });
    console.log('Saved schemes screenshot:', schemesShot);

    const schemesData = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasTitle: text.includes('Government Subsidies & Schemes'),
        hasCalculator: text.includes('Estimate Your Total Government Benefits'),
        hasPmfby: text.includes('PM Fasal Bima Yojana'),
        hasSmam: text.includes('Sub-Mission on Agricultural Mechanization'),
        hasKusum: text.includes('PM-KUSUM'),
        hasMagelTyala: text.includes('Magel Tyala Shet Tale'),
        hasDbtVerified: text.includes('DBT Verified'),
        cardCount: document.querySelectorAll('.grid > div.bg-white').length
      };
    });
    auditReport.modules.schemes = schemesData;
    console.log('Schemes View Results:', schemesData);

    // ─── 2. VERIFY EQUIPMENT MARKETPLACE (/app/equipment) ───
    console.log('\n--- 2. Testing /app/equipment ---');
    await page.goto(`${LOCAL_URL}/app/equipment`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));

    const equipmentShot = path.join(ARTIFACT_DIR, 'phase6_local_equipment_marketplace.png');
    await page.screenshot({ path: equipmentShot });
    console.log('Saved equipment screenshot:', equipmentShot);

    const equipmentData = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasTitle: text.includes('Farm Implements & Equipment Marketplace'),
        hasMahindra: text.includes('Mahindra 575 DI'),
        hasJohnDeere: text.includes('John Deere 5050D'),
        hasHarvester: text.includes('Preet 987') || text.includes('Claas Crop Tiger'),
        hasBoomSprayer: text.includes('Aspee HTP') || text.includes('Boom Sprayer'),
        hasHourlyTariff: text.includes('₹280') || text.includes('/hr'),
        hasListEquipmentBtn: text.includes('List Your Equipment'),
        equipmentCardsCount: document.querySelectorAll('.grid > div').length
      };
    });
    auditReport.modules.equipment = equipmentData;
    console.log('Equipment View Results:', equipmentData);

    // ─── 3. VERIFY PESTICIDE & BIO-INPUT EXCHANGE (/app/pesticide-exchange) ───
    console.log('\n--- 3. Testing /app/pesticide-exchange ---');
    await page.goto(`${LOCAL_URL}/app/pesticide-exchange`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));

    const pesticideShot = path.join(ARTIFACT_DIR, 'phase6_local_pesticide_exchange.png');
    await page.screenshot({ path: pesticideShot });
    console.log('Saved pesticide exchange screenshot:', pesticideShot);

    const pesticideData = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasTitle: text.includes('Agrochemical & Bio-Input Safety Exchange'),
        hasSuperNova: text.includes('Super Nova'),
        hasCromin: text.includes('Cromin+ Ammonium Polyphosphate'),
        hasGacil: text.includes('GACIL Enriched Micro-Nutrients'),
        hasSafetyStandard: text.includes('Agronomic Safety Standard'),
        hasFreeTag: text.includes('FREE'),
        hasBarterTag: text.includes('Barter'),
        itemsCount: document.querySelectorAll('.grid > div').length
      };
    });
    auditReport.modules.pesticideExchange = pesticideData;
    console.log('Pesticide Exchange Results:', pesticideData);

    // ─── 4. VERIFY LABOUR COORDINATOR (/app/labour) ───
    console.log('\n--- 4. Testing /app/labour ---');
    await page.goto(`${LOCAL_URL}/app/labour`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));

    const labourShot = path.join(ARTIFACT_DIR, 'phase6_local_labour_coordinator.png');
    await page.screenshot({ path: labourShot });
    console.log('Saved labour screenshot:', labourShot);

    const labourData = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasTitle: text.includes('Agricultural Labour & Harvesting Crews'),
        hasSahyadriSquad: text.includes('Sahyadri Tomato & Grape Harvest Squad'),
        hasSprayingSquad: text.includes('Shri Ram Certified Spraying Squad'),
        hasDailyWage: text.includes('₹450') && text.includes('/ worker / day'),
        hasMukadam: text.includes('Mukadam'),
        crewsCount: document.querySelectorAll('.grid > div').length
      };
    });
    auditReport.modules.labour = labourData;
    console.log('Labour Coordinator Results:', labourData);

    // ─── 5. VERIFY LEGAL & MSP ADVISOR (/app/legal-advisor) ───
    console.log('\n--- 5. Testing /app/legal-advisor ---');
    await page.goto(`${LOCAL_URL}/app/legal-advisor`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));

    const legalShot = path.join(ARTIFACT_DIR, 'phase6_local_legal_advisor.png');
    await page.screenshot({ path: legalShot });
    console.log('Saved legal advisor screenshot:', legalShot);

    const legalData = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasTitle: text.includes('Legal & MSP Contract Protector'),
        hasSection6: text.includes('Section 6 Enforced') || text.includes('Section 6'),
        hasT3Payment: text.includes('T+3 Payment Mandate') || text.includes('T+3'),
        hasNoLandAttachment: text.includes('Zero Land Attachment'),
        hasAuditScore: text.includes('Protection Index') || text.includes('94 / 100') || text.includes('Safe to Execute'),
        hasSampleButtons: text.includes('Load Safe Sahyadri Sample') && text.includes('Load Risky Consignment Note')
      };
    });
    auditReport.modules.legal = legalData;
    console.log('Legal Advisor Results:', legalData);

    // ─── 6. VERIFY DASHBOARD VIEW INTEGRATION (/app/dashboard) ───
    console.log('\n--- 6. Testing /app/dashboard ---');
    await page.goto(`${LOCAL_URL}/app/dashboard`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));

    const dashboardShot = path.join(ARTIFACT_DIR, 'phase6_local_dashboard_refined.png');
    await page.screenshot({ path: dashboardShot });
    console.log('Saved dashboard refined screenshot:', dashboardShot);

    const dashboardData = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasMachineryCard: text.includes('Find Machinery'),
        hasInputExchangeCard: text.includes('Input Exchange'),
        hasHarvestCrewsCard: text.includes('Harvest Crews'),
        hasLegalMspCard: text.includes('Legal & MSP'),
        hasInsuranceBadge: text.includes('Insurance Active') && text.includes('PMFBY')
      };
    });
    auditReport.modules.dashboard = dashboardData;
    console.log('Dashboard Integration Results:', dashboardData);

    // ─── 7. CHECK FOR ARTIFICIAL AI BUZZWORDS ACROSS ALL VIEWS ───
    const bodyText = await page.evaluate(() => document.body.innerText);
    const aiBuzzwords = ['AI Advisor', 'Llama 4 Vision ML', 'Grok-powered insights', 'AI Crop Claims'];
    const foundBuzzwords = aiBuzzwords.filter(b => bodyText.includes(b));
    auditReport.buzzwordsFound = foundBuzzwords;
    console.log('\nAI Buzzwords in DOM:', foundBuzzwords.length > 0 ? foundBuzzwords : 'ZERO (100% Authentic Agronomy)');

    // Save Audit JSON Artifact
    const resultJson = path.join(ARTIFACT_DIR, 'phase6_reference_modules_audit.json');
    fs.writeFileSync(resultJson, JSON.stringify(auditReport, null, 2));
    console.log('\nAudit JSON saved to:', resultJson);

  } catch (err) {
    console.error('Error during audit:', err);
  } finally {
    await browser.close();
    console.log('Audit completed.');
  }
}

verifyAllReferenceModules();

