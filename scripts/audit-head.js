#!/usr/bin/env node
// Find exactly where the head pixels are and what color they should be
const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  
  await page.goto('https://ideas.goodbotai.tech/school', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text && text.includes('Explore')) { await btn.click(); break; }
  }
  await page.waitForTimeout(5000);
  
  // Dump all non-background, non-building pixels in the LOWER HALF of the canvas
  // (that's where the player character is)
  const report = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { error: 'no canvas' };
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    
    const allData = ctx.getImageData(0, 0, W, H).data;
    
    // Focus on rows 30-90 (the building area where player walks)
    // Find pixels that look like a person: peach skin, yellow, red body, blue legs
    const results = [];
    
    for (let y = 30; y < 95; y++) {
      for (let x = 40; x < 160; x++) {
        const i = (y * W + x) * 4;
        const r = allData[i], g = allData[i+1], b = allData[i+2], a = allData[i+3];
        if (a < 30) continue;
        
        // Skip grass
        if (r >= 48 && r <= 98 && g >= 122 && g <= 198 && b >= 5 && b <= 58) continue;
        // Skip dark shadow
        if (r < 18 && g < 18 && b < 18) continue;
        // Skip building browns
        if (r >= 70 && r <= 210 && g >= 50 && g <= 155 && b >= 10 && b <= 100) continue;
        // Skip path colors
        if (r >= 160 && r <= 220 && g >= 130 && g <= 190 && b >= 60 && b <= 130) continue;
        
        const hex = '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
        results.push({ x, y, r, g, b, hex });
      }
    }
    
    // Group by hex
    const hexMap = {};
    results.forEach(p => {
      if (!hexMap[p.hex]) hexMap[p.hex] = { ...p, count: 0, positions: [] };
      hexMap[p.hex].count++;
      hexMap[p.hex].positions.push({ x: p.x, y: p.y });
    });
    
    const sorted = Object.values(hexMap).sort((a, b) => b.count - a.count);
    
    return {
      W, H,
      count: results.length,
      topColors: sorted.slice(0, 25).map(c => ({
        hex: c.hex,
        rgb: `rgb(${c.r},${c.g},${c.b})`,
        count: c.count,
        positions: c.positions.slice(0, 5)
      }))
    };
  });
  
  console.log('Scanning rows 30-95, cols 40-160\n');
  console.log('Total relevant pixels found:', report.count);
  console.log('\nColor breakdown:');
  report.topColors.forEach(c => {
    const { r, g, b } = { 
      r: parseInt(c.hex.slice(1,3), 16), 
      g: parseInt(c.hex.slice(3,5), 16), 
      b: parseInt(c.hex.slice(5,7), 16) 
    };
    
    let label = '';
    if (r > 220 && g > 190 && b < 80) label = '← YELLOW HAIR/HEAD';
    else if (r > 180 && g < 90 && b < 90) label = '← RED BODY';
    else if (r < 80 && g < 80 && b > 150) label = '← BLUE LEGS';
    else if (r > 190 && g > 140 && b > 110 && r < 250) label = '← PEACH SKIN';
    else if (r < 50 && g < 50 && b < 80) label = '← DARK (eye/outline)';
    
    console.log(`  ${c.hex} ${c.rgb} x${c.count} ${label}`);
    c.positions.forEach(p => process.stdout.write(`    (${p.x},${p.y}) `));
    console.log('');
  });
  
  await browser.close();
}

main().catch(console.error);