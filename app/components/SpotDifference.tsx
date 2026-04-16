'use client';

import { useState, useCallback, useRef } from 'react';
import RatingModal from './RatingModal';

const BELL = () => { try { const c = new (window.AudioContext||(window as any).webkitAudioContext)(); const o = c.createOscillator(); const g = c.createGain(); o.connect(g); g.connect(c.destination); o.type="sine"; o.frequency.value=880; g.gain.setValueAtTime(0.2,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.4); o.start(); o.stop(c.currentTime+0.4); } catch {} };
const WRONG = () => { try { const c = new (window.AudioContext||(window as any).webkitAudioContext)(); const o = c.createOscillator(); const g = c.createGain(); o.connect(g); g.connect(c.destination); o.type="sawtooth"; o.frequency.value=220; g.gain.setValueAtTime(0.1,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.3); o.start(); o.stop(c.currentTime+0.3); } catch {} };
const WIN = () => { try { const c = new (window.AudioContext||(window as any).webkitAudioContext)(); [523,659,784,1047].forEach((f,i)=>{ const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type="sine"; o.frequency.value=f; g.gain.setValueAtTime(0.15,c.currentTime+i*0.12); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.12+0.3); o.start(c.currentTime+i*0.12); o.stop(c.currentTime+i*0.12+0.3); }); } catch {} };

interface Zone { id:number; x:number; y:number; w:number; h:number; }
interface SceneDef { id:string; label:string; easy:Zone[]; medium:Zone[]; hard:Zone[]; }

const SCENES:SceneDef[] = [
  {id:"park",label:"🌳 Sunny Park",easy:[{id:1,x:8,y:5,w:14,h:15},{id:2,x:57,y:7,w:13,h:14},{id:3,x:74,y:56,w:14,h:18},{id:4,x:35,y:60,w:15,h:16},{id:5,x:15,y:68,w:12,h:14}],medium:[{id:1,x:8,y:5,w:14,h:15},{id:2,x:57,y:7,w:13,h:14},{id:3,x:74,y:56,w:14,h:18},{id:4,x:35,y:60,w:15,h:16},{id:5,x:15,y:68,w:12,h:14},{id:6,x:48,y:36,w:13,h:15}],hard:[{id:1,x:8,y:5,w:14,h:15},{id:2,x:57,y:7,w:13,h:14},{id:3,x:74,y:56,w:14,h:18},{id:4,x:35,y:60,w:15,h:16},{id:5,x:15,y:68,w:12,h:14},{id:6,x:48,y:36,w:13,h:15},{id:7,x:62,y:76,w:12,h:14}]},
  {id:"beach",label:"🏖️ Beach Day",easy:[{id:1,x:8,y:5,w:15,h:15},{id:2,x:68,y:16,w:15,h:18},{id:3,x:38,y:66,w:17,h:16},{id:4,x:58,y:70,w:13,h:15},{id:5,x:12,y:54,w:15,h:17}],medium:[{id:1,x:8,y:5,w:15,h:15},{id:2,x:68,y:16,w:15,h:18},{id:3,x:38,y:66,w:17,h:16},{id:4,x:58,y:70,w:13,h:15},{id:5,x:12,y:54,w:15,h:17},{id:6,x:44,y:24,w:13,h:15}],hard:[{id:1,x:8,y:5,w:15,h:15},{id:2,x:68,y:16,w:15,h:18},{id:3,x:38,y:66,w:17,h:16},{id:4,x:58,y:70,w:13,h:15},{id:5,x:12,y:54,w:15,h:17},{id:6,x:44,y:24,w:13,h:15},{id:7,x:26,y:80,w:11,h:12}]},
  {id:"farm",label:"🌾 Farm Yard",easy:[{id:1,x:8,y:4,w:15,h:15},{id:2,x:55,y:16,w:15,h:15},{id:3,x:74,y:58,w:15,h:18},{id:4,x:33,y:68,w:17,h:15},{id:5,x:18,y:74,w:13,h:15}],medium:[{id:1,x:8,y:4,w:15,h:15},{id:2,x:55,y:16,w:15,h:15},{id:3,x:74,y:58,w:15,h:18},{id:4,x:33,y:68,w:17,h:15},{id:5,x:18,y:74,w:13,h:15},{id:6,x:50,y:70,w:13,h:15}],hard:[{id:1,x:8,y:4,w:15,h:15},{id:2,x:55,y:16,w:15,h:15},{id:3,x:74,y:58,w:15,h:18},{id:4,x:33,y:68,w:17,h:15},{id:5,x:18,y:74,w:13,h:15},{id:6,x:50,y:70,w:13,h:15},{id:7,x:62,y:38,w:13,h:15}]},
  {id:"ocean",label:"🌊 Ocean World",easy:[{id:1,x:8,y:4,w:15,h:15},{id:2,x:57,y:10,w:15,h:15},{id:3,x:18,y:66,w:15,h:17},{id:4,x:50,y:70,w:15,h:15},{id:5,x:70,y:56,w:13,h:17}],medium:[{id:1,x:8,y:4,w:15,h:15},{id:2,x:57,y:10,w:15,h:15},{id:3,x:18,y:66,w:15,h:17},{id:4,x:50,y:70,w:15,h:15},{id:5,x:70,y:56,w:13,h:17},{id:6,x:34,y:76,w:11,h:13}],hard:[{id:1,x:8,y:4,w:15,h:15},{id:2,x:57,y:10,w:15,h:15},{id:3,x:18,y:66,w:15,h:17},{id:4,x:50,y:70,w:15,h:15},{id:5,x:70,y:56,w:13,h:17},{id:6,x:34,y:76,w:11,h:13},{id:7,x:72,y:78,w:11,h:12}]},
];

function ParkScene({found}:{found:number[]}){
  const F=(id:number)=>found.includes(id);
  return <svg viewBox="0 0 400 300" style={{width:"100%",height:"100%",display:"block"}}>
    <rect width="400" height="300" fill="#87CEEB"/>
    <circle cx="340" cy="50" r="28" fill="#FFD700"/><circle cx="340" cy="50" r="22" fill="#FFF176"/>
    <g fill="white" opacity=".9"><ellipse cx="80" cy="40" rx="30" ry="18"/><ellipse cx="100" cy="34" rx="22" ry="14"/><ellipse cx="60" cy="38" rx="20" ry="14"/><ellipse cx="260" cy="55" rx="25" ry="15"/><ellipse cx="280" cy="50" rx="20" ry="13"/></g>
    <rect y="220" width="400" height="80" fill="#4CAF50"/><ellipse cx="200" cy="220" rx="220" ry="18" fill="#388E3C"/>
    <ellipse cx="200" cy="280" rx="60" ry="20" fill="#D7CCC8"/><ellipse cx="200" cy="260" rx="40" ry="14" fill="#BCAAA4"/>
    <rect x="45" y="160" width="16" height="60" fill="#795548"/>
    <circle cx="53" cy="140" r="30" fill="#2E7D32"/><circle cx="38" cy="152" r="22" fill="#388E3C"/><circle cx="68" cy="150" r="22" fill="#388E3C"/>
    <rect x="305" y="155" width="14" height="65" fill="#6D4C41"/>
    <circle cx="312" cy="135" r="28" fill="#1B5E20"/><circle cx="298" cy="148" r="20" fill="#2E7D32"/><circle cx="326" cy="146" r="20" fill="#2E7D32"/>
    <rect x="160" y="240" width="80" height="8" fill="#8D6E63" rx="2"/><rect x="165" y="248" width="8" height="18" fill="#6D4C41"/><rect x="227" y="248" width="8" height="18" fill="#6D4C41"/>
    <circle cx="120" cy="248" r="5" fill="#FF5722"/><circle cx="130" cy="252" r="4" fill="#FFEB3B"/><circle cx="270" cy="246" r="5" fill="#E91E63"/><circle cx="280" cy="250" r="4" fill="#FF9800"/><circle cx="200" cy="254" r="4" fill="#9C27B0"/><circle cx="310" cy="248" r="5" fill="#F44336"/>
    {F(1)&&<><circle cx="53" cy="128" r="10" fill="none" stroke="#FF6B6B" strokeWidth="2.5"/><text x="53" y="132" textAnchor="middle" fontSize="11" fill="#FF6B6B">🐦</text></>}
    {F(2)&&<><circle cx="340" cy="50" r="32" fill="none" stroke="#FF6B6B" strokeWidth="2.5"/><text x="340" y="54" textAnchor="middle" fontSize="11" fill="#FF6B6B">✨</text></>}
    {F(3)&&<><circle cx="310" cy="248" r="10" fill="none" stroke="#FF6B6B" strokeWidth="2.5"/><text x="310" y="252" textAnchor="middle" fontSize="11" fill="#FF6B6B">🌸</text></>}
    {F(4)&&<><rect x="160" y="240" width="80" height="8" fill="none" stroke="#FF6B6B" strokeWidth="2" rx="2"/><text x="200" y="247" textAnchor="middle" fontSize="10" fill="#FF6B6B">🪵</text></>}
    {F(5)&&<><circle cx="90" cy="185" r="10" fill="none" stroke="#FF6B6B" strokeWidth="2.5"/><text x="90" y="189" textAnchor="middle" fontSize="11" fill="#FF6B6B">🦋</text></>}
    {F(6)&&<><ellipse cx="250" cy="255" rx="18" ry="12" fill="none" stroke="#FF6B6B" strokeWidth="2"/><text x="250" y="259" textAnchor="middle" fontSize="10" fill="#FF6B6B">🌿</text></>}
    {F(7)&&<><circle cx="330" cy="240" r="10" fill="none" stroke="#FF6B6B" strokeWidth="2"/><text x="330" y="244" textAnchor="middle" fontSize="11" fill="#FF6B6B">🦆</text></>}
  </svg>;
}

function BeachScene({found}:{found:number[]}){
  const F=(id:number)=>found.includes(id);
  return <svg viewBox="0 0 400 300" style={{width:"100%",height:"100%",display:"block"}}>
    <rect width="400" height="180" fill="#81D4FA"/>
    <circle cx="320" cy="50" r="28" fill="#FFD700"/>
    <g fill="white" opacity=".9"><ellipse cx="80" cy="40" rx="30" ry="18"/><ellipse cx="100" cy="34" rx="22" ry="14"/></g>
    <rect y="120" width="400" height="80" fill="#29B6F6"/>
    <path d="M0 150 Q50 140 100 150 Q150 160 200 150 Q250 140 300 150 Q350 160 400 150 V180 H0Z" fill="#0288D1" opacity=".5"/>
    <rect y="190" width="400" height="110" fill="#FFE082"/>
    <path d="M0 195 Q40 188 80 195 Q120 202 160 195 Q200 188 240 195 Q280 202 320 195 Q360 188 400 195" stroke="white" strokeWidth="3" fill="none"/>
    <rect x="68" y="210" width="6" height="70" fill="#795548"/>
    <path d="M20 215 Q71 190 122 215 Z" fill="#F44336"/><path d="M46 215 Q71 205 96 215 Z" fill="#FFEB3B"/>
    <circle cx="220" cy="252" r="18" fill="#FF5722"/>
    <path d="M220 234 A18 18 0 0 1 238 252" fill="#FFEB3B"/><path d="M220 234 A18 18 0 0 0 202 252" fill="#4CAF50"/>
    <rect x="290" y="250" width="40" height="30" fill="#D7CCC8"/>
    <rect x="295" y="235" width="30" height="15" fill="#BCAAA4"/>
    <polygon points="295,235 310,218 325,235" fill="#A1887F"/>
    <text x="240" y="272" fontSize="20">⭐</text>
    {F(1)&&<><circle cx="80" cy="40" r="30" fill="none" stroke="#FF6B6B" strokeWidth="2.5"/><text x="80" y="44" textAnchor="middle" fontSize="11" fill="#FF6B6B">☁️</text></>}
    {F(2)&&<><path d="M20 215 Q71 190 122 215 Z" fill="none" stroke="#FF6B6B" strokeWidth="2.5"/><text x="71" y="207" textAnchor="middle" fontSize="11" fill="#FF6B6B">⛱️</text></>}
    {F(3)&&<><polygon points="295,235 310,218 325,235" fill="none" stroke="#FF6B6B" strokeWidth="2"/><text x="310" y="215" textAnchor="middle" fontSize="11" fill="#FF6B6B">🚩</text></>}
    {F(4)&&<><circle cx="220" cy="252" r="18" fill="none" stroke="#FF6B6B" strokeWidth="2.5"/><text x="220" y="256" textAnchor="middle" fontSize="11" fill="#FF6B6B">⚽</text></>}
    {F(5)&&<><text x="240" y="272" fontSize="20" opacity=".3">⭐</text><circle cx="240" cy="268" r="10" fill="none" stroke="#FF6B6B" strokeWidth="2"/><text x="240" y="272" textAnchor="middle" fontSize="9" fill="#FF6B6B">✦</text></>}
    {F(6)&&<><text x="175" y="258" fontSize="16" opacity=".3">🦀</text><circle cx="175" cy="254" r="9" fill="none" stroke="#FF6B6B" strokeWidth="2"/><text x="175" y="258" textAnchor="middle" fontSize="9" fill="#FF6B6B">🦀</text></>}
    {F(7)&&<><text x="60" y="275" fontSize="14" opacity=".3">🐚</text><circle cx="60" cy="272" r="8" fill="none" stroke="#FF6B6B" strokeWidth="2"/><text x="60" y="276" textAnchor="middle" fontSize="9" fill="#FF6B6B">🐚</text></>}
  </svg>;
}

function FarmScene({found}:{found:number[]}){
  const F=(id:number)=>found.includes(id);
  return <svg viewBox="0 0 400 300" style={{width:"100%",height:"100%",display:"block"}}>
    <rect width="400" height="200" fill="#81D4FA"/>
    <circle cx="340" cy="45" r="24" fill="#FFD700"/>
    <g fill="white" opacity=".9"><ellipse cx="80" cy="40" rx="28" ry="16"/><ellipse cx="100" cy="34" rx="20" ry="13"/></g>
    <ellipse cx="100" cy="200" rx="120" ry="50" fill="#66BB6A"/><ellipse cx="320" cy="200" rx="130" ry="55" fill="#43A047"/>
    <rect y="195" width="400" height="105" fill="#4CAF50"/>
    <rect x="40" y="140" width="100" height="80" fill="#C62828"/>
    <polygon points="40,140 90,100 140,140" fill="#B71C1C"/>
    <rect x="70" y="180" width="40" height="40" fill="#5D4037"/>
    <rect x="50" y="155" width="25" height="20" fill="#FFEB3B"/><rect x="105" y="155" width="25" height="20" fill="#FFEB3B"/>
    <rect x="140" y="120" width="28" height="100" fill="#9E9E9E"/><ellipse cx="154" cy="120" rx="14" ry="8" fill="#BDBDBD"/>
    <rect x="200" y="210" width="180" height="5" fill="#8D6E63"/><rect x="200" y="230" width="180" height="5" fill="#8D6E63"/>
    {[200,240,280,320,360].map(x=><rect key={x} x={x} y={205} width="6" height="35" fill="#6D4C41"/>)}
    <rect x="300" y="155" width="14" height="55" fill="#6D4C41"/>
    <circle cx="307" cy="138" r="26" fill="#2E7D32"/><circle cx="292" cy="150" r="18" fill="#388E3C"/><circle cx="322" cy="148" r="18" fill="#388E3C"/>
    <text x="230" y="255" fontSize="20">🐔</text><text x="330" y="252" fontSize="22">🐄</text>
    {F(1)&&<><circle cx="340" cy="45" r="24" fill="none" stroke="#FF6B6B" strokeWidth="2.5"/><text x="340" y="49" textAnchor="middle" fontSize="11" fill="#FF6B6B">☀️</text></>}
    {F(2)&&<><rect x="50" y="155" width="25" height="20" fill="none" stroke="#FF6B6B" strokeWidth="2"/><text x="62" y="168" textAnchor="middle" fontSize="10" fill="#FF6B6B">🪟</text></>}
    {F(3)&&<><ellipse cx="154" cy="120" rx="14" ry="8" fill="none" stroke="#FF6B6B" strokeWidth="2"/><text x="154" y="124" textAnchor="middle" fontSize="10" fill="#FF6B6B">⭕</text></>}
    {F(4)&&<><rect x="260" y="205" width="6" height="35" fill="none" stroke="#FF6B6B" strokeWidth="2"/><text x="263" y="200" textAnchor="middle" fontSize="10" fill="#FF6B6B">🪵</text></>}
    {F(5)&&<><text x="330" y="252" fontSize="22" opacity=".3">🐄</text><circle cx="330" cy="248" r="12" fill="none" stroke="#FF6B6B" strokeWidth="2"/><text x="330" y="252" textAnchor="middle" fontSize="9" fill="#FF6B6B">🐄</text></>}
    {F(6)&&<><text x="230" y="255" fontSize="20" opacity=".3">🐔</text><circle cx="230" cy="251" r="10" fill="none" stroke="#FF6B6B" strokeWidth="2"/><text x="230" y="255" textAnchor="middle" fontSize="9" fill="#FF6B6B">🐔</text></>}
    {F(7)&&<><text x="175" y="268" fontSize="18" opacity=".3">🌾</text><circle cx="175" cy="264" r="9" fill="none" stroke="#FF6B6B" strokeWidth="2"/><text x="175" y="268" textAnchor="middle" fontSize="9" fill="#FF6B6B">🌾</text></>}
  </svg>;
}

function OceanScene({found}:{found:number[]}){
  const F=(id:number)=>found.includes(id);
  return <svg viewBox="0 0 400 300" style={{width:"100%",height:"100%",display:"block"}}>
    <rect width="400" height="100" fill="#1565C0"/>
    <circle cx="330" cy="40" r="24" fill="#FFD700"/>
    <g fill="white" opacity=".7"><ellipse cx="100" cy="30" rx="28" ry="14"/><ellipse cx="120" cy="25" rx="20" ry="12"/></g>
    <rect y="70" width="400" height="230" fill="#0288D1"/>
    <path d="M0 120 Q50 110 100 120 Q150 130 200 120 Q250 110 300 120 Q350 130 400 120" fill="#29B6F6" opacity=".6"/>
    <path d="M0 160 Q60 150 120 160 Q180 170 240 160 Q300 150 360 160 Q400 165 400 160 V220 H0Z" fill="#0277BD" opacity=".5"/>
    <path d="M60 300 Q55 260 65 240 Q70 220 60 200" stroke="#2E7D32" strokeWidth="5" fill="none"/>
    <path d="M80 300 Q85 270 75 250 Q70 230 80 210" stroke="#388E3C" strokeWidth="4" fill="none"/>
    <path d="M340 300 Q335 265 345 245 Q350 225 340 205" stroke="#1B5E20" strokeWidth="5" fill="none"/>
    <ellipse cx="150" cy="268" rx="25" ry="15" fill="#FF7043"/>
    <ellipse cx="165" cy="262" rx="18" ry="12" fill="#FF5722"/>
    <ellipse cx="260" cy="272" rx="22" ry="13" fill="#AB47BC"/>
    <text x="120" y="160" fontSize="20">🐠</text><text x="220" y="190" fontSize="18">🐟</text>
    <rect x="170" y="252" width="40" height="28" fill="#795548" rx="3"/>
    <rect x="168" y="252" width="44" height="12" fill="#6D4C41" rx="3"/>
    <rect x="185" y="256" width="10" height="8" fill="#FFD700"/>
    {F(1)&&<><circle cx="330" cy="40" r="28" fill="none" stroke="#FF6B6B" strokeWidth="2.5"/><text x="330" y="44" textAnchor="middle" fontSize="11" fill="#FF6B6B">☀️</text></>}
    {F(2)&&<><circle cx="100" cy="30" r="28" fill="none" stroke="#FF6B6B" strokeWidth="2.5"/><text x="100" y="34" textAnchor="middle" fontSize="11" fill="#FF6B6B">☁️</text></>}
    {F(3)&&<><text x="120" y="160" fontSize="20" opacity=".3">🐠</text><circle cx="120" cy="156" r="10" fill="none" stroke="#FF6B6B" strokeWidth="2"/><text x="120" y="160" textAnchor="middle" fontSize="9" fill="#FF6B6B">🐠</text></>}
    {F(4)&&<><rect x="185" y="256" width="10" height="8" fill="none" stroke="#FF6B6B" strokeWidth="2"/><text x="190" y="263" textAnchor="middle" fontSize="9" fill="#FF6B6B">💰</text></>}
    {F(5)&&<><text x="200" y="278" fontSize="16" opacity=".3">⭐</text><circle cx="200" cy="274" r="8" fill="none" stroke="#FF6B6B" strokeWidth="2"/><text x="200" y="278" textAnchor="middle" fontSize="9" fill="#FF6B6B">⭐</text></>}
    {F(6)&&<><text x="290" y="190" fontSize="16" opacity=".3">🐞</text><circle cx="290" cy="186" r="8" fill="none" stroke="#FF6B6B" strokeWidth="2"/><text x="290" y="190" textAnchor="middle" fontSize="9" fill="#FF6B6B">🐞</text></>}
    {F(7)&&<><text x="50" y="278" fontSize="14" opacity=".3">🐚</text><circle cx="50" cy="274" r="8" fill="none" stroke="#FF6B6B" strokeWidth="2"/><text x="50" y="278" textAnchor="middle" fontSize="9" fill="#FF6B6B">🐚</text></>}
  </svg>;
}

function SceneRenderer({ sceneId, found }: { sceneId: string; found: number[] }) {
  if (sceneId === 'park') return <ParkScene found={found} />;
  if (sceneId === 'beach') return <BeachScene found={found} />;
  if (sceneId === 'farm') return <FarmScene found={found} />;
  return <OceanScene found={found} />;
}

export default function SpotDifference({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [screen, setScreen] = useState<'menu'|'game'|'results'>('menu');
  const [level, setLevel] = useState<'easy'|'medium'|'hard'>('easy');
  const [sceneIdx, setSceneIdx] = useState(0);
  const [found, setFound] = useState<number[]>([]);
  const [wrong, setWrong] = useState(0);
  const [showMiss, setShowMiss] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [totalDiffs, setTotalDiffs] = useState(0);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scene = SCENES[sceneIdx];
  const zones: Zone[] = level === 'easy' ? scene.easy : level === 'medium' ? scene.medium : scene.hard;

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (screen !== 'game') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    const hit = zones.find(z => !found.includes(z.id) && px >= z.x && px <= z.x + z.w && py >= z.y && py <= z.y + z.h);
    if (hit) {
      const next = [...found, hit.id];
      setFound(next);
      BELL();
      if (next.length === zones.length) {
        setTimeout(() => { WIN(); setScreen('results'); }, 400);
      }
    } else {
      setWrong(w => w + 1);
      setShowMiss(true);
      WRONG();
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      wrongTimer.current = setTimeout(() => setShowMiss(false), 600);
    }
  }, [screen, zones, found]);

  const startGame = (lvl: typeof level) => {
    const idx = Math.floor(Math.random() * SCENES.length);
    setLevel(lvl);
    setSceneIdx(idx);
    setFound([]);
    setWrong(0);
    setShowMiss(false);
    const z: Zone[] = lvl === 'easy' ? SCENES[idx].easy : lvl === 'medium' ? SCENES[idx].medium : SCENES[idx].hard;
    setTotalDiffs(z.length);
    setScreen('game');
  };

  const score = zones.length > 0 ? Math.round((found.length / zones.length) * 100) : 0;
  const stars = score >= 90 ? 3 : score >= 60 ? 2 : found.length > 0 ? 1 : 0;
  const pct = zones.length > 0 ? (found.length / zones.length) * 100 : 0;

  if (screen === 'menu') {
    return (
      <div style={{ fontFamily: 'Fredoka', minHeight: '100vh', background: '#FFF8F0', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <button onClick={onBack} className="back-btn">← Back</button>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🔍</div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#C084FC', margin: '0 0 8px' }}>Spot the Difference</h1>
          <p style={{ fontSize: 15, color: '#666' }}>Find the differences between the two pictures!</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 320 }}>
          {([['easy','🌟','Easy - 5 differences'],['medium','⭐','Medium - 6 differences'],['hard','🚀','Hard - 7 differences']] as const).map(([lvl,lvlEmoji,lvlLabel]) => (
            <button key={lvl} onClick={() => startGame(lvl)} style={{ background: '#fff', border: '2px solid #E5E0D8', borderRadius: 20, padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: 32 }}>{lvlEmoji}</span>
              <span style={{ fontFamily: 'Fredoka', fontSize: 18, fontWeight: 600, color: '#333' }}>{lvlLabel}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (screen === 'results') {
    return (
      <div style={{ fontFamily: 'Fredoka', minHeight: '100vh', background: '#FFF8F0', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <button onClick={onBack} className="back-btn">← Back</button>
        <div style={{ textAlign: 'center', background: '#fff', borderRadius: 28, padding: '32px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', maxWidth: 360, width: '100%' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>{score >= 90 ? '🎉' : score >= 60 ? '😊' : '🙂'}</div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#C084FC', margin: '0 0 4px' }}>Great job, {kidName}!</h2>
          <p style={{ fontSize: 16, color: '#666', margin: '0 0 20px' }}>You found {found.length} of {zones.length} differences</p>
          <div style={{ fontSize: 40, marginBottom: 8 }}>
            {[1,2,3].map(i => <span key={i} style={{ margin: '0 2px', opacity: i <= stars ? 1 : 0.25 }}>⭐</span>)}
          </div>
          <p style={{ fontSize: 14, color: '#888', margin: '0 0 24px' }}>{wrong} wrong clicks</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => startGame(level)} style={{ background: '#C084FC', color: '#fff', border: 'none', borderRadius: 16, padding: '12px 24px', fontFamily: 'Fredoka', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>Play Again</button>
            <button onClick={() => setScreen('menu')} style={{ background: '#fff', color: '#C084FC', border: '2px solid #C084FC', borderRadius: 16, padding: '12px 24px', fontFamily: 'Fredoka', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>Change Level</button>
          </div>
          {found.length >= zones.length * 0.6 && (
            <button onClick={() => setRatingModalOpen(true)} style={{ marginTop: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', textDecoration: 'underline', fontFamily: 'Fredoka', fontSize: 14 }}>Rate this activity</button>
          )}
          {ratingModalOpen && <RatingModal activity="spot-difference" activityName="Spot the Difference" activityEmoji="🔍" onClose={() => setRatingModalOpen(false)} kidName={kidName} />}
        </div>
      </div>
    );
  }

  // GAME screen
  return (
    <div style={{ fontFamily: 'Fredoka', minHeight: '100vh', background: '#FFF8F0', padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      {/* Header */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <button onClick={() => setScreen('menu')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontFamily: 'Fredoka', fontSize: 15 }}>← Back</button>
        <div style={{ fontSize: 14, color: '#aaa', background: '#fff', borderRadius: 20, padding: '4px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>{found.length}/{zones.length} found</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#C084FC' }}>{level === 'easy' ? '🌟 Easy' : level === 'medium' ? '⭐ Medium' : '🚀 Hard'}</div>
      </div>
      {/* Scene label */}
      <div style={{ fontSize: 13, color: '#aaa', marginBottom: 12, fontWeight: 600 }}>{scene.label}</div>
      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 640, height: 8, background: '#F3E8FF', borderRadius: 4, marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: '#C084FC', borderRadius: 4, width: `${pct}%`, transition: 'width 0.4s ease' }} />
      </div>
      {/* Wrong click indicator */}
      {showMiss && <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', background: '#FF6B6B', color: '#fff', padding: '8px 20px', borderRadius: 20, fontSize: 14, fontWeight: 600, zIndex: 100, fontFamily: 'Fredoka' }}>Try again! 👀</div>}
      {/* Panels */}
      <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 640, flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* LEFT — find differences here */}
        <div onClick={handleClick} style={{ position: 'relative', flex: '1 1 280px', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', cursor: 'crosshair', minHeight: 220, background: '#fff' }}>
          <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(192,132,252,0.9)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, zIndex: 2, fontFamily: 'Fredoka' }}>🔍 Find them!</div>
          <SceneRenderer sceneId={scene.id} found={found} />
        </div>
        {/* RIGHT — reference (correct) */}
        <div style={{ position: 'relative', flex: '1 1 280px', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', minHeight: 220, background: '#fff' }}>
          <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(76,175,80,0.85)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, zIndex: 2, fontFamily: 'Fredoka' }}>✅ Original</div>
          <SceneRenderer sceneId={scene.id} found={found} />
        </div>
      </div>
      {/* Hint */}
      <p style={{ marginTop: 14, fontSize: 13, color: '#bbb', textAlign: 'center', maxWidth: 400 }}>Tap on the LEFT picture where you see a difference! Found: {found.length}/{zones.length}</p>
      {ratingModalOpen && <RatingModal activity="spot-difference" activityName="Spot the Difference" activityEmoji="🔍" onClose={() => setRatingModalOpen(false)} kidName={kidName} />}
    </div>
  );
}
