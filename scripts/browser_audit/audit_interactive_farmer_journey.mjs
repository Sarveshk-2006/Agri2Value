import puppeteer from '../../frontend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'https://agri2value.vercel.app';
const ARTIFACT_DIR = 'C:\\Users\\Sarvesh Kulkarni\\.gemini\\antigravity\\brain\\3cb2df03-6d76-4390-8e30-9f5e5e0a8314';

async function runInteractiveJourney() {
  console.log('================================================================');
  console.log('AGRI2VALUE PHASE 6: INTERACTIVE FARMER JOURNEY & MODAL VALIDATION');
  console.log('================================================================');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Enter Farmer Dashboard
  console.log('\n--- 1. Loading Dashboard ---');
  await page.goto(`${TARGET_URL}/app/dashboard`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));

  // 2. Open Add Farm Modal
  console.log('\n--- 2. Testing Add Farm Holding Modal ---');
  await page.goto(`${TARGET_URL}/app/farms`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));

  const addFarmClicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes('Add New Farm') || b.textContent.includes('Register New Farm') || b.textContent.includes('New Land Holding'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Add Farm button:', addFarmClicked);
  await new Promise(r => setTimeout(r, 800));

  const modalShot = path.join(ARTIFACT_DIR, 'phase6_live_modal_add_farm.png');
  await page.screenshot({ path: modalShot });

  const farmModalAudit = await page.evaluate(() => {
    const modal = document.querySelector('.fixed.inset-0.z-50');
    if (!modal) return { open: false };
    const inputs = Array.from(modal.querySelectorAll('input, select, textarea')).map(el => ({
      tag: el.tagName,
      type: el.getAttribute('type'),
      name: el.getAttribute('name'),
      placeholder: el.getAttribute('placeholder')
    }));
    return {
      open: true,
      inputCount: inputs.length,
      title: modal.querySelector('h3')?.textContent?.trim() || '',
      inputs
    };
  });
  console.log('Farm Modal Audit:', JSON.stringify(farmModalAudit, null, 2));

  // Close Add Farm Modal
  await page.evaluate(() => {
    const close = document.querySelector('.fixed.inset-0.z-50 button');
    if (close) close.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // 3. Open Add Harvest Lot Modal
  console.log('\n--- 3. Testing Register Harvest Lot Modal ---');
  await page.goto(`${TARGET_URL}/app/lots`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));

  const addLotClicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes('Register') || b.textContent.includes('New Lot') || b.textContent.includes('Add Lot'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Register Lot button:', addLotClicked);
  await new Promise(r => setTimeout(r, 800));

  const lotModalShot = path.join(ARTIFACT_DIR, 'phase6_live_modal_add_lot.png');
  await page.screenshot({ path: lotModalShot });

  const lotModalAudit = await page.evaluate(() => {
    const modal = document.querySelector('.fixed.inset-0.z-50');
    if (!modal) return { open: false };
    const inputs = Array.from(modal.querySelectorAll('input, select, textarea')).map(el => ({
      tag: el.tagName,
      type: el.getAttribute('type'),
      placeholder: el.getAttribute('placeholder')
    }));
    return {
      open: true,
      title: modal.querySelector('h3')?.textContent?.trim() || '',
      inputCount: inputs.length,
      inputs
    };
  });
  console.log('Lot Modal Audit:', JSON.stringify(lotModalAudit, null, 2));

  // Close Lot Modal
  await page.evaluate(() => {
    const close = document.querySelector('.fixed.inset-0.z-50 button');
    if (close) close.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // 4. Test Profit Decision Engine Interactions
  console.log('\n--- 4. Testing Profit Decision Engine Interactions ---');
  await page.goto(`${TARGET_URL}/app/decision`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));

  const decisionAudit = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.rounded-2xl, .rounded-xl, [class*="card"]'));
    const pathwayCards = cards.filter(c => 
      c.textContent.includes('₹') && (c.textContent.includes('Net') || c.textContent.includes('Payout') || c.textContent.includes('/ kg'))
    );
    const presets = Array.from(document.querySelectorAll('button')).filter(b => 
      b.textContent.includes('Optimal') || b.textContent.includes('Distress') || b.textContent.includes('Monsoon') || b.textContent.includes('Bumper')
    ).map(b => b.textContent.trim());

    return {
      pathwayCount: pathwayCards.length,
      presetsFound: presets,
      samplePathway: pathwayCards[0] ? pathwayCards[0].textContent.slice(0, 150).replace(/\s+/g, ' ') : null
    };
  });
  console.log('Decision Engine Audit:', JSON.stringify(decisionAudit, null, 2));

  // 5. Test Protection Agreement & Dispute Modal
  console.log('\n--- 5. Testing Protection Agreement & Modals ---');
  await page.goto(`${TARGET_URL}/app/protection`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));

  // Click "Raise Dispute"
  const disputeClicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Raise Dispute'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Raise Dispute button:', disputeClicked);
  await new Promise(r => setTimeout(r, 800));

  const disputeShot = path.join(ARTIFACT_DIR, 'phase6_live_modal_dispute.png');
  await page.screenshot({ path: disputeShot });

  const disputeAudit = await page.evaluate(() => {
    const modal = document.querySelector('.fixed.inset-0.z-50');
    return modal ? { open: true, title: modal.querySelector('h3')?.textContent?.trim() || '' } : { open: false };
  });

  // Close Dispute Modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.fixed.inset-0.z-50 button');
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Click "Record Payment" to verify Simulated Disclaimer
  const paymentClicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Record Payment'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Record Payment button:', paymentClicked);
  await new Promise(r => setTimeout(r, 800));

  const paymentShot = path.join(ARTIFACT_DIR, 'phase6_live_modal_payment.png');
  await page.screenshot({ path: paymentShot });

  const paymentDisclaimerCheck = await page.evaluate(() => {
    const modal = document.querySelector('.fixed.inset-0.z-50');
    if (!modal) return { modalFound: false };
    const text = modal.textContent;
    const hasDisclaimer = text.includes('simulated') || text.includes('Simulated') || text.includes('Demo Mode note');
    return {
      modalFound: true,
      hasDisclaimer,
      title: modal.querySelector('h3')?.textContent?.trim() || '',
      snippet: text.slice(0, 200).replace(/\s+/g, ' ')
    };
  });
  console.log('Payment Modal Disclaimer Audit:', JSON.stringify(paymentDisclaimerCheck, null, 2));

  await browser.close();

  const journeyResults = {
    addFarmModal: farmModalAudit,
    decisionAudit,
    paymentDisclaimerCheck,
    screenshots: {
      modalFarm: modalShot,
      modalLot: lotModalShot,
      modalDispute: disputeShot,
      modalPayment: paymentShot
    }
  };

  const outFile = path.join(ARTIFACT_DIR, 'phase6_live_interactive_journey_audit.json');
  fs.writeFileSync(outFile, JSON.stringify(journeyResults, null, 2));
  console.log(`\nInteractive audit completed. Results saved to ${outFile}`);
}

runInteractiveJourney().catch(err => {
  console.error('Fatal in runInteractiveJourney:', err);
  process.exit(1);
});
