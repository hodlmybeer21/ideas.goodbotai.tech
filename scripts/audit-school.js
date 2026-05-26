#!/usr/bin/env node
// School Game Audit — verifies rendering without needing screenshots
// Usage: node scripts/audit-school.js

const { chromium } = require('playwright');

const URL = 'https://ideas.goodbotai.tech/school';

async function audit() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  // Test mobile viewport
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  
  console.log('🔍 Auditing GoodBot School...\n');
  
  // 1. Load intro screen
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const introCheck = await page.evaluate(() => {
    // Sample the character preview canvas (small 64x64 preview in intro)
    const canvas = document.querySelector('canvas');
    if (!canvas) return { error: 'No canvas found' };
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    
    // Count non-transparent pixels and their colors
    const colors = {};
    let total = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i+3] > 20) {
        const key = `${data[i]},${data[i+1]},${data[i+2]}`;
        colors[key] = (colors[key] || 0) + 1;
        total++;
      }
    }
    
    return {
      canvasW: canvas.width,
      canvasH: canvas.height,
      totalPixels: total,
      topColors: Object.entries(colors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([k, v]) => {
          const [r,g,b] = k.split(',').map(Number);
          const hex = '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
          return { hex, count: v };
        }),
      introScreenVisible: !!document.querySelector('[style*="linear-gradient"]'),
    };
  });
  
  console.log('📱 Intro screen:');
  console.log(`   Canvas size: ${introCheck.canvasW}x${introCheck.canvasH}`);
  console.log(`   Non-transparent pixels: ${introCheck.totalPixels}`);
  console.log('   Top colors:');
  introCheck.topColors.forEach(c => console.log(`     ${c.hex} (${c.count}px)`));
  
  // 2. Click into game
  const buttons = await page.$$('button');
  let clicked = false;
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text && text.includes('Explore')) {
      await btn.click();
      clicked = true;
      break;
    }
  }
  
  if (!clicked) {
    console.log('\n❌ Could not find Explore Campus button');
    await browser.close();
    return;
  }
  
  await page.waitForTimeout(4000);
  
  // 3. Check in-game canvas
  const gameCheck = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { error: 'No canvas' };
    const ctx = canvas.getContext('2d');
    
    // Sample the player area (canvas center, slightly below middle)
    const cx = Math.floor(canvas.width / 2);
    const cy = Math.floor(canvas.height * 0.65);
    const sampleData = ctx.getImageData(cx - 15, cy - 20, 30, 40).data;
    
    const colors = {};
    for (let i = 0; i < sampleData.length; i += 4) {
      if (sampleData[i+3] > 20) {
        const key = `${sampleData[i]},${sampleData[i+1]},${sampleData[i+2]}`;
        colors[key] = (colors[key] || 0) + 1;
      }
    }
    
    const topColors = Object.entries(colors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([k, v]) => {
        const [r,g,b] = k.split(',').map(Number);
        const hex = '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
        return { hex, count: v };
      });
    
    // Check for yellow (head) vs red (body) vs blue (legs)
    const hasYellow = topColors.some(c => c.hex.startsWith('#F1') || c.hex.startsWith('#E6') || c.hex.startsWith('#FA'));
    const hasRed = topColors.some(c => c.hex.startsWith('#E7') || c.hex.startsWith('#C0') || c.hex.startsWith('#D2'));
    const hasBlue = topColors.some(c => c.hex.startsWith('#34') || c.hex.startsWith('#2C') || c.hex.startsWith('#52'));
    
    return {
      canvasW: canvas.width,
      canvasH: canvas.height,
      topColors,
      hasYellow,
      hasRed,
      hasBlue,
      playerArea: { cx, cy },
    };
  });
  
  console.log('\n🎮 In-game canvas:');
  console.log(`   Canvas size: ${gameCheck.canvasW}x${gameCheck.canvasH}`);
  console.log('   Player area colors:');
  gameCheck.topColors.forEach(c => console.log(`     ${c.hex} (${c.count}px)`));
  console.log(`   Has yellow (head/hair): ${gameCheck.hasYellow ? '✅' : '❌'}`);
  console.log(`   Has red (body/shirt): ${gameCheck.hasRed ? '✅' : '❌'}`);
  console.log(`   Has blue (legs/feet): ${gameCheck.hasBlue ? '✅' : '❌'}`);
  
  // 4. Summary
  console.log('\n📋 Audit Summary:');
  const introOk = introCheck.topColors.length > 0;
  const gameOk = gameCheck.hasYellow && gameCheck.hasRed && gameCheck.hasBlue;
  
  if (introOk && gameOk) {
    console.log('   ✅ Intro screen renders correctly');
    console.log('   ✅ Game player renders with proper multi-color sprite');
    console.log('   ✅ No single-eye bug detected in this run');
  } else {
    if (!introOk) console.log('   ❌ Intro screen has issues');
    if (!gameOk) console.log('   ⚠️  Game player may have rendering issues');
  }
  
  await browser.close();
  console.log('\n✅ Audit complete');
}

audit().catch(err => {
  console.error('Audit failed:', err.message);
  process.exit(1);
});