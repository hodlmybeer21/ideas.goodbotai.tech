#!/usr/bin/env node
// School Game Deep Audit — find exact player pixels
const { chromium } = require('playwright');

async function audit() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  
  await page.goto('https://ideas.goodbotai.tech/school', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // Click Explore Campus
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text && text.includes('Explore')) { await btn.click(); break; }
  }
  // Wait for game to load
  await page.waitForTimeout(5000);
  
  const result = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { error: 'no canvas' };
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    
    // Scan ENTIRE canvas for non-grass, non-shadow colors
    // Group by distinctive color bands
    const colorBins = {
      yellowHead: [],  // r>200, g>180, b<100
      redBody: [],     // r>180, g<80, b<80
      blueLegs: [],    // r<80, g<80, b>150
      peachSkin: [],   // r>200, g>150, b>120
      darkEye: [],     // r<40, g<30, b<40
      white: [],       // r>200, g>200, b>200
    };
    
    const allData = ctx.getImageData(0, 0, W, H).data;
    
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const r = allData[i], g = allData[i+1], b = allData[i+2], a = allData[i+3];
        if (a < 30) continue;
        
        // Skip grass (the dominant background)
        if (r >= 50 && r <= 90 && g >= 130 && g <= 190 && b >= 10 && b <= 50) continue;
        // Skip dark shadow
        if (r < 20 && g < 20 && b < 20) continue;
        
        if (r > 200 && g > 180 && b < 100) colorBins.yellowHead.push({ x, y, hex: '#' + [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('') });
        else if (r > 180 && g < 80 && b < 80) colorBins.redBody.push({ x, y, hex: '#' + [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('') });
        else if (r < 80 && g < 80 && b > 150) colorBins.blueLegs.push({ x, y, hex: '#' + [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('') });
        else if (r > 200 && g > 150 && b > 120) colorBins.peachSkin.push({ x, y, hex: '#' + [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('') });
        else if (r < 50 && g < 40 && b < 60) colorBins.darkEye.push({ x, y, hex: '#' + [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('') });
        else if (r > 200 && g > 200 && b > 200) colorBins.white.push({ x, y, hex: '#' + [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('') });
      }
    }
    
    // Find the actual player position (should be around bottom-center of canvas in exterior)
    // Player should be near horizontal center, bottom third of screen
    const allPlayerPixels = [
      ...colorBins.yellowHead,
      ...colorBins.redBody,
      ...colorBins.blueLegs,
      ...colorBins.peachSkin,
    ];
    
    // Find bounding box of player-colored pixels
    let minX = W, minY = H, maxX = 0, maxY = 0;
    allPlayerPixels.forEach(p => {
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    });
    
    // Also check for the one-eye bug: dark pixels in head region
    const eyePixels = colorBins.darkEye.filter(p => {
      // Eyes should be in top portion of player
      const playerCenterY = (minY + maxY) / 2;
      const headBottom = minY + (maxY - minY) * 0.35;
      return p.y < headBottom && p.y > minY;
    });
    
    // Check if dark pixels form 1 cluster (one eye) or 2 clusters (two eyes)
    const darkPixelPositions = eyePixels.map(p => ({ x: p.x, y: p.y }));
    
    return {
      W, H,
      yellowHead: { count: colorBins.yellowHead.length, samples: colorBins.yellowHead.slice(0,3) },
      redBody: { count: colorBins.redBody.length, samples: colorBins.redBody.slice(0,3) },
      blueLegs: { count: colorBins.blueLegs.length, samples: colorBins.blueLegs.slice(0,3) },
      peachSkin: { count: colorBins.peachSkin.length, samples: colorBins.peachSkin.slice(0,3) },
      darkEye: { count: colorBins.darkEye.length, positions: darkPixelPositions.slice(0,6) },
      white: { count: colorBins.white.length, samples: colorBins.white.slice(0,3) },
      playerBounds: allPlayerPixels.length > 0 ? { minX, minY, maxX, maxY, w: maxX-minX, h: maxY-minY } : null,
      eyeCount: eyePixels.length,
      hasOneEyeBug: eyePixels.length > 0 && eyePixels.length < 10,
    };
  });
  
  console.log('=== SCHOOL GAME AUDIT ===\n');
  console.log('Canvas:', result.W, 'x', result.H);
  console.log('');
  console.log('Color pixel counts:');
  console.log('  Yellow head pixels:', result.yellowHead.count, result.yellowHead.samples.map(p=>p.hex).join(', '));
  console.log('  Red body pixels:', result.redBody.count, result.redBody.samples.map(p=>p.hex).join(', '));
  console.log('  Blue legs pixels:', result.blueLegs.count, result.blueLegs.samples.map(p=>p.hex).join(', '));
  console.log('  Peach skin pixels:', result.peachSkin.count, result.peachSkin.samples.map(p=>p.hex).join(', '));
  console.log('  Dark eye pixels:', result.darkEye.count, result.darkEye.positions.map(p=>`(${p.x},${p.y})`).join(', '));
  console.log('  White pixels:', result.white.count, result.white.samples.map(p=>p.hex).join(', '));
  console.log('');
  if (result.playerBounds) {
    console.log('Player bounding box:', JSON.stringify(result.playerBounds));
  } else {
    console.log('Player bounding box: NOT FOUND');
  }
  console.log('');
  if (result.hasOneEyeBug) {
    console.log('🐛 ONE-EYE BUG DETECTED: Only', result.eyeCount, 'dark eye pixels found');
  } else if (result.darkEye.count >= 10) {
    console.log('✅ Multiple dark eye pixels found (likely 2-eyed sprite)');
  } else {
    console.log('⚠️  No dark eye pixels found in player area');
  }
  
  await browser.close();
}

audit().catch(console.error);