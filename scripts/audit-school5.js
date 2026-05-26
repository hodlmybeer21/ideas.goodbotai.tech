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
  
  const result = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { error: 'no canvas' };
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    
    // Find ALL non-grass, non-shadow, non-white background pixels
    // and map them to screen coordinates
    const allData = ctx.getImageData(0, 0, W, H).data;
    
    // Color classification thresholds
    const classify = (r, g, b) => {
      const isGrass = r >= 50 && r <= 95 && g >= 125 && g <= 195 && b >= 5 && b <= 55;
      const isDarkShadow = r < 20 && g < 20 && b < 20;
      const isWhite = r > 220 && g > 220 && b > 220;
      const isPeach = r > 190 && g > 140 && g < 230 && b > 100 && b < 190;
      const isYellow = r > 200 && g > 180 && b < 100;
      const isRed = r > 180 && g < 90 && b < 90;
      const isBlue = b > 140 && r < 80 && g < 100;
      const isBrown = r >= 90 && r <= 200 && g >= 60 && g <= 140 && b >= 20 && b <= 80;
      const isBuilding = r >= 80 && r <= 160 && g >= 60 && g <= 120 && b >= 20 && b <= 100;
      
      if (isGrass || isDarkShadow) return 'ignore';
      if (isWhite) return 'white';
      if (isPeach) return 'peach';
      if (isYellow) return 'yellow';
      if (isRed) return 'red';
      if (isBlue) return 'blue';
      if (isBrown || isBuilding) return 'building';
      return 'other';
    };
    
    const regions = { player: [], npc: [], building: [], white: [], other: [] };
    
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const r = allData[i], g = allData[i+1], b = allData[i+2], a = allData[i+3];
        if (a < 30) continue;
        
        const cat = classify(r, g, b);
        if (cat === 'ignore') continue;
        
        const entry = { x, y, hex: '#' + [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('') };
        
        if (cat === 'peach' || cat === 'yellow' || cat === 'red' || cat === 'blue') {
          regions.player.push(entry);
        } else if (cat === 'white') {
          regions.white.push(entry);
        } else if (cat === 'building') {
          regions.building.push(entry);
        } else {
          regions.other.push(entry);
        }
      }
    }
    
    // Find bounding boxes
    const bbox = (arr) => {
      if (arr.length === 0) return null;
      let minX = 999, minY = 999, maxX = -1, maxY = -1;
      arr.forEach(p => {
        minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
      });
      return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
    };
    
    const playerBox = bbox(regions.player);
    
    return {
      W, H,
      playerPixelCount: regions.player.length,
      whitePixelCount: regions.white.length,
      buildingPixelCount: regions.building.length,
      otherPixelCount: regions.other.length,
      playerBbox: playerBox,
      playerSamples: regions.player.slice(0, 5),
      whiteBbox: bbox(regions.white),
      playerColors: [...new Set(regions.player.map(p=>p.hex))].slice(0, 10),
      whiteColors: [...new Set(regions.white.map(p=>p.hex))].slice(0, 5),
    };
  });
  
  console.log('=== FULL CANVAS AUDIT ===');
  console.log('Canvas:', result.W, 'x', result.H);
  console.log('');
  console.log('Pixel counts:');
  console.log('  Player-colored pixels:', result.playerPixelCount);
  console.log('  White pixels:', result.whitePixelCount);
  console.log('  Building pixels:', result.buildingPixelCount);
  console.log('  Other pixels:', result.otherPixelCount);
  console.log('');
  console.log('Player bounding box:', JSON.stringify(result.playerBbox));
  console.log('Player colors:', result.playerColors.join(', '));
  console.log('White bounding box:', JSON.stringify(result.whiteBbox));
  console.log('White colors:', result.whiteColors.join(', '));
  console.log('');
  console.log('Player samples:', result.playerSamples.map(p=>`(${p.x},${p.y}):${p.hex}`).join(', '));
  
  // Now check: is the player's bounding box actually the PLAYER or scattered building parts?
  if (result.playerBbox) {
    const box = result.playerBbox;
    console.log('\nPlayer area aspect ratio:', (box.w / box.h).toFixed(2), '(expected ~0.5-2 for a character)');
    console.log('Player area width:', box.w, 'height:', box.h);
  }
  
  await browser.close();
}

main().catch(console.error);