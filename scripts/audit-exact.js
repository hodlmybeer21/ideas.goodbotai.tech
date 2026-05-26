#!/usr/bin/env node
// Targeted player sprite audit — find EXACTLY what color the head pixels are
const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  
  await page.goto('https://ideas.goodbotai.tech/school', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // Click Explore Campus
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text && text.includes('Explore')) { await btn.click(); break; }
  }
  await page.waitForTimeout(5000);
  
  // Inject a targeted pixel reporter into the page
  const report = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { error: 'no canvas' };
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    
    // The game canvas is 200x140 pixels. Player is drawn at (px - camX, py - camY).
    // With camera following player, player should be centered at roughly (100, 70) screen.
    // The player sprite is 10x10 tiles = 100x100 pixels in world space.
    // At scale 1, rendered as 10x10 pixels.
    // Player feet are at bottom of sprite (world y + 10 tiles). Head is at top (world y).
    
    // Scan the entire canvas and find pixels that are:
    // NOT grass green (r:50-95, g:125-195, b:5-55)
    // NOT dark shadow (r<20, g<20, b<20)
    // NOT building brown (r>80 && r<200 && g>50 && g<150 && b>15 && b<90)
    
    const allData = ctx.getImageData(0, 0, W, H).data;
    const interesting = [];
    
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const r = allData[i], g = allData[i+1], b = allData[i+2], a = allData[i+3];
        if (a < 30) continue;
        
        // Skip grass
        if (r >= 50 && r <= 95 && g >= 125 && g <= 195 && b >= 5 && b <= 55) continue;
        // Skip dark shadow
        if (r < 20 && g < 20 && b < 20) continue;
        // Skip building browns
        if (r > 80 && r < 200 && g > 50 && g < 150 && b > 15 && b < 90) continue;
        
        const hex = '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
        interesting.push({ x, y, r, g, b, hex });
      }
    }
    
    // Group by approximate color
    const byColor = {};
    interesting.forEach(p => {
      // Round to nearest 20 to group similar colors
      const rKey = Math.round(p.r / 20) * 20;
      const gKey = Math.round(p.g / 20) * 20;
      const bKey = Math.round(p.b / 20) * 20;
      const key = `${rKey},${gKey},${bKey}`;
      if (!byColor[key]) byColor[key] = { r: rKey, g: gKey, b: bKey, count: 0, samples: [] };
      byColor[key].count++;
      byColor[key].samples.push({ x: p.x, y: p.y, hex: p.hex });
    });
    
    const sorted = Object.values(byColor).sort((a, b) => b.count - a.count);
    
    // Find what region the player occupies (lower-center of screen)
    const playerRegion = interesting.filter(p => {
      return p.y > H * 0.4 && p.y < H * 0.9 && p.x > W * 0.2 && p.x < W * 0.8;
    });
    
    return {
      W, H,
      totalInteresting: interesting.length,
      playerRegionCount: playerRegion.length,
      topColors: sorted.slice(0, 20).map(c => ({
        color: `rgb(${c.r},${c.g},${c.b})`,
        hex: '#' + [c.r,c.g,c.b].map(v=>v.toString(16).padStart(2,'0')).join(''),
        count: c.count,
        sample: c.samples[0]
      })),
      playerSamples: playerRegion.slice(0, 20),
    };
  });
  
  console.log('Canvas:', report.W, 'x', report.H);
  console.log('Total non-background pixels:', report.totalInteresting);
  console.log('Player region pixels:', report.playerRegionCount);
  console.log('\nTop colors across canvas:');
  report.topColors.forEach(c => {
    const isYellow = c.color.includes('rgb(220') || c.color.includes('rgb(240') || c.color.includes('rgb(200');
    console.log(`  ${c.hex} (${c.color}) x${c.count} ${isYellow ? '← YELLOW?' : ''} sample:(${c.sample.x},${c.sample.y})`);
  });
  
  console.log('\nPlayer region samples:');
  report.playerSamples.forEach(p => console.log(`  (${p.x},${p.y}): ${p.hex} rgb(${p.r},${p.g},${p.b})`));
  
  await browser.close();
}

main().catch(console.error);