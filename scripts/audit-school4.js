#!/usr/bin/env node
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
  
  // Get a focused screenshot of the canvas area
  const canvas = await page.$('canvas');
  if (canvas) {
    await canvas.screenshot({ path: '/root/.openclaw/workspace/school-audit-canvas.png', type: 'png' });
    console.log('Canvas screenshot saved');
    
    // Get pixel values at specific spots
    const pixelData = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      
      // Player should be at roughly center-x, lower third of canvas
      // Canvas is 200x140, player starts around row 17 (170px into world)
      // Camera follows player, so player should be centered
      
      const W = canvas.width, H = canvas.height;
      const centerX = Math.floor(W / 2);
      const playerY = Math.floor(H * 0.65); // lower third
      
      // Sample a 20x20 area around the expected player position
      const samples = [];
      for (let dy = -10; dy <= 10; dy += 2) {
        for (let dx = -10; dx <= 10; dx += 2) {
          const x = centerX + dx;
          const y = playerY + dy;
          if (x < 0 || x >= W || y < 0 || y >= H) continue;
          const d = ctx.getImageData(x, y, 1, 1).data;
          if (d[3] > 20) {
            samples.push({
              x, y,
              hex: '#' + [d[0],d[1],d[2]].map(v=>v.toString(16).padStart(2,'0')).join(''),
              rgb: [d[0],d[1],d[2]]
            });
          }
        }
      }
      
      // Also scan entire canvas for non-grass colors
      const allData = ctx.getImageData(0, 0, W, H).data;
      const distinctColors = new Map();
      for (let i = 0; i < allData.length; i += 4) {
        if (allData[i+3] < 30) continue;
        const r=allData[i], g=allData[i+1], b=allData[i+2];
        // skip grass
        if (r>=50&&r<=95&&g>=125&&g<=195&&b>=5&&b<=55) continue;
        // skip very dark
        if (r<15&&g<15&&b<15) continue;
        const hex = '#' + [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
        if (!distinctColors.has(hex)) distinctColors.set(hex, { hex, r, g, b, count: 0, positions: [] });
        const entry = distinctColors.get(hex);
        entry.count++;
        entry.positions.push({ x: (i/4)%W, y: Math.floor((i/4)/W) });
      }
      
      const sortedColors = Array.from(distinctColors.values()).sort((a,b)=>b.count-a.count).slice(0, 15);
      
      return { W, H, centerX, playerY, samples, sortedColors };
    });
    
    console.log('\nCanvas:', pixelData.W, 'x', pixelData.H);
    console.log('Sampling around (' + pixelData.centerX + ',' + pixelData.playerY + '):');
    pixelData.samples.forEach(s => console.log('  ' + s.hex + ' at (' + s.x + ',' + s.y + ')'));
    console.log('\nAll distinct non-grass colors:');
    pixelData.sortedColors.forEach(c => {
      const isYellow = c.r > 200 && c.g > 180 && c.b < 100;
      const isRed = c.r > 180 && c.g < 90 && c.b < 90;
      const isPeach = c.r > 190 && c.g > 140 && c.b > 100 && c.r < 250;
      const isDark = c.r < 50 && c.g < 50;
      console.log('  ' + c.hex + ' x' + c.count + (isYellow ? ' ← YELLOW' : isRed ? ' ← RED BODY' : isPeach ? ' ← PEACH' : isDark ? ' ← DARK' : ''));
    });
  }
  
  await browser.close();
}

main().catch(console.error);