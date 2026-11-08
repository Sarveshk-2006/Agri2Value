import puppeteer from '../../frontend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROD_URL = 'https://agri2value.vercel.app';

(async () => {
  console.log('--- TESTING WHEEL & SCROLL INTERACTIONS ON ' + PROD_URL + ' ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const passiveErrors = [];
  const allErrors = [];

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('preventDefault') || text.includes('passive')) {
      passiveErrors.push(text);
      console.log('Passive Error detected:', text);
    }
    if (msg.type() === 'error') {
      allErrors.push(text);
    }
  });

  page.on('pageerror', err => {
    allErrors.push(err.toString());
  });

  try {
    // 1. Visit Farms tab with 3D canvas
    console.log('1. Navigating to /app/farms ...');
    await page.goto(`${PROD_URL}/app/farms`, { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise(r => setTimeout(r, 3000));

    // Try wheeling on canvas 10 times
    console.log('Simulating mouse wheel scroll over 3D canvas...');
    const canvas = await page.$('canvas');
    if (canvas) {
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        for (let i = 0; i < 10; i++) {
          await page.mouse.wheel({ deltaY: 50 });
          await new Promise(r => setTimeout(r, 50));
        }
      }
    }

    // 2. Visit Dashboard
    console.log('2. Navigating to /app/dashboard ...');
    await page.goto(`${PROD_URL}/app/dashboard`, { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise(r => setTimeout(r, 2000));

    // Scroll up and down on Dashboard
    console.log('Simulating page scroll on Dashboard...');
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel({ deltaY: 100 });
      await new Promise(r => setTimeout(r, 50));
    }
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel({ deltaY: -100 });
      await new Promise(r => setTimeout(r, 50));
    }

    console.log('\n--- RESULTS ---');
    console.log(`Passive preventDefault errors: ${passiveErrors.length}`);
    console.log(`Total errors: ${allErrors.length}`);

    if (passiveErrors.length === 0 && allErrors.length === 0) {
      console.log('✅ ZERO PASSIVE PREVENTDEFAULT ERRORS! ALL SCROLL & WHEEL GESTURES ARE 100% CLEAN!');
    } else {
      console.log('❌ Remaining errors:', allErrors);
    }
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
})();
