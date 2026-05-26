#!/usr/bin/env node
const { chromium } = require('playwright');

async function audit() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  
  await page.goto('https://ideas.goodbotai.tech/school', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text && text.includes('Explore')) { await btn.click(); break; }
  }
  await page.waitForTimeout(4000);
  
  const result = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { error: 'no canvas' };
    const ctx = canvas.getContext('2d');
    
    // Find ALL non-grass colors on the canvas (grass is around #48a0xx)
    const W = canvas.width, H = canvas.height;
    const allData = ctx.getImageData(0, 0, W, H).data;
    
    const nonGrass = [];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const r = allData[i], g = allData[i+1], b = allData[i+2], a = allData[i+3];
        if (a > 20) {
          // Skip grass greens
          const isGrass = (r >= 60 && r <= 90 && g >= 120 && g <= 180 && b >= 10 && b <= 50);
          const isDark = (r < 30 && g < 30 && b < 30); // shadow/outline
          if (!isGrass && !isDark) {
            const hex = '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
            nonGrass.push({ x, y, hex, r, g, b });
          }
        }
      }
    }
    
    // Group by color
    const colorCounts = {};
    nonGrass.forEach(p => {
      const key = p.hex;
      if (!colorCounts[key]) colorCounts[key] = { hex: key, count: 0, sampleX: p.x, sampleY: p.y };
      colorCounts[key].count++;
    });
    const sorted = Object.values(colorCounts).sort((a, b) => b.count - a.count);
    
    // Also find player pixels specifically (flesh tones + red + blue)
    const playerColors = sorted.filter(c => {
      const { r, g, b } = { r: parseInt(c.hex.slice(1,3),16), g: parseInt(c.hex.slice(3,5),16), b: parseInt(c.hex.slice(5,7),16) };
      const isPeach = r > 200 && g > 150 && g < 220 && b > 120 && b < 180; // skin
      const isRed = r > 180 && g < 80 && b < 80;
      const isBlue = b > 150 && r < 80 && g < 100;
      const isYellow = r > 200 && g > 180 && b < 100;
      return isPeach || isRed || isBlue || isYellow;
    });
    
    return {
      W, H,
      totalNonGrass: nonGrass.length,
      topColors: sorted.slice(0, 15),
      playerColors,
      playerDetected: playerColors.length > 0,
      allColorSummary: sorted.slice(0, 10).map(c => c.hex + ' x' + c.count).join(', '),
    };
  });
  
  console.log('Canvas:', result.W, 'x', result.H);
  console.log('Non-grass pixels:', result.totalNonGrass);
  console.log('Top colors:', result.allColorSummary);
  console.log('Player detected:', result.playerDetected ? '✅ YES' : '❌ NO');
  if (result.playerColors.length > 0) {
    console.log('Player colors found:', result.playerColors.map(c => c.hex + ' x' + c.count).join(', '));
  }
  
  await browser.close();
}

audit().catch(console.error);