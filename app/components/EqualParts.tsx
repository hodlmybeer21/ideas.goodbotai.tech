'use client';
import { useState } from 'react';
import RatingModal from './RatingModal';

const BING = () => { try { const c=new (window.AudioContext||(window as any).webkitAudioContext)(); const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type='sine'; o.frequency.value=880; g.gain.setValueAtTime(0.2,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.4); o.start(); o.stop(c.currentTime+0.4); } catch {} };
const WRONG_SND = () => { try { const c=new (window.AudioContext||(window as any).webkitAudioContext)(); const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type='sawtooth'; o.frequency.value=220; g.gain.setValueAtTime(0.1,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.3); o.start(); o.stop(c.currentTime+0.3); } catch {} };
const WIN_SND = () => { try { const c=new (window.AudioContext||(window as any).webkitAudioContext)(); [523,659,784,1047].forEach((f,i)=>{ const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type='sine'; o.frequency.value=f; g.gain.setValueAtTime(0.15,c.currentTime+i*0.12); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.12+0.3); o.start(c.currentTime+i*0.12); o.stop(c.currentTime+i*0.12+0.3); }); } catch {} };

// ── QUESTIONS ──────────────────────────────────────────────────────────────────
const QUESTIONS = [
  { prompt: "Which circle has SMALLER parts? Tap to answer!", options: ["Halves (2 parts)", "Quarters (4 parts)"], answer: "Quarters (4 parts)", kind: "circles-pair" },
  { prompt: "Which circle has BIGGER parts? Tap the answer!", options: ["Halves (2 parts)", "Quarters (4 parts)"], answer: "Halves (2 parts)", kind: "circles-pair" },
  { prompt: "When you cut into MORE equal parts, each part gets...", options: ["Bigger!", "Smaller!"], answer: "Smaller!", kind: "more-parts" },
  { prompt: "Which circle has QUARTERS (4 equal parts)?", options: ["The one with 2 parts", "The one with 4 parts"], answer: "The one with 4 parts", kind: "circles-pair" },
  { prompt: "Are these EQUAL halves? 🤔", options: ["Yes, equal! ✅", "No, unequal! ❌"], answer: "Yes, equal! ✅", kind: "equal-halves" },
  { prompt: "Is this cut into EQUAL quarters?", options: ["Yes, equal! ✅", "No, unequal! ❌"], answer: "Yes, equal! ✅", kind: "equal-quarters" },
  { prompt: "Are these EQUAL halves?", options: ["Yes, equal! ✅", "No, unequal! ❌"], answer: "No, unequal! ❌", kind: "unequal-circle" },
  { prompt: "Is this cut into EQUAL parts?", options: ["Yes, equal! ✅", "No, unequal! ❌"], answer: "No, unequal! ❌", kind: "unequal-rect" },
  { prompt: "Each of 4 equal parts has a special name. It is called a...", options: ["Half", "Quarter", "Whole"], answer: "Quarter", kind: "four-quarters" },
  { prompt: "Another word for QUARTERS is...", options: ["Halves", "Fourths", "Thirds"], answer: "Fourths", kind: "four-quarters" },
  { prompt: "When you cut a whole into 2 equal parts, you get...", options: ["Halves", "Quarters", "Fourths"], answer: "Halves", kind: "two-halves" },
  { prompt: "Cut a rectangle into 4 equal parts. Each part is called a...", options: ["Half", "Quarter", "Piece"], answer: "Quarter", kind: "four-quarters" },
];

// ── SHAPE RENDERERS ─────────────────────────────────────────────────────────
function EqualHalves() {
  return (<svg viewBox="0 0 200 200" style={{width:'100%',maxWidth:200,display:'block'}}>
    <path d="M 100 100 L 100 10 A 90 90 0 0 1 100 190 Z" fill="#FDE68A" stroke="#92400E" strokeWidth="3"/>
    <path d="M 100 100 L 100 190 A 90 90 0 0 1 100 10 Z" fill="#FEF3C7" stroke="#92400E" strokeWidth="3"/>
    <circle cx="100" cy="100" r="4" fill="#92400E"/>
  </svg>);
}
function EqualQuarters() {
  return (<svg viewBox="0 0 200 200" style={{width:'100%',maxWidth:200,display:'block'}}>
    <path d="M 100 100 L 100 10 A 90 90 0 0 1 190 100 Z" fill="#FBCFE8" stroke="#9D174D" strokeWidth="3"/>
    <path d="M 100 100 L 190 100 A 90 90 0 0 1 100 190 Z" fill="#F9A8D4" stroke="#9D174D" strokeWidth="3"/>
    <path d="M 100 100 L 100 190 A 90 90 0 0 1 10 100 Z" fill="#F472B6" stroke="#9D174D" strokeWidth="3"/>
    <path d="M 100 100 L 10 100 A 90 90 0 0 1 100 10 Z" fill="#EC4899" stroke="#9D174D" strokeWidth="3"/>
    <circle cx="100" cy="100" r="4" fill="#9D174D"/>
  </svg>);
}
function UnequalCircle() {
  return (<svg viewBox="0 0 200 200" style={{width:'100%',maxWidth:200,display:'block'}}>
    <path d="M 100 100 L 100 10 A 90 90 0 0 1 155 170 Z" fill="#FDE68A" stroke="#92400E" strokeWidth="3"/>
    <path d="M 100 100 L 155 170 A 90 90 0 0 1 100 10 Z" fill="#FED7AA" stroke="#92400E" strokeWidth="3"/>
    <circle cx="100" cy="100" r="4" fill="#92400E"/>
  </svg>);
}
function UnequalRect() {
  return (<svg viewBox="0 0 220 160" style={{width:'100%',maxWidth:220,display:'block'}}>
    <rect x="2" y="2" width="135" height="156" fill="#FED7AA" stroke="#9A3412" strokeWidth="3" rx="6"/>
    <rect x="141" y="2" width="77" height="156" fill="#FFEDD5" stroke="#9A3412" strokeWidth="3" rx="6"/>
  </svg>);
}
function CirclesPair() {
  return (
    <div style={{display:'flex',gap:16,alignItems:'center',justifyContent:'center',flexWrap:'wrap'}}>
      <div style={{textAlign:'center'}}>
        {/* HALVES: one vertical cut = 2 equal parts */}
        <svg viewBox="0 0 120 120" style={{width:110,height:110,display:'block'}}>
          <circle cx="60" cy="60" r="52" fill="#FDE68A" stroke="#92400E" strokeWidth="2"/>
          <line x1="60" y1="8" x2="60" y2="112" stroke="#92400E" strokeWidth="2.5"/>
          <circle cx="60" cy="60" r="4" fill="#92400E"/>
        </svg>
        <p style={{margin:4,marginTop:6,fontSize:13,color:'#92400E',fontFamily:'Fredoka,sans-serif'}}>Halves (2 parts)</p>
      </div>
      <span style={{fontSize:28,color:'#9CA3AF'}}>vs</span>
      {/* QUARTERS: both cuts = 4 equal parts */}
      <div style={{textAlign:'center'}}>
        <svg viewBox="0 0 120 120" style={{width:110,height:110,display:'block'}}>
          <circle cx="60" cy="60" r="52" fill="#FBCFE8" stroke="#9D174D" strokeWidth="2"/>
          <line x1="60" y1="8" x2="60" y2="112" stroke="#9D174D" strokeWidth="2"/>
          <line x1="8" y1="60" x2="112" y2="60" stroke="#9D174D" strokeWidth="2"/>
          <circle cx="60" cy="60" r="4" fill="#9D174D"/>
        </svg>
        <p style={{margin:4,marginTop:6,fontSize:13,color:'#9D174D',fontFamily:'Fredoka,sans-serif'}}>Quarters (4 parts)</p>
      </div>
    </div>
  );
}

function MoreParts() {
  return (
    <div style={{display:'flex',gap:12,alignItems:'center',justifyContent:'center',flexWrap:'wrap'}}>
      <div style={{textAlign:'center'}}>
        <svg viewBox="0 0 90 90" style={{width:80,height:80,display:'block'}}>
          <circle cx="45" cy="45" r="40" fill="#FDE68A" stroke="#92400E" strokeWidth="2"/>
          <line x1="45" y1="5" x2="45" y2="85" stroke="#92400E" strokeWidth="2"/>
          <line x1="5" y1="45" x2="85" y2="45" stroke="#92400E" strokeWidth="2"/>
        </svg>
        <p style={{margin:4,marginTop:6,fontSize:12,color:'#92400E',fontFamily:'Fredoka,sans-serif'}}>2 parts</p>
      </div>
      <span style={{fontSize:22}}>→</span>
      <div style={{textAlign:'center'}}>
        <svg viewBox="0 0 90 90" style={{width:80,height:80,display:'block'}}>
          <circle cx="45" cy="45" r="40" fill="#FBCFE8" stroke="#9D174D" strokeWidth="2"/>
          <line x1="45" y1="5" x2="45" y2="85" stroke="#9D174D" strokeWidth="1.5"/>
          <line x1="5" y1="45" x2="85" y2="45" stroke="#9D174D" strokeWidth="1.5"/>
        </svg>
        <p style={{margin:4,marginTop:6,fontSize:12,color:'#9D174D',fontFamily:'Fredoka,sans-serif'}}>4 parts</p>
      </div>
    </div>
  );
}
function FourQuarters() {
  return (
    <div style={{display:'flex',gap:8,alignItems:'center',justifyContent:'center',flexWrap:'wrap'}}>
      <div style={{textAlign:'center'}}>
        <svg viewBox="0 0 100 100" style={{width:90,height:90,display:'block'}}>
          <path d="M 50 50 L 50 2 A 48 48 0 0 1 98 50 Z" fill="#FBCFE8" stroke="#9D174D" strokeWidth="2"/>
          <path d="M 50 50 L 98 50 A 48 48 0 0 1 50 98 Z" fill="#F9A8D4" stroke="#9D174D" strokeWidth="2"/>
          <path d="M 50 50 L 50 98 A 48 48 0 0 1 2 50 Z" fill="#F472B6" stroke="#9D174D" strokeWidth="2"/>
          <path d="M 50 50 L 2 50 A 48 48 0 0 1 50 2 Z" fill="#EC4899" stroke="#9D174D" strokeWidth="2"/>
          <circle cx="50" cy="50" r="3" fill="#9D174D"/>
        </svg>
        <p style={{margin:4,marginTop:4,fontSize:12,color:'#9D174D',fontFamily:'Fredoka,sans-serif'}}>4 = Quarters</p>
      </div>
      <span style={{fontSize:22,color:'#9CA3AF'}}>=</span>
      <div style={{textAlign:'center'}}>
        <svg viewBox="0 0 100 100" style={{width:90,height:90,display:'block'}}>
          <path d="M 50 50 L 50 2 A 48 48 0 0 1 98 50 Z" fill="#FBCFE8" stroke="#9D174D" strokeWidth="2"/>
          <path d="M 50 50 L 98 50 A 48 48 0 0 1 50 98 Z" fill="#F9A8D4" stroke="#9D174D" strokeWidth="2"/>
          <path d="M 50 50 L 50 98 A 48 48 0 0 1 2 50 Z" fill="#F472B6" stroke="#9D174D" strokeWidth="2"/>
          <path d="M 50 50 L 2 50 A 48 48 0 0 1 50 2 Z" fill="#EC4899" stroke="#9D174D" strokeWidth="2"/>
          <circle cx="50" cy="50" r="3" fill="#9D174D"/>
        </svg>
        <p style={{margin:4,marginTop:4,fontSize:12,color:'#9D174D',fontFamily:'Fredoka,sans-serif'}}>4 = Fourths</p>
      </div>
    </div>
  );
}
function TwoHalves() {
  return (
    <div style={{display:'flex',gap:8,alignItems:'center',justifyContent:'center',flexWrap:'wrap'}}>
      <div style={{textAlign:'center'}}>
        <svg viewBox="0 0 100 100" style={{width:90,height:90,display:'block'}}>
          <path d="M 50 50 L 50 2 A 48 48 0 0 1 50 98 Z" fill="#FDE68A" stroke="#92400E" strokeWidth="2"/>
          <path d="M 50 50 L 50 98 A 48 48 0 0 1 50 2 Z" fill="#FEF3C7" stroke="#92400E" strokeWidth="2"/>
          <circle cx="50" cy="50" r="3" fill="#92400E"/>
        </svg>
        <p style={{margin:4,marginTop:4,fontSize:12,color:'#92400E',fontFamily:'Fredoka,sans-serif'}}>Halves!</p>
      </div>
      <span style={{fontSize:22,color:'#9CA3AF'}}>vs</span>
      <div style={{textAlign:'center'}}>
        <svg viewBox="0 0 100 100" style={{width:90,height:90,display:'block'}}>
          <path d="M 50 50 L 50 2 A 48 48 0 0 1 98 50 Z" fill="#FBCFE8" stroke="#9D174D" strokeWidth="2"/>
          <path d="M 50 50 L 98 50 A 48 48 0 0 1 50 98 Z" fill="#F9A8D4" stroke="#9D174D" strokeWidth="2"/>
          <path d="M 50 50 L 50 98 A 48 48 0 0 1 2 50 Z" fill="#F472B6" stroke="#9D174D" strokeWidth="2"/>
          <path d="M 50 50 L 2 50 A 48 48 0 0 1 50 2 Z" fill="#EC4899" stroke="#9D174D" strokeWidth="2"/>
          <circle cx="50" cy="50" r="3" fill="#9D174D"/>
        </svg>
        <p style={{margin:4,marginTop:4,fontSize:12,color:'#9D174D',fontFamily:'Fredoka,sans-serif'}}>Quarters</p>
      </div>
    </div>
  );
}
function QuestionShape({ kind }: { kind: string }) {
  if (kind === 'equal-halves') return <EqualHalves/>;
  if (kind === 'equal-quarters') return <EqualQuarters/>;
  if (kind === 'unequal-circle') return <UnequalCircle/>;
  if (kind === 'unequal-rect') return <UnequalRect/>;
  if (kind === 'circles-pair') return <CirclesPair/>;
  if (kind === 'more-parts') return <MoreParts/>;
  if (kind === 'four-quarters') return <FourQuarters/>;
  if (kind === 'two-halves') return <TwoHalves/>;
  return null;
}

// ── SPLIT CIRCLE HALVES ───────────────────────────────────────────────────
function SplitCircleHalves({ onDone }: { onDone: () => void }) {
  const [cut, setCut] = useState<'H'|'V'|null>(null);
  const check = () => { if (cut) { onDone(); BING(); } else { WRONG_SND(); } };
  return (
    <div style={{textAlign:'center'}}>
      <p style={{color:'#6B7280',fontSize:16,marginBottom:16}}>Tap a line to cut this circle into TWO EQUAL HALVES!</p>
      <div style={{display:'inline-block',position:'relative'}}>
        <svg viewBox="0 0 220 220" style={{width:220,height:220,display:'block'}}>
          <circle cx="110" cy="110" r="95" fill="#FDE68A" stroke="#92400E" strokeWidth="3"/>
          <line x1="110" y1="15" x2="110" y2="205" stroke={cut==='H'?'#16A34A':'#D97706'} strokeWidth={cut==='H'?5:3} strokeDasharray={cut==='H'?'0':'6,4'} style={{cursor:'pointer'}} onClick={()=>setCut('H')}/>
          <line x1="15" y1="110" x2="205" y2="110" stroke={cut==='V'?'#16A34A':'#D97706'} strokeWidth={cut==='V'?5:3} strokeDasharray={cut==='V'?'0':'6,4'} style={{cursor:'pointer'}} onClick={()=>setCut('V')}/>
          {!cut && <text x="110" y="118" textAnchor="middle" fontSize="13" fill="#92400E" fontFamily="Fredoka, sans-serif">Tap a line!</text>}
          {cut && <text x="110" y="118" textAnchor="middle" fontSize="14" fill="#16A34A" fontFamily="Fredoka, sans-serif">Great!</text>}
        </svg>
      </div>
      <div style={{display:'flex',gap:12,justifyContent:'center',marginTop:16}}>
        <button onClick={()=>setCut('H')} style={{background:cut==='H'?'#16A34A':'#F59E0B',color:'white',border:'none',borderRadius:12,padding:'10px 20px',fontSize:15,fontFamily:'Fredoka,sans-serif',cursor:'pointer'}}>↕ Top & Bottom</button>
        <button onClick={()=>setCut('V')} style={{background:cut==='V'?'#16A34A':'#F59E0B',color:'white',border:'none',borderRadius:12,padding:'10px 20px',fontSize:15,fontFamily:'Fredoka,sans-serif',cursor:'pointer'}}>↔ Left & Right</button>
        <button onClick={check} disabled={!cut} style={{background:!cut?'#9CA3AF':'#7C3AED',color:'white',border:'none',borderRadius:12,padding:'10px 20px',fontSize:15,fontFamily:'Fredoka,sans-serif',cursor:!cut?'default':'pointer'}}>Check!</button>
      </div>
    </div>
  );
}

// ── SPLIT CIRCLE QUARTERS ───────────────────────────────────────────────
function SplitCircleQuarters({ onDone }: { onDone: () => void }) {
  const [cuts, setCuts] = useState<string[]>([]);
  const toggle = (d: string) => setCuts(p => p.includes(d) ? p.filter(x=>x!==d) : [...p,d]);
  const done = cuts.includes('H') && cuts.includes('V');
  const check = () => { if (done) { onDone(); BING(); } else { WRONG_SND(); } };
  return (
    <div style={{textAlign:'center'}}>
      <p style={{color:'#6B7280',fontSize:16,marginBottom:16}}>Tap BOTH lines to cut into FOUR EQUAL QUARTERS!</p>
      <svg viewBox="0 0 220 220" style={{width:220,height:220,display:'inline-block'}}>
        <circle cx="110" cy="110" r="95" fill="#FBCFE8" stroke="#9D174D" strokeWidth="3"/>
        <line x1="110" y1="15" x2="110" y2="205" stroke={cuts.includes('H')?'#16A34A':'#D97706'} strokeWidth={cuts.includes('H')?5:3} strokeDasharray={cuts.includes('H')?'0':'6,4'} style={{cursor:'pointer'}} onClick={()=>toggle('H')}/>
        <line x1="15" y1="110" x2="205" y2="110" stroke={cuts.includes('V')?'#16A34A':'#D97706'} strokeWidth={cuts.includes('V')?5:3} strokeDasharray={cuts.includes('V')?'0':'6,4'} style={{cursor:'pointer'}} onClick={()=>toggle('V')}/>
        {!done && <text x="110" y="118" textAnchor="middle" fontSize="13" fill="#9D174D" fontFamily="Fredoka, sans-serif">Tap 2 lines!</text>}
        {done && <text x="110" y="118" textAnchor="middle" fontSize="14" fill="#16A34A" fontFamily="Fredoka, sans-serif">4 Equal Quarters!</text>}
      </svg>
      <div style={{display:'flex',gap:12,justifyContent:'center',marginTop:16}}>
        <button onClick={()=>toggle('H')} style={{background:cuts.includes('H')?'#16A34A':'#F59E0B',color:'white',border:'none',borderRadius:12,padding:'10px 20px',fontSize:15,fontFamily:'Fredoka,sans-serif',cursor:'pointer'}}>↕ Top & Bottom</button>
        <button onClick={()=>toggle('V')} style={{background:cuts.includes('V')?'#16A34A':'#F59E0B',color:'white',border:'none',borderRadius:12,padding:'10px 20px',fontSize:15,fontFamily:'Fredoka,sans-serif',cursor:'pointer'}}>↔ Left & Right</button>
        <button onClick={check} disabled={!done} style={{background:!done?'#9CA3AF':'#7C3AED',color:'white',border:'none',borderRadius:12,padding:'10px 20px',fontSize:15,fontFamily:'Fredoka,sans-serif',cursor:done?'default':'pointer'}}>Check!</button>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────

// ── SPLIT SHAPES ─────────────────────────────────────────────────────────
function SplitSquareHalves({ onDone }: { onDone: () => void }) {
  const [cut, setCut] = useState<'H'|'V'|null>(null);
  const check = () => { if (cut) { onDone(); BING(); } else { WRONG_SND(); } };
  return (
    <div style={{textAlign:'center'}}>
      <p style={{color:'#6B7280',fontSize:16,marginBottom:16}}>Cut this square into TWO EQUAL HALVES! Tap a line.</p>
      <svg viewBox="0 0 220 220" style={{width:220,height:220,display:'inline-block'}}>
        <rect x="10" y="10" width="200" height="200" fill="#A7F3D0" stroke="#065F46" strokeWidth="3" rx="8"/>
        <line x1="110" y1="10" x2="110" y2="210" stroke={cut==='H'?'#16A34A':'#059669'} strokeWidth={cut==='H'?5:3} strokeDasharray={cut==='H'?'0':'6,4'} style={{cursor:'pointer'}} onClick={()=>setCut('H')}/>
        <line x1="10" y1="110" x2="210" y2="110" stroke={cut==='V'?'#16A34A':'#059669'} strokeWidth={cut==='V'?5:3} strokeDasharray={cut==='V'?'0':'6,4'} style={{cursor:'pointer'}} onClick={()=>setCut('V')}/>
        {!cut && <text x="110" y="118" textAnchor="middle" fontSize="13" fill="#065F46" fontFamily="Fredoka, sans-serif">Tap a line!</text>}
        {cut && <text x="110" y="118" textAnchor="middle" fontSize="14" fill="#16A34A" fontFamily="Fredoka, sans-serif">Great!</text>}
      </svg>
      <div style={{display:'flex',gap:12,justifyContent:'center',marginTop:16}}>
        <button onClick={()=>setCut('H')} style={{background:cut==='H'?'#16A34A':'#F59E0B',color:'white',border:'none',borderRadius:12,padding:'10px 20px',fontSize:15,fontFamily:'Fredoka,sans-serif',cursor:'pointer'}}>↕ Top & Bottom</button>
        <button onClick={()=>setCut('V')} style={{background:cut==='V'?'#16A34A':'#F59E0B',color:'white',border:'none',borderRadius:12,padding:'10px 20px',fontSize:15,fontFamily:'Fredoka,sans-serif',cursor:'pointer'}}>↔ Left & Right</button>
        <button onClick={check} disabled={!cut} style={{background:!cut?'#9CA3AF':'#7C3AED',color:'white',border:'none',borderRadius:12,padding:'10px 20px',fontSize:15,fontFamily:'Fredoka,sans-serif',cursor:!cut?'default':'pointer'}}>Check!</button>
      </div>
    </div>
  );
}

function SplitSquareQuarters({ onDone }: { onDone: () => void }) {
  const [cuts, setCuts] = useState<string[]>([]);
  const toggle = (d: string) => setCuts(p => p.includes(d) ? p.filter(x=>x!==d) : [...p,d]);
  const done = cuts.includes('H') && cuts.includes('V');
  const check = () => { if (done) { onDone(); BING(); } else { WRONG_SND(); } };
  return (
    <div style={{textAlign:'center'}}>
      <p style={{color:'#6B7280',fontSize:16,marginBottom:16}}>Cut the square into FOUR EQUAL QUARTERS! Tap both lines.</p>
      <svg viewBox="0 0 220 220" style={{width:220,height:220,display:'inline-block'}}>
        <rect x="10" y="10" width="200" height="200" fill="#A7F3D0" stroke="#065F46" strokeWidth="3" rx="8"/>
        <line x1="110" y1="10" x2="110" y2="210" stroke={cuts.includes('H')?'#16A34A':'#059669'} strokeWidth={cuts.includes('H')?5:3} strokeDasharray={cuts.includes('H')?'0':'6,4'} style={{cursor:'pointer'}} onClick={()=>toggle('H')}/>
        <line x1="10" y1="110" x2="210" y2="110" stroke={cuts.includes('V')?'#16A34A':'#059669'} strokeWidth={cuts.includes('V')?5:3} strokeDasharray={cuts.includes('V')?'0':'6,4'} style={{cursor:'pointer'}} onClick={()=>toggle('V')}/>
        {!done && <text x="110" y="118" textAnchor="middle" fontSize="13" fill="#065F46" fontFamily="Fredoka, sans-serif">Tap 2 lines!</text>}
        {done && <text x="110" y="118" textAnchor="middle" fontSize="14" fill="#16A34A" fontFamily="Fredoka, sans-serif">4 Equal Quarters!</text>}
      </svg>
      <div style={{display:'flex',gap:12,justifyContent:'center',marginTop:16}}>
        <button onClick={()=>toggle('H')} style={{background:cuts.includes('H')?'#16A34A':'#F59E0B',color:'white',border:'none',borderRadius:12,padding:'10px 20px',fontSize:15,fontFamily:'Fredoka,sans-serif',cursor:'pointer'}}>↕ Top & Bottom</button>
        <button onClick={()=>toggle('V')} style={{background:cuts.includes('V')?'#16A34A':'#F59E0B',color:'white',border:'none',borderRadius:12,padding:'10px 20px',fontSize:15,fontFamily:'Fredoka,sans-serif',cursor:'pointer'}}>↔ Left & Right</button>
        <button onClick={check} disabled={!done} style={{background:!done?'#9CA3AF':'#7C3AED',color:'white',border:'none',borderRadius:12,padding:'10px 20px',fontSize:15,fontFamily:'Fredoka,sans-serif',cursor:!done?'default':'pointer'}}>Check!</button>
      </div>
    </div>
  );
}
export default function EqualParts() {
  const [screen, setScreen] = useState<'menu'|'split'|'quiz'|'win'>('menu');
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizQs, setQuizQs] = useState<typeof QUESTIONS>([]);
  const [selected, setSelected] = useState<string|null>(null);
  const [feedback, setFeedback] = useState<'correct'|'wrong'|null>(null);
  const [showRating, setShowRating] = useState(false);
  const [splitStep, setSplitStep] = useState(0);

  const startSplit = () => { setSplitStep(0); setScreen('split'); };
  const startQuiz = () => {
    const s = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 8);
    setQuizQs(s); setQIndex(0); setScore(0); setSelected(null); setFeedback(null); setScreen('quiz');
  };
  const handleSplitDone = () => { BING(); setTimeout(() => { if (splitStep >= 2) setScreen('menu'); else setSplitStep(s => s + 1); }, 800); };
  const handleAnswer = (opt: string) => {
    if (feedback || !quizQs[qIndex]) return;
    setSelected(opt);
    if (opt === quizQs[qIndex].answer) { setFeedback('correct'); setScore(s => s + 1); BING(); }
    else { setFeedback('wrong'); WRONG_SND(); }
    setTimeout(() => {
      if (qIndex + 1 >= quizQs.length) { setScreen('win'); WIN_SND(); }
      else { setQIndex(i => i + 1); setSelected(null); setFeedback(null); }
    }, 1200);
  };
  const pct = quizQs.length > 0 ? Math.round((score / quizQs.length) * 100) : 0;

  // ── MENU ──────────────────────────────────────────────────────────────────
  if (screen === 'menu') {
    return (
      <div style={{minHeight:'100vh',background:'#FFF8F0',fontFamily:'Fredoka,sans-serif',padding:20}}>
        <button className="back-btn" onClick={()=>window.location.href='/'}>← Home</button>
        <div style={{textAlign:'center',marginTop:16}}>
          <h2 style={{color:'#C084FC',fontSize:26,marginBottom:4}}>🔴🟡 Equal Parts</h2>
          <p style={{color:'#666',fontSize:15}}>Halves & Quarters — Grade 1 Math</p>
          <div style={{display:'flex',flexDirection:'column',gap:14,maxWidth:360,margin:'24px auto'}}>
            <div style={{background:'white',borderRadius:18,padding:'18px 20px',boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
              <h3 style={{color:'#D97706',margin:'0 0 8px',fontSize:20}}>✂️ Shape Splitter</h3>
              <p style={{color:'#6B7280',fontSize:14,margin:'0 0 12px'}}>Cut shapes into equal halves and quarters!</p>
              <button onClick={startSplit} style={{background:'#D97706',color:'white',border:'none',borderRadius:12,padding:'12px 24px',fontSize:16,fontFamily:'Fredoka,sans-serif',cursor:'pointer',width:'100%'}}>Start Cutting!</button>
            </div>
            <div style={{background:'white',borderRadius:18,padding:'18px 20px',boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
              <h3 style={{color:'#7C3AED',margin:'0 0 8px',fontSize:20}}>🧠 Quiz Time!</h3>
              <p style={{color:'#6B7280',fontSize:14,margin:'0 0 12px'}}>8 questions about halves and quarters</p>
              <button onClick={startQuiz} style={{background:'#7C3AED',color:'white',border:'none',borderRadius:12,padding:'12px 24px',fontSize:16,fontFamily:'Fredoka,sans-serif',cursor:'pointer',width:'100%'}}>Start Quiz!</button>
            </div>
          </div>
          <div style={{marginTop:24,background:'#FEF9C3',borderRadius:14,padding:'14px 18px',textAlign:'left',maxWidth:360,margin:'24px auto'}}>
            <h4 style={{color:'#92400E',margin:'0 0 8px',fontSize:16}}>📚 Key Words</h4>
            <p style={{color:'#78350F',fontSize:14,margin:'0 4px 4px'}}><b>Half</b> = 2 equal parts</p>
            <p style={{color:'#78350F',fontSize:14,margin:'0 4px 4px'}}><b>Quarter / Fourth</b> = 4 equal parts</p>
            <p style={{color:'#78350F',fontSize:14,margin:'0 4px 0'}}><b>More parts</b> = smaller pieces!</p>
          </div>
        </div>
      </div>
    );
  }

  // ── SPLIT MODE ──────────────────────────────────────────────────────────
  if (screen === 'split') {
    return (
      <div style={{minHeight:'100vh',background:'#FFF8F0',fontFamily:'Fredoka,sans-serif',padding:20}}>
        <div style={{background:'#D97706',padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',borderRadius:12,marginBottom:16}}>
          <button className="back-btn" onClick={()=>setScreen('menu')}>← Menu</button>
          <span style={{color:'white',fontSize:16,fontWeight:600}}>✂️ Shape Splitter</span>
          <span style={{color:'white',fontSize:15}}>{splitStep+1}/3</span>
        </div>
        <div style={{textAlign:'center'}}>
          <h3 style={{color:'#92400E',fontSize:20,marginBottom:16}}>{splitStep===0?'✂️ Cut the CIRCLE into HALVES (2 equal parts)!':splitStep===1?'✂️ Cut the SQUARE into QUARTERS (4 equal parts)!':'✂️ Cut the CIRCLE into QUARTERS (4 equal parts)!'}</h3>
          {splitStep === 0 && <SplitCircleHalves onDone={handleSplitDone}/>}
          {splitStep === 1 && <SplitSquareQuarters onDone={handleSplitDone}/>}
          {splitStep === 2 && <SplitCircleQuarters onDone={handleSplitDone}/>}
        </div>
      </div>
    );
  }

  // ── WIN ──────────────────────────────────────────────────────────────────
  if (screen === 'win') {
    return (
      <div style={{minHeight:'100vh',background:'#FFF8F0',fontFamily:'Fredoka,sans-serif',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20}}>
        <h2 style={{color:'#C084FC',fontSize:36}}>🎉 You did it!</h2>
        <p style={{color:'#444',fontSize:22,margin:'8px 0'}}>You got {score} out of {quizQs.length} right!</p>
        <div style={{fontSize:48,margin:'12px 0'}}>{pct>=90?'🌟🌟🌟':pct>=60?'🌟🌟':pct>=30?'🌟':'👍'}</div>
        <p style={{color:'#6B7280',fontSize:16,marginBottom:20}}>{pct>=90?'Amazing!':pct>=60?'Good job!':pct>=30?'Nice try!':'Keep practicing!'}</p>
        <div style={{display:'flex',gap:12,marginTop:10}}>
          <button onClick={startQuiz} style={{background:'#7C3AED',color:'white',border:'none',borderRadius:14,padding:'14px 28px',fontSize:18,fontFamily:'Fredoka,sans-serif',cursor:'pointer'}}>Play Again</button>
          <button onClick={()=>setShowRating(true)} style={{background:'#FF6B9D',color:'white',border:'none',borderRadius:14,padding:'14px 28px',fontSize:18,fontFamily:'Fredoka,sans-serif',cursor:'pointer'}}>Rate ★</button>
          <button className="back-btn" onClick={()=>setScreen('menu')}>← Menu</button>
        </div>
        {showRating && <RatingModal activity="equal-parts" activityName="Equal Parts" activityEmoji="🔴" kidName="Player" onClose={()=>setShowRating(false)}/>}
      </div>
    );
  }

  // ── QUIZ ─────────────────────────────────────────────────────────────────
  const q = quizQs[qIndex];
  if (!q) return null;
  const fbColor = feedback === 'correct' ? '#16A34A' : feedback === 'wrong' ? '#EF4444' : '#6B7280';
  return (
    <div style={{minHeight:'100vh',background:'#FFF8F0',fontFamily:'Fredoka,sans-serif'}}>
      <div style={{background:'#7C3AED',padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <button className="back-btn" onClick={()=>setScreen('menu')}>← Menu</button>
        <span style={{color:'white',fontSize:16,fontWeight:600}}>🧠 Quiz {qIndex+1}/{quizQs.length}</span>
        <span style={{color:'white',fontSize:16}}>⭐ {score}</span>
      </div>
      <div style={{background:'#E0E7FF',height:8}}><div style={{background:'#7C3AED',height:'100%',width:`${((qIndex)/quizQs.length)*100}%`,transition:'width 0.3s'}}/></div>
      <div style={{padding:24,textAlign:'center'}}>
        <h3 style={{color:'#312E81',fontSize:22,marginBottom:20,lineHeight:1.4}}>{q.prompt}</h3>
        {q.kind && <div style={{marginBottom:24,display:'flex',justifyContent:'center'}}><QuestionShape kind={q.kind}/></div>}
        <div style={{display:'flex',flexDirection:'column',gap:12,maxWidth:360,margin:'0 auto'}}>
          {q.options.map(opt => {
            const isSel = selected === opt;
            const isAns = opt === q.answer;
            const bg = feedback==='correct'&&isAns?'#16A34A':feedback==='wrong'&&isSel?'#EF4444':feedback==='wrong'&&isAns?'#16A34A':isSel?'#7C3AED':'white';
            return (
              <button key={opt} onClick={()=>handleAnswer(opt)} disabled={!!feedback}
                style={{background:bg,color:isSel||(feedback==='correct'&&isAns)?'white':'#374151',
                       border:'none',borderRadius:16,padding:'16px 20px',fontSize:18,
                       fontFamily:'Fredoka,sans-serif',cursor:feedback?'default':'pointer',
                       boxShadow:'0 2px 8px rgba(0,0,0,0.1)',
                       opacity:feedback&&!isSel&&!isAns?0.6:1}}>
                {opt}
              </button>
            );
          })}
        </div>
        {feedback && <p style={{color:fbColor,fontSize:18,marginTop:16,fontWeight:600}}>{feedback==='correct'?'✓ Correct! 🎉':`✗ The answer was: ${q.answer}`}</p>}
      </div>
    </div>
  );
}