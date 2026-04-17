'use client';
import { useState } from 'react';
import RatingModal from './RatingModal';

const BING = () => { try { const c=new (window.AudioContext||(window as any).webkitAudioContext)(); const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type='sine'; o.frequency.value=880; g.gain.setValueAtTime(0.2,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.4); o.start(); o.stop(c.currentTime+0.4); } catch {} };
const WRONG_SND = () => { try { const c=new (window.AudioContext||(window as any).webkitAudioContext)(); const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type='sawtooth'; o.frequency.value=220; g.gain.setValueAtTime(0.1,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.3); o.start(); o.stop(c.currentTime+0.3); } catch {} };
const WIN_SND = () => { try { const c=new (window.AudioContext||(window as any).webkitAudioContext)(); [523,659,784,1047].forEach((f,i)=>{ const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type='sine'; o.frequency.value=f; g.gain.setValueAtTime(0.15,c.currentTime+i*0.12); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.12+0.3); o.start(c.currentTime+i*0.12); o.stop(c.currentTime+i*0.12+0.3); }); } catch {} };

const WORDS = [
  { word:'fireman', syllables:[{letters:'fire',vowelType:'long'},{letters:'man',vowelType:'closed'}]},
  { word:'inside', syllables:[{letters:'in',vowelType:'closed'},{letters:'side',vowelType:'long'}]},
  { word:'cupcake', syllables:[{letters:'cup',vowelType:'closed'},{letters:'cake',vowelType:'long'}]},
  { word:'pinecone', syllables:[{letters:'pine',vowelType:'long'},{letters:'cone',vowelType:'long'}]},
  { word:'rocket', syllables:[{letters:'rock',vowelType:'closed'},{letters:'et',vowelType:'closed'}]},
  { word:'basket', syllables:[{letters:'bas',vowelType:'closed'},{letters:'ket',vowelType:'closed'}]},
  { word:'magnet', syllables:[{letters:'mag',vowelType:'closed'},{letters:'net',vowelType:'closed'}]},
  { word:'blanket', syllables:[{letters:'blan',vowelType:'closed'},{letters:'ket',vowelType:'closed'}]},
  { word:'carpet', syllables:[{letters:'car',vowelType:'closed'},{letters:'pet',vowelType:'closed'}]},
  { word:'helmet', syllables:[{letters:'hel',vowelType:'closed'},{letters:'met',vowelType:'closed'}]},
  { word:'pillow', syllables:[{letters:'pill',vowelType:'closed'},{letters:'ow',vowelType:'long'}]},
  { word:'dragon', syllables:[{letters:'drag',vowelType:'closed'},{letters:'on',vowelType:'closed'}]},
  { word:'rabbit', syllables:[{letters:'rab',vowelType:'closed'},{letters:'bit',vowelType:'closed'}]},
  { word:'pencil', syllables:[{letters:'pen',vowelType:'closed'},{letters:'cil',vowelType:'closed'}]},
  { word:'flower', syllables:[{letters:'flow',vowelType:'long'},{letters:'er',vowelType:'closed'}]},
  { word:'table', syllables:[{letters:'ta',vowelType:'long'},{letters:'ble',vowelType:'closed'}]},
];

export default function SyllableScooper() {
  const [screen, setScreen] = useState<'menu'|'game'|'win'>('menu');
  const [wordIdx, setWordIdx] = useState(0);
  const [scoops, setScoops] = useState<number[]>([]);
  const [vowelModes, setVowelModes] = useState<('closed'|'long')[]>([]);
  const [feedback, setFeedback] = useState<'correct'|'wrong'|null>(null);
  const [done, setDone] = useState(false);
  const [showRating, setShowRating] = useState(false);

  const word = WORDS[wordIdx];
  const letterArr = word.word.split('');

  // Init when word changes
  if (scoops.length !== 0 && scoops.every(()=>false)) {} // skip
  if (scoops.length !== letterArr.length) {
    setScoops(new Array(letterArr.length).fill(false));
    setVowelModes(word.syllables.map(()=>'closed'));
  }

  function getGroups(): {letters:string; vowelMode:'closed'|'long'}[] {
    const groups: {letters:string; vowelMode:'closed'|'long'}[] = [];
    let cur = {letters:'', vowelMode:'closed' as const};
    for (let i = 0; i < letterArr.length; i++) {
      cur.letters += letterArr[i];
      if (scoops[i]) { groups.push({...cur}); cur = {letters:'', vowelMode:'closed'}; }
    }
    groups.push({...cur});
    return groups;
  }

  const toggleScoop = (afterIdx: number) => {
    if (done) return;
    setScoops(prev => {
      if (prev.includes(afterIdx)) return prev.filter(x => x !== afterIdx);
      return [...prev, afterIdx].sort((a,b)=>a-b);
    });
    setFeedback(null);
    // Re-sync vowelModes to match new syllable groups
    setVowelModes(prev => {
      const newGroups = getGroups();
      const next = newGroups.map((g, i) => i < prev.length ? prev[i] : 'closed');
      return next.slice(0, newGroups.length);
    });
  };

  const toggleMode = (syllIdx: number) => {
    if (done) return;
    setVowelModes(prev => {
      const n = [...prev];
      n[syllIdx] = n[syllIdx] === 'closed' ? 'long' : 'closed';
      return n;
    });
    setFeedback(null);
  };

  const check = () => {
    if (done) return;
    const groups = getGroups().filter(g => g.letters);
    const scoopCount = groups.length - 1;
    const scoopRight = scoopCount === word.syllables.length - 1;
    const modeRight = vowelModes.every((m, i) => m === word.syllables[i].vowelType);
    if (scoopRight && modeRight) {
      setFeedback('correct'); BING(); setDone(true);
    } else {
      setFeedback('wrong'); WRONG_SND();
      setTimeout(() => setFeedback(null), 1800);
    }
  };

  const nextWord = () => {
    if (wordIdx + 1 >= WORDS.length) { WIN_SND(); setScreen('win'); return; }
    setWordIdx(i => i + 1);
    setScoops(new Array(WORDS[wordIdx+1].word.length).fill(false));
    setVowelModes(WORDS[wordIdx+1].syllables.map(()=>'closed'));
    setFeedback(null); setDone(false);
  };

  const groups = getGroups().filter(g => g.letters);

  // ── MENU ─────────────────────────────────────────────────────────────
  if (screen === 'menu') {
    return (
      <div style={{minHeight:'100vh',background:'#FFF8F0',fontFamily:'Fredoka,sans-serif',padding:20}}>
        <button className="back-btn" onClick={()=>window.location.href='/'}>← Home</button>
        <div style={{textAlign:'center',marginTop:16}}>
          <h2 style={{color:'#7C3AED',fontSize:28,marginBottom:4}}>✂️ Syllable Scooper!</h2>
          <p style={{color:'#666',fontSize:15}}>Fundations-style: break words into syllables</p>

          <div style={{background:'white',borderRadius:18,padding:'20px',boxShadow:'0 2px 8px rgba(0,0,0,0.08)',maxWidth:420,margin:'24px auto',textAlign:'left'}}>
            <h3 style={{color:'#7C3AED',margin:'0 0 12px',fontSize:18}}>How to Play</h3>
            <p style={{color:'#4B5563',fontSize:14,margin:'0 0 10px'}}><b>1.</b> Tap the <b>last letter of a syllable</b> to add a scoop cut after it!</p>
            <p style={{color:'#4B5563',fontSize:14,margin:'0 0 10px'}}><b>2.</b> Tap each syllable to mark its vowel:</p>
            <p style={{color:'#2563EB',fontSize:14,margin:'0 0 4px',paddingLeft:12}}>🔒 <b>Closed</b> = short vowel (consonant after)</p>
            <p style={{color:'#D97706',fontSize:14,margin:'0 0 12px',paddingLeft:12}}>✨ <b>V-e</b> = long vowel (magic e)</p>
            <p style={{color:'#4B5563',fontSize:14,margin:0}}><b>3.</b> Hit Check! ✓</p>
          </div>

          <div style={{background:'#F0F9FF',borderRadius:14,padding:'14px 18px',textAlign:'left',maxWidth:420,margin:'0 auto 24px'}}>
            <p style={{color:'#0369A1',fontSize:14,margin:'0 0 4px',fontWeight:600}}>Words you'll practice:</p>
            <p style={{color:'#075985',fontSize:14,margin:0}}>fireman, inside, cupcake, pinecone, rocket, basket, magnet, blanket, carpet, helmet, pillow, dragon, rabbit, pencil, flower, table</p>
          </div>

          <button onClick={()=>setScreen('game')}
            style={{background:'#7C3AED',color:'white',border:'none',borderRadius:16,padding:'16px 40px',fontSize:20,fontFamily:'Fredoka,sans-serif',cursor:'pointer',fontWeight:600,boxShadow:'0 4px 0 #4C1D95'}}>
            Start Scooping! ✂️
          </button>
        </div>
      </div>
    );
  }

  // ── WIN ────────────────────────────────────────────────────────────
  if (screen === 'win') {
    return (
      <div style={{minHeight:'100vh',background:'#FFF8F0',fontFamily:'Fredoka,sans-serif',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20}}>
        <h2 style={{color:'#7C3AED',fontSize:36}}>🎉 Syllable Star!</h2>
        <p style={{color:'#444',fontSize:22,margin:'8px 0'}}>You scooped all 16 words!</p>
        <div style={{fontSize:64,margin:'16px 0'}}>🌟🌟🌟</div>
        <p style={{color:'#6B7280',fontSize:16,marginBottom:20}}>You're a syllable superstar!</p>
        <div style={{display:'flex',gap:12,marginTop:10}}>
          <button onClick={()=>{setWordIdx(0);setScoops([]);setVowelModes([]);setFeedback(null);setDone(false);setScreen('game');}}
            style={{background:'#7C3AED',color:'white',border:'none',borderRadius:14,padding:'14px 28px',fontSize:18,fontFamily:'Fredoka,sans-serif',cursor:'pointer'}}>Play Again!</button>
          <button onClick={()=>setShowRating(true)}
            style={{background:'#FF6B9D',color:'white',border:'none',borderRadius:14,padding:'14px 28px',fontSize:18,fontFamily:'Fredoka,sans-serif',cursor:'pointer'}}>Rate ★</button>
          <button className="back-btn" onClick={()=>setScreen('menu')}>← Menu</button>
        </div>
        {showRating && <RatingModal activity="syllable-scooper" activityName="Syllable Scooper" activityEmoji="🔤" kidName="Player" onClose={()=>setShowRating(false)}/>}
      </div>
    );
  }

  // ── GAME ───────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:'100vh',background:'#FFF8F0',fontFamily:'Fredoka,sans-serif'}}>
      <div style={{background:'#7C3AED',padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <button className="back-btn" onClick={()=>setScreen('menu')}>← Menu</button>
        <span style={{color:'white',fontSize:16,fontWeight:600}}>✂️ Syllable Scooper</span>
        <span style={{color:'white',fontSize:15}}>{wordIdx+1} / 16</span>
      </div>

      <div style={{padding:20}}>
        {/* Instructions */}
        <p style={{color:'#6B7280',fontSize:14,marginBottom:12,textAlign:'center'}}>
          👆 Tap the <b>last letter of a syllable</b> to scoop after it!
        </p>

        {/* Letter row with scoop lines */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',flexWrap:'wrap',gap:0,marginBottom:20}}>
          {letterArr.map((letter, i) => {
            const isScoop = scoops.includes(i);
            return (
              <div key={i} style={{display:'flex',alignItems:'center'}}>
                <div
                  onClick={() => { if (!done) { toggleScoop(i); if (scoops.every(v=>!v) && i===0) setVowelModes(word.syllables.map(()=>'closed')); } }}
                  style={{
                    background: isScoop ? '#C084FC' : '#1E3A5F',
                    color: 'white',
                    borderRadius: 8,
                    minWidth:34, height:44,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    padding:'0 6px',
                    fontSize:20, fontWeight:700, fontFamily:'Fredoka,sans-serif',
                    cursor: done ? 'default' : 'pointer',
                    boxShadow: isScoop ? '0 3px 0 #7C3AED' : '0 3px 0 #0F1F33',
                    transition: 'all 0.15s',
                    userSelect:'none',
                    border: isScoop ? '2px solid #7C3AED' : '2px solid transparent',
                  }}>
                  {letter.toUpperCase()}
                </div>
                {i < letterArr.length - 1 && (
                  <div style={{
                    width:2, height:44,
                    background: scoops.includes(i) ? '#9333EA' : 'transparent',
                    transition: 'background 0.15s',
                    flexShrink:0,
                  }}/>
                )}
              </div>
            );
          })}
        </div>

        {/* Syllable vowel markers */}
        {groups.length > 0 && (
          <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap',marginBottom:12}}>
            {groups.map((grp, syllIdx) => {
              const mode = vowelModes[syllIdx] || 'closed';
              return (
                <button key={syllIdx}
                  onClick={() => !done && toggleMode(syllIdx)}
                  disabled={done}
                  style={{
                    display:'inline-flex', alignItems:'center', gap:6,
                    background: mode==='long' ? '#FBBF24' : '#60A5FA',
                    color: mode==='long' ? '#78350F' : '#1E40AF',
                    border:'none', borderRadius:12, padding:'8px 16px',
                    fontSize:15, fontFamily:'Fredoka,sans-serif',
                    cursor: done ? 'default' : 'pointer', fontWeight:600,
                    boxShadow: `0 3px 0 ${mode==='long'?'#D97706':'#2563EB'}`,
                    borderBottom:`4px solid ${mode==='long'?'#D97706':'#2563EB'}`,
                  }}>
                  {grp.letters.toUpperCase()} — {mode==='long' ? '✨ V-e' : '🔒 closed'}
                </button>
              );
            })}
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div style={{
            background: feedback==='correct' ? '#F0FDF4' : '#FEF2F2',
            border: `2px solid ${feedback==='correct' ? '#16A34A' : '#EF4444'}`,
            borderRadius:12, padding:'10px 16px', marginBottom:12, textAlign:'center',
          }}>
            {feedback==='correct' ? (
              <p style={{color:'#16A34A',fontSize:17,fontWeight:700,fontFamily:'Fredoka,sans-serif',margin:0}}>✓ Correct!</p>
            ) : (
              <div>
                <p style={{color:'#EF4444',fontSize:15,fontWeight:700,fontFamily:'Fredoka,sans-serif',margin:'0 0 4px'}}>✗ Not quite!</p>
                <p style={{color:'#78350F',fontSize:14,fontFamily:'Fredoka,sans-serif',margin:0}}>
                  Answer: {word.syllables.map(s=>s.letters.toUpperCase()).join(' | ')} → {word.syllables.map(s=>s.vowelType==='long'?'✨':'🔒').join(', ')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div style={{display:'flex',gap:12,justifyContent:'center',marginTop:8}}>
          <button onClick={check} disabled={done && !!feedback}
            style={{background: done&&feedback==='correct' ? '#9CA3AF' : '#7C3AED', color:'white', border:'none', borderRadius:12, padding:'12px 24px', fontSize:16, fontFamily:'Fredoka,sans-serif', cursor: done&&feedback==='correct' ? 'default' : 'pointer'}}>
            Check! ✓
          </button>
          {done && feedback==='correct' && (
            <button onClick={nextWord}
              style={{background:'#16A34A', color:'white', border:'none', borderRadius:12, padding:'12px 24px', fontSize:16, fontFamily:'Fredoka,sans-serif', cursor:'pointer'}}>
              {wordIdx+1 < WORDS.length ? 'Next Word →' : 'Finish! 🎉'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
