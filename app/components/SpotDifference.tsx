'use client';
import { useState, useCallback, useRef } from 'react';
import RatingModal from './RatingModal';

const BING = () => { try { const c = new (window.AudioContext || (window as any).webkitAudioContext)(); const o = c.createOscillator(); const g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = 'sine'; o.frequency.value = 880; g.gain.setValueAtTime(0.2, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4); o.start(); o.stop(c.currentTime + 0.4); } catch {} };
const WRONG_SND = () => { try { const c = new (window.AudioContext || (window as any).webkitAudioContext)(); const o = c.createOscillator(); const g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = 'sawtooth'; o.frequency.value = 220; g.gain.setValueAtTime(0.1, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3); o.start(); o.stop(c.currentTime + 0.3); } catch {} };
const WIN_SND = () => { try { const c = new (window.AudioContext || (window as any).webkitAudioContext)(); [523,659,784,1047].forEach((f,i)=>{ const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type='sine'; o.frequency.value=f; g.gain.setValueAtTime(0.15,c.currentTime+i*0.12); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.12+0.3); o.start(c.currentTime+i*0.12); o.stop(c.currentTime+i*0.12+0.3); }); } catch {} };

interface Zone { id:number; x:number; y:number; w:number; h:number; }
interface Scene { id:string; label:string; icon:string; easy:Zone[]; medium:Zone[]; hard:Zone[]; }

const SCENES: Scene[] = [
  {id:'robot',label:'Robot Friend',icon:'🤖',easy:[{id:1,x:30,y:5,w:20,h:22},{id:2,x:56,y:5,w:20,h:22},{id:3,x:36,y:30,w:14,h:16},{id:4,x:8,y:58,w:20,h:26},{id:5,x:72,y:58,w:20,h:26}],medium:[{id:1,x:30,y:5,w:20,h:22},{id:2,x:56,y:5,w:20,h:22},{id:3,x:36,y:30,w:14,h:16},{id:4,x:8,y:58,w:20,h:26},{id:5,x:72,y:58,w:20,h:26},{id:6,x:8,y:28,w:16,h:14}],hard:[{id:1,x:30,y:5,w:20,h:22},{id:2,x:56,y:5,w:20,h:22},{id:3,x:36,y:30,w:14,h:16},{id:4,x:8,y:58,w:20,h:26},{id:5,x:72,y:58,w:20,h:26},{id:6,x:8,y:28,w:16,h:14},{id:7,x:40,y:76,w:20,h:16}]},
  {id:'rocket',label:'Rocket Ship',icon:'🚀',easy:[{id:1,x:16,y:40,w:14,h:18},{id:2,x:70,y:40,w:14,h:18},{id:3,x:38,y:70,w:24,h:18},{id:4,x:30,y:60,w:18,h:22},{id:5,x:52,y:60,w:18,h:22}],medium:[{id:1,x:16,y:40,w:14,h:18},{id:2,x:70,y:40,w:14,h:18},{id:3,x:38,y:70,w:24,h:18},{id:4,x:30,y:60,w:18,h:22},{id:5,x:52,y:60,w:18,h:22},{id:6,x:8,y:10,w:12,h:14}],hard:[{id:1,x:16,y:40,w:14,h:18},{id:2,x:70,y:40,w:14,h:18},{id:3,x:38,y:70,w:24,h:18},{id:4,x:30,y:60,w:18,h:22},{id:5,x:52,y:60,w:18,h:22},{id:6,x:8,y:10,w:12,h:14},{id:7,x:36,y:24,w:14,h:14}]},
  {id:'house',label:'Cozy House',icon:'🏠',easy:[{id:1,x:22,y:32,w:24,h:28},{id:2,x:38,y:48,w:16,h:16},{id:3,x:8,y:66,w:14,h:20},{id:4,x:64,y:66,w:14,h:20},{id:5,x:38,y:8,w:16,h:14}],medium:[{id:1,x:22,y:32,w:24,h:28},{id:2,x:38,y:48,w:16,h:16},{id:3,x:8,y:66,w:14,h:20},{id:4,x:64,y:66,w:14,h:20},{id:5,x:38,y:8,w:16,h:14},{id:6,x:10,y:24,w:14,h:18}],hard:[{id:1,x:22,y:32,w:24,h:28},{id:2,x:38,y:48,w:16,h:16},{id:3,x:8,y:66,w:14,h:20},{id:4,x:64,y:66,w:14,h:20},{id:5,x:38,y:8,w:16,h:14},{id:6,x:10,y:24,w:14,h:18},{id:7,x:68,y:24,w:12,h:16}]},
  {id:'castle',label:'Magic Castle',icon:'🏰',easy:[{id:1,x:30,y:38,w:20,h:26},{id:2,x:8,y:48,w:16,h:22},{id:3,x:60,y:48,w:16,h:22},{id:4,x:36,y:64,w:14,h:18},{id:5,x:8,y:10,w:12,h:14}],medium:[{id:1,x:30,y:38,w:20,h:26},{id:2,x:8,y:48,w:16,h:22},{id:3,x:60,y:48,w:16,h:22},{id:4,x:36,y:64,w:14,h:18},{id:5,x:8,y:10,w:12,h:14},{id:6,x:40,y:14,w:12,h:14}],hard:[{id:1,x:30,y:38,w:20,h:26},{id:2,x:8,y:48,w:16,h:22},{id:3,x:60,y:48,w:16,h:22},{id:4,x:36,y:64,w:14,h:18},{id:5,x:8,y:10,w:12,h:14},{id:6,x:40,y:14,w:12,h:14},{id:7,x:18,y:64,w:12,h:18}]},
];

function RobotWrong({ found }: { found: number[] }) {
  const F = (id: number) => found.includes(id);
  return (
    <svg viewBox="0 0 400 300" style={{width:'100%',height:'100%',display:'block'}}>
      <rect width="400" height="300" fill="#FFF8F0"/>
      <rect x="46" y="20" width="8" height="30" fill="#9E9E9E"/>
      {F(6) ? <circle cx="50" cy="20" r="8" fill="#FFD700"/> : <polygon points="42,50 58,50 50,30" fill="#FF5722"/>}
      <rect x="110" y="50" width="180" height="130" rx="20" fill="#C084FC"/>
      {F(1) ? <><circle cx="160" cy="100" r="22" fill="#4CAF50"/><circle cx="160" cy="100" r="22" fill="none" stroke="#22C55E" strokeWidth="3"/><circle cx="160" cy="100" r="10" fill="#fff"/></>
        : <><circle cx="160" cy="100" r="22" fill="#FF4444"/><line x1="145" y1="85" x2="175" y2="115" stroke="white" strokeWidth="4"/><line x1="175" y1="85" x2="145" y2="115" stroke="white" strokeWidth="4"/></>}
      {F(2) ? <><circle cx="240" cy="100" r="22" fill="#FF4444"/><circle cx="240" cy="100" r="22" fill="none" stroke="#22C55E" strokeWidth="3"/><circle cx="240" cy="100" r="10" fill="#fff"/></>
        : <><circle cx="240" cy="100" r="22" fill="#4CAF50"/><line x1="225" y1="85" x2="255" y2="115" stroke="white" strokeWidth="4"/><line x1="255" y1="85" x2="225" y2="115" stroke="white" strokeWidth="4"/></>}
      {F(3) ? <rect x="175" y="140" width="50" height="20" rx="4" fill="#FF6B9D"/>
        : <><ellipse cx="200" cy="150" rx="25" ry="12" fill="#FF4444"/><line x1="180" y1="140" x2="220" y2="160" stroke="white" strokeWidth="3"/><line x1="220" y1="140" x2="180" y2="160" stroke="white" strokeWidth="3"/></>}
      {F(4) ? <rect x="20" y="190" width="50" height="30" rx="10" fill="#FF8A65"/> : <rect x="20" y="190" width="50" height="30" rx="10" fill="#4FC3F7"/>}
      {F(5) ? <rect x="330" y="190" width="50" height="30" rx="10" fill="#FF8A65"/> : <rect x="330" y="190" width="50" height="30" rx="10" fill="#FFD54F"/>}
      <rect x="130" y="188" width="140" height="90" rx="12" fill="#C084FC"/>
      {F(7) ? null : <rect x="130" y="230" width="140" height="14" fill="#FF9800"/>}
      <rect x="145" y="275" width="45" height="18" rx="6" fill="#9E9E9E"/>
      <rect x="210" y="275" width="45" height="18" rx="6" fill="#9E9E9E"/>
    </svg>
  );
}

function RobotCorrect() {
  return (
    <svg viewBox="0 0 400 300" style={{width:'100%',height:'100%',display:'block'}}>
      <rect width="400" height="300" fill="#FFF8F0"/>
      <rect x="46" y="20" width="8" height="30" fill="#9E9E9E"/>
      <circle cx="50" cy="20" r="8" fill="#FFD700"/>
      <rect x="110" y="50" width="180" height="130" rx="20" fill="#C084FC"/>
      <circle cx="160" cy="100" r="22" fill="#4CAF50"/><circle cx="160" cy="100" r="10" fill="#fff"/>
      <circle cx="240" cy="100" r="22" fill="#FF4444"/><circle cx="240" cy="100" r="10" fill="#fff"/>
      <rect x="175" y="140" width="50" height="20" rx="4" fill="#FF6B9D"/>
      <rect x="20" y="190" width="50" height="30" rx="10" fill="#FF8A65"/>
      <rect x="330" y="190" width="50" height="30" rx="10" fill="#FF8A65"/>
      <rect x="130" y="188" width="140" height="90" rx="12" fill="#C084FC"/>
      <rect x="130" y="230" width="140" height="14" fill="#FF9800"/>
      <rect x="145" y="275" width="45" height="18" rx="6" fill="#9E9E9E"/>
      <rect x="210" y="275" width="45" height="18" rx="6" fill="#9E9E9E"/>
    </svg>
  );
}

function RocketWrong({ found }: { found: number[] }) {
  const F = (id: number) => found.includes(id);
  return (
    <svg viewBox="0 0 400 300" style={{width:'100%',height:'100%',display:'block'}}>
      <rect width="400" height="300" fill="#1A1A2E"/>
      <circle cx="50" cy="40" r="3" fill="white"/><circle cx="120" cy="20" r="2" fill="white"/>
      <circle cx="200" cy="50" r="3" fill="white"/><circle cx="280" cy="30" r="2" fill="white"/>
      <circle cx="350" cy="60" r="3" fill="white"/>
      {F(6) ? <rect x="40" y="80" width="18" height="25" rx="4" fill="#BDBDBD"/> : null}
      <ellipse cx="200" cy="180" rx="55" ry="90" fill="#E0E0E0"/>
      {F(7) ? <polygon points="175,90 225,90 200,40" fill="#FFD54F"/> : <polygon points="175,90 225,90 200,40" fill="#FF5722"/>}
      {F(4) ? <><circle cx="170" cy="155" r="18" fill="#4FC3F7"/><circle cx="170" cy="155" r="8" fill="#1A1A2E" opacity="0.4"/></>
        : <><circle cx="170" cy="155" r="18" fill="#FF4444"/><line x1="157" y1="142" x2="183" y2="168" stroke="white" strokeWidth="3"/><line x1="183" y1="142" x2="157" y2="168" stroke="white" strokeWidth="3"/></>}
      {F(5) ? <><circle cx="230" cy="155" r="18" fill="#FFEB3B"/><circle cx="230" cy="155" r="8" fill="#1A1A2E" opacity="0.4"/></>
        : <><circle cx="230" cy="155" r="18" fill="#FF4444"/><line x1="217" y1="142" x2="243" y2="168" stroke="white" strokeWidth="3"/><line x1="243" y1="142" x2="217" y2="168" stroke="white" strokeWidth="3"/></>}
      {F(1) ? <polygon points="145,250 175,230 175,275" fill="#4CAF50"/> : <polygon points="145,250 175,230 175,275" fill="#FF4444"/>}
      {F(2) ? <polygon points="255,250 225,230 225,275" fill="#FF9800"/> : <polygon points="255,250 225,230 225,275" fill="#FF4444"/>}
      {F(3) ? <><ellipse cx="200" cy="285" rx="28" ry="18" fill="#2196F3"/><ellipse cx="200" cy="288" rx="16" ry="10" fill="#64B5F6"/></>
        : <><ellipse cx="200" cy="285" rx="28" ry="18" fill="#FF4444"/><ellipse cx="200" cy="288" rx="16" ry="10" fill="#FF6B6B"/></>}
      <rect x="145" y="275" width="45" height="18" rx="6" fill="#9E9E9E"/>
      <rect x="210" y="275" width="45" height="18" rx="6" fill="#9E9E9E"/>
    </svg>
  );
}

function RocketCorrect() {
  return (
    <svg viewBox="0 0 400 300" style={{width:'100%',height:'100%',display:'block'}}>
      <rect width="400" height="300" fill="#1A1A2E"/>
      <circle cx="50" cy="40" r="3" fill="white"/><circle cx="120" cy="20" r="2" fill="white"/>
      <circle cx="200" cy="50" r="3" fill="white"/><circle cx="280" cy="30" r="2" fill="white"/>
      <circle cx="350" cy="60" r="3" fill="white"/>
      <rect x="40" y="80" width="18" height="25" rx="4" fill="#BDBDBD"/>
      <ellipse cx="200" cy="180" rx="55" ry="90" fill="#E0E0E0"/>
      <polygon points="175,90 225,90 200,40" fill="#FFD54F"/>
      <circle cx="170" cy="155" r="18" fill="#4FC3F7"/><circle cx="170" cy="155" r="8" fill="#1A1A2E" opacity="0.4"/>
      <circle cx="230" cy="155" r="18" fill="#FFEB3B"/><circle cx="230" cy="155" r="8" fill="#1A1A2E" opacity="0.4"/>
      <polygon points="145,250 175,230 175,275" fill="#4CAF50"/>
      <polygon points="255,250 225,230 225,275" fill="#FF9800"/>
      <ellipse cx="200" cy="285" rx="28" ry="18" fill="#2196F3"/><ellipse cx="200" cy="288" rx="16" ry="10" fill="#64B5F6"/>
      <rect x="145" y="275" width="45" height="18" rx="6" fill="#9E9E9E"/>
      <rect x="210" y="275" width="45" height="18" rx="6" fill="#9E9E9E"/>
    </svg>
  );
}

function HouseWrong({ found }: { found: number[] }) {
  const F = (id: number) => found.includes(id);
  return (
    <svg viewBox="0 0 400 300" style={{width:'100%',height:'100%',display:'block'}}>
      <rect width="400" height="300" fill="#87CEEB"/>
      {F(5) ? <><circle cx="200" cy="50" r="35" fill="#FFD700"/><circle cx="200" cy="50" r="24" fill="#FFEB3B" opacity="0.6"/></>
        : <><circle cx="200" cy="50" r="35" fill="#9C27B0"/><circle cx="200" cy="50" r="24" fill="#CE93D8" opacity="0.6"/><line x1="180" y1="30" x2="220" y2="70" stroke="white" strokeWidth="3"/><line x1="220" y1="30" x2="180" y2="70" stroke="white" strokeWidth="3"/></>}
      <g fill="white" opacity="0.95"><ellipse cx="320" cy="50" rx="35" ry="20"/><ellipse cx="345" cy="42" rx="25" ry="16"/><ellipse cx="295" cy="45" rx="22" ry="15"/></g>
      <rect y="230" width="400" height="70" fill="#4CAF50"/>
      {F(6) ? <rect x="260" y="100" width="22" height="45" rx="3" fill="#BF360C"/> : null}
      <rect x="110" y="155" width="180" height="110" fill="#FFCCBC"/>
      {F(1) ? <polygon points="100,155 200,70 300,155" fill="#C62828"/>
        : <><polygon points="100,155 200,70 300,155" fill="#9C27B0"/><line x1="100" y1="155" x2="200" y2="70" stroke="white" strokeWidth="3"/><line x1="300" y1="155" x2="200" y2="70" stroke="white" strokeWidth="3"/></>}
      {F(2) ? <rect x="178" y="200" width="44" height="65" rx="4" fill="#2196F3"/>
        : <><rect x="178" y="200" width="44" height="65" rx="4" fill="#FF4444"/><line x1="170" y1="192" x2="222" y2="273" stroke="white" strokeWidth="3"/><line x1="222" y1="192" x2="170" y2="273" stroke="white" strokeWidth="3"/></>}
      <circle cx="213" cy="235" r="4" fill="#9E9E9E"/>
      {F(3) ? <><rect x="125" y="175" width="38" height="38" rx="4" fill="#64B5F6"/><line x1="144" y1="175" x2="144" y2="213" stroke="white" strokeWidth="2"/><line x1="125" y1="194" x2="163" y2="194" stroke="white" strokeWidth="2"/></>
        : <><rect x="125" y="175" width="38" height="38" rx="4" fill="#FFCCBC"/><line x1="117" y1="167" x2="163" y2="213" stroke="#FF4444" strokeWidth="3"/><line x1="163" y1="167" x2="117" y2="213" stroke="#FF4444" strokeWidth="3"/></>}
      {F(4) ? <><rect x="237" y="175" width="38" height="38" rx="4" fill="#FFD54F"/><line x1="256" y1="175" x2="256" y2="213" stroke="white" strokeWidth="2"/><line x1="237" y1="194" x2="275" y2="194" stroke="white" strokeWidth="2"/></>
        : <><rect x="237" y="175" width="38" height="38" rx="4" fill="#4FC3F7"/><line x1="229" y1="167" x2="275" y2="213" stroke="white" strokeWidth="3"/><line x1="275" y1="167" x2="229" y2="213" stroke="white" strokeWidth="3"/></>}
      {F(7) ? <><rect x="308" y="190" width="14" height="55" fill="#795548"/><circle cx="315" cy="178" r="28" fill="#2E7D32"/><circle cx="300" cy="192" r="20" fill="#388E3C"/><circle cx="330" cy="190" r="20" fill="#388E3C"/></> : null}
      <rect x="185" y="265" width="30" height="35" fill="#D7CCC8"/>
      <circle cx="140" cy="268" r="5" fill="#FF5722"/><circle cx="155" cy="272" r="4" fill="#FFEB3B"/>
      <circle cx="250" cy="268" r="5" fill="#E91E63"/><circle cx="265" cy="272" r="4" fill="#FF9800"/>
    </svg>
  );
}

function HouseCorrect() {
  return (
    <svg viewBox="0 0 400 300" style={{width:'100%',height:'100%',display:'block'}}>
      <rect width="400" height="300" fill="#87CEEB"/>
      <circle cx="200" cy="50" r="35" fill="#FFD700"/><circle cx="200" cy="50" r="24" fill="#FFEB3B" opacity="0.6"/>
      <g fill="white" opacity="0.95"><ellipse cx="320" cy="50" rx="35" ry="20"/><ellipse cx="345" cy="42" rx="25" ry="16"/><ellipse cx="295" cy="45" rx="22" ry="15"/></g>
      <rect y="230" width="400" height="70" fill="#4CAF50"/>
      <rect x="260" y="100" width="22" height="45" rx="3" fill="#BF360C"/>
      <rect x="110" y="155" width="180" height="110" fill="#FFCCBC"/>
      <polygon points="100,155 200,70 300,155" fill="#C62828"/>
      <rect x="178" y="200" width="44" height="65" rx="4" fill="#2196F3"/>
      <circle cx="213" cy="235" r="4" fill="#9E9E9E"/>
      <rect x="125" y="175" width="38" height="38" rx="4" fill="#64B5F6"/><line x1="144" y1="175" x2="144" y2="213" stroke="white" strokeWidth="2"/><line x1="125" y1="194" x2="163" y2="194" stroke="white" strokeWidth="2"/>
      <rect x="237" y="175" width="38" height="38" rx="4" fill="#FFD54F"/><line x1="256" y1="175" x2="256" y2="213" stroke="white" strokeWidth="2"/><line x1="237" y1="194" x2="275" y2="194" stroke="white" strokeWidth="2"/>
      <rect x="308" y="190" width="14" height="55" fill="#795548"/><circle cx="315" cy="178" r="28" fill="#2E7D32"/><circle cx="300" cy="192" r="20" fill="#388E3C"/><circle cx="330" cy="190" r="20" fill="#388E3C"/>
      <rect x="185" y="265" width="30" height="35" fill="#D7CCC8"/>
      <circle cx="140" cy="268" r="5" fill="#FF5722"/><circle cx="155" cy="272" r="4" fill="#FFEB3B"/>
      <circle cx="250" cy="268" r="5" fill="#E91E63"/><circle cx="265" cy="272" r="4" fill="#FF9800"/>
    </svg>
  );
}

function CastleWrong({ found }: { found: number[] }) {
  const F = (id: number) => found.includes(id);
  return (
    <svg viewBox="0 0 400 300" style={{width:'100%',height:'100%',display:'block'}}>
      <rect width="400" height="300" fill="#FFF8F0"/>
      <rect width="400" height="200" fill="#90CAF9"/>
      <circle cx="340" cy="45" r="24" fill="#FFD700"/>
      {F(1) ? <polygon points="155,55 200,10 245,55" fill="#C62828"/> : <><polygon points="155,55 200,10 245,55" fill="#2196F3"/><line x1="155" y1="55" x2="200" y2="10" stroke="white" strokeWidth="3"/><line x1="245" y1="55" x2="200" y2="10" stroke="white" strokeWidth="3"/></>}
      {F(2) ? <polygon points="30,95 55,55 80,95" fill="#FFD700"/> : <><polygon points="30,95 55,55 80,95" fill="#C62828"/><line x1="30" y1="95" x2="55" y2="55" stroke="white" strokeWidth="3"/><line x1="80" y1="95" x2="55" y2="55" stroke="white" strokeWidth="3"/></>}
      {F(3) ? <polygon points="320,95 345,55 370,95" fill="#FFD700"/> : <><polygon points="320,95 345,55 370,95" fill="#4CAF50"/><line x1="320" y1="95" x2="345" y2="55" stroke="white" strokeWidth="3"/><line x1="370" y1="95" x2="345" y2="55" stroke="white" strokeWidth="3"/></>}
      <rect x="155" y="55" width="90" height="170" fill="#E0E0E0"/>
      <rect x="55" y="95" width="55" height="130" fill="#EEEEEE"/>
      <rect x="290" y="95" width="55" height="130" fill="#EEEEEE"/>
      {F(4) ? <rect x="180" y="170" width="40" height="55" rx="20" fill="#2196F3"/> : <><rect x="180" y="170" width="40" height="55" rx="20" fill="#FFD54F"/><line x1="172" y1="162" x2="228" y2="233" stroke="white" strokeWidth="3"/><line x1="228" y1="162" x2="172" y2="233" stroke="white" strokeWidth="3"/></>}
      {F(6) ? <><rect x="185" y="80" width="30" height="40" rx="4" fill="#90CAF9"/><line x1="200" y1="80" x2="200" y2="120" stroke="white" strokeWidth="2"/></> : null}
      {F(5) ? <><rect x="54" y="25" width="4" height="30" fill="#9E9E9E"/><polygon points="58,25 80,35 58,45" fill="#FF5722"/></> : null}
      {F(7) ? <rect x="63" y="120" width="30" height="35" rx="4" fill="#90CAF9"/> : null}
    </svg>
  );
}

function CastleCorrect() {
  return (
    <svg viewBox="0 0 400 300" style={{width:'100%',height:'100%',display:'block'}}>
      <rect width="400" height="300" fill="#FFF8F0"/>
      <rect width="400" height="200" fill="#90CAF9"/>
      <circle cx="340" cy="45" r="24" fill="#FFD700"/>
      <polygon points="155,55 200,10 245,55" fill="#C62828"/>
      <polygon points="30,95 55,55 80,95" fill="#FFD700"/>
      <polygon points="320,95 345,55 370,95" fill="#FFD700"/>
      <rect x="155" y="55" width="90" height="170" fill="#E0E0E0"/>
      <rect x="55" y="95" width="55" height="130" fill="#EEEEEE"/>
      <rect x="290" y="95" width="55" height="130" fill="#EEEEEE"/>
      <rect x="180" y="170" width="40" height="55" rx="20" fill="#2196F3"/>
      <rect x="185" y="80" width="30" height="40" rx="4" fill="#90CAF9"/><line x1="200" y1="80" x2="200" y2="120" stroke="white" strokeWidth="2"/>
      <rect x="54" y="25" width="4" height="30" fill="#9E9E9E"/><polygon points="58,25 80,35 58,45" fill="#FF5722"/>
      <rect x="63" y="120" width="30" height="35" rx="4" fill="#90CAF9"/>
    </svg>
  );
}

export default function SpotDifference() {
  const [screen, setScreen] = useState<'menu'|'game'|'win'>('menu');
  const [difficulty, setDifficulty] = useState<'easy'|'medium'|'hard'>('easy');
  const [sceneIdx, setSceneIdx] = useState(0);
  const [found, setFound] = useState<number[]>([]);
  const [wrongClick, setWrongClick] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const scene = SCENES[sceneIdx];
  const zones = difficulty === 'easy' ? scene.easy : difficulty === 'medium' ? scene.medium : scene.hard;
  const total = zones.length;
  const pct = total > 0 ? Math.round((found.length / total) * 100) : 0;

  const startGame = (dif: typeof difficulty) => {
    setDifficulty(dif);
    setSceneIdx(Math.floor(Math.random() * SCENES.length));
    setFound([]);
    setWrongClick(false);
    setScreen('game');
  };

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (screen !== 'game') return;
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const hit = zones.find(z => x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h);
    if (hit && !found.includes(hit.id)) {
      const next = [...found, hit.id];
      setFound(next);
      BING();
      if (next.length === total) { WIN_SND(); setTimeout(() => setScreen('win'), 600); }
    } else if (!hit) {
      setWrongClick(true);
      WRONG_SND();
      setTimeout(() => setWrongClick(false), 1000);
    }
  }, [screen, found, zones, total]);

  const WrongPanel = scene.id === 'robot' ? RobotWrong : scene.id === 'rocket' ? RocketWrong : scene.id === 'house' ? HouseWrong : CastleWrong;
  const CorrectPanel = scene.id === 'robot' ? RobotCorrect : scene.id === 'rocket' ? RocketCorrect : scene.id === 'house' ? HouseCorrect : CastleCorrect;

  if (screen === 'menu') {
    return (
      <div style={{minHeight:'100vh',background:'#FFF8F0',fontFamily:'Fredoka,sans-serif',padding:'20px'}}>
        <button className="back-btn" onClick={()=>window.location.href='/dashboard'}>← Home</button>
        <div style={{textAlign:'center',marginTop:20}}>
          <h2 style={{color:'#C084FC',fontSize:28,marginBottom:4}}>🔍 Spot What's Wrong!</h2>
          <p style={{color:'#666',fontSize:16}}>Find the wrong things in the left picture and click them!</p>
          <div style={{display:'flex',flexDirection:'column',gap:14,maxWidth:340,margin:'24px auto'}}>
            {(['easy','medium','hard'] as const).map(d => (
              <button key={d} onClick={()=>startGame(d)} style={{background:'#C084FC',color:'white',border:'none',borderRadius:16,padding:'16px 24px',fontSize:20,fontFamily:'Fredoka,sans-serif',cursor:'pointer',fontWeight:600}}>
                {d==='easy'?'🌟 Easy — 5 things wrong':d==='medium'?'⭐ Medium — 6 things wrong':'💫 Hard — 7 things wrong'}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'win') {
    return (
      <div style={{minHeight:'100vh',background:'#FFF8F0',fontFamily:'Fredoka,sans-serif',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20}}>
        <h2 style={{color:'#C084FC',fontSize:36}}>🎉 You Found Them All!</h2>
        <p style={{color:'#444',fontSize:22}}>Great job spotting {total} things!</p>
        <div style={{fontSize:48,margin:'16px 0'}}>{pct>=90?'🌟🌟🌟':pct>=60?'🌟🌟':'🌟'}</div>
        <div style={{display:'flex',gap:14,marginTop:10}}>
          <button onClick={()=>startGame(difficulty)} style={{background:'#C084FC',color:'white',border:'none',borderRadius:14,padding:'14px 28px',fontSize:18,fontFamily:'Fredoka,sans-serif',cursor:'pointer'}}>Play Again</button>
          <button onClick={()=>setShowRating(true)} style={{background:'#FF6B9D',color:'white',border:'none',borderRadius:14,padding:'14px 28px',fontSize:18,fontFamily:'Fredoka,sans-serif',cursor:'pointer'}}>Rate ★</button>
          <button className="back-btn" onClick={()=>setScreen('menu')}>← Menu</button>
        </div>
        {showRating && <RatingModal activity="spot-the-difference" activityName="Spot the Difference" activityEmoji="🔍" kidName="Player" onClose={()=>setShowRating(false)}/>}
      </div>
    );
  }

  return (
    <div style={{minHeight:'100vh',background:'#FFF8F0',fontFamily:'Fredoka,sans-serif'}}>
      <div style={{background:'#C084FC',padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <button className="back-btn" onClick={()=>setScreen('menu')}>← Menu</button>
        <span style={{color:'white',fontSize:18,fontWeight:600}}>🔍 {scene.icon} {scene.label}</span>
        <span style={{color:'white',fontSize:16}}>{found.length}/{total}</span>
      </div>
      <div style={{background:'#E0E0E0',height:10}}>
        <div style={{background:'#C084FC',height:'100%',width:`${pct}%`,transition:'width 0.3s'}}/>
      </div>
      {wrongClick && <div style={{background:'#FF4444',color:'white',textAlign:'center',padding:'8px',fontSize:18}}>Try again! 👀</div>}
      <div style={{padding:'8px'}}>
        <p style={{textAlign:'center',color:'#888',fontSize:14,margin:'4px 0 8px'}}>
          Click on the wrong things in the LEFT picture!
        </p>
        <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
          <div ref={panelRef} onClick={handleClick} style={{flex:1,cursor:'crosshair',borderRadius:12,overflow:'hidden',border:'3px solid #C084FC',position:'relative'}}>
            <WrongPanel found={found}/>
          </div>
          <div style={{flex:1,borderRadius:12,overflow:'hidden',border:'3px solid #4CAF50',opacity:0.9}}>
            <CorrectPanel/>
          </div>
        </div>
        <p style={{textAlign:'center',color:'#AAA',fontSize:12,margin:'6px 0 0'}}>← LEFT: find wrong things | RIGHT: this is correct →</p>
      </div>
    </div>
  );
}
