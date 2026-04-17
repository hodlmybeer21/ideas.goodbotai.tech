'use client';
import { useState } from 'react';
import RatingModal from './RatingModal';

const BING = () => { try { const c=new (window.AudioContext||(window as any).webkitAudioContext)(); const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type='sine'; o.frequency.value=880; g.gain.setValueAtTime(0.2,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.4); o.start(); o.stop(c.currentTime+0.4); } catch {} };
const WRONG_SND = () => { try { const c=new (window.AudioContext||(window as any).webkitAudioContext)(); const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type='sawtooth'; o.frequency.value=220; g.gain.setValueAtTime(0.1,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.3); o.start(); o.stop(c.currentTime+0.3); } catch {} };
const WIN_SND = () => { try { const c=new (window.AudioContext||(window as any).webkitAudioContext)(); [523,659,784,1047].forEach((f,i)=>{ const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.type='sine'; o.frequency.value=f; g.gain.setValueAtTime(0.15,c.currentTime+i*0.12); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.12+0.3); o.start(c.currentTime+i*0.12); o.stop(c.currentTime+i*0.12+0.3); }); } catch {} };

// Syllable data: word, array of syllables, each has letters and vowelType: 'closed' | 'long'
const WORDS = [
  { word: 'fireman', syllables: [
      { letters: 'fire', vowelType: 'long' },
      { letters: 'man', vowelType: 'closed' },
  ]},
  { word: 'inside', syllables: [
      { letters: 'in', vowelType: 'closed' },
      { letters: 'side', vowelType: 'long' },
  ]},
  { word: 'cupcake', syllables: [
      { letters: 'cup', vowelType: 'closed' },
      { letters: 'cake', vowelType: 'long' },
  ]},
  { word: 'pinecone', syllables: [
      { letters: 'pine', vowelType: 'long' },
      { letters: 'cone', vowelType: 'long' },
  ]},
  { word: 'rocket', syllables: [
      { letters: 'rock', vowelType: 'closed' },
      { letters: 'et', vowelType: 'closed' },
  ]},
  { word: 'basket', syllables: [
      { letters: 'bas', vowelType: 'closed' },
      { letters: 'ket', vowelType: 'closed' },
  ]},
  { word: 'magnet', syllables: [
      { letters: 'mag', vowelType: 'closed' },
      { letters: 'net', vowelType: 'closed' },
  ]},
  { word: 'blanket', syllables: [
      { letters: 'blan', vowelType: 'closed' },
      { letters: 'ket', vowelType: 'closed' },
  ]},
  { word: 'carpet', syllables: [
      { letters: 'car', vowelType: 'closed' },
      { letters: 'pet', vowelType: 'closed' },
  ]},
  { word: 'helmet', syllables: [
      { letters: 'hel', vowelType: 'closed' },
      { letters: 'met', vowelType: 'closed' },
  ]},
  { word: 'pillow', syllables: [
      { letters: 'pill', vowelType: 'closed' },
      { letters: 'ow', vowelType: 'long' },
  ]},
  { word: 'dragon', syllables: [
      { letters: 'drag', vowelType: 'closed' },
      { letters: 'on', vowelType: 'closed' },
  ]},
  { word: 'rabbit', syllables: [
      { letters: 'rab', vowelType: 'closed' },
      { letters: 'bit', vowelType: 'closed' },
  ]},
  { word: 'pencil', syllables: [
      { letters: 'pen', vowelType: 'closed' },
      { letters: 'cil', vowelType: 'closed' },
  ]},
  { word: 'flower', syllables: [
      { letters: 'flow', vowelType: 'long' },
      { letters: 'er', vowelType: 'closed' },
  ]},
  { word: 'table', syllables: [
      { letters: 'ta', vowelType: 'long' },
      { letters: 'ble', vowelType: 'closed' },
  ]},
];

// Scooping game component
function ScoopGame({ onDone }: { onDone: () => void }) {
  const [wordIdx, setWordIdx] = useState(0);
  const [scoops, setScoops] = useState<number[]>([]); // indices where scoops break go (after letter index)
  const [vowelModes, setVowelModes] = useState<('closed'|'long')[]>([]);
  const [feedback, setFeedback] = useState<'correct'|'wrong'|null>(null);
  const [done, setDone] = useState(false);

  const word = WORDS[wordIdx];
  const correctScoops = word.syllables.length - 1; // how many breaks needed
  const totalLetters = word.word.length;

  // Build display: letters grouped by syllable
  function getSyllableGroups() {
    const groups: string[][] = [];
    const letters = word.word.split('');
    if (scoops.length === 0) {
      groups.push(letters);
    } else {
      let start = 0;
      const sortedScoops = [...scoops].sort((a, b) => a - b);
      for (let i = 0; i <= sortedScoops.length; i++) {
        const end = i < sortedScoops.length ? sortedScoops[i] : letters.length;
        groups.push(letters.slice(start, end));
        start = end;
      }
    }
    return groups;
  }

  const toggleScoop = (afterIndex: number) => {
    if (done) return;
    setScoops(prev => {
      if (prev.includes(afterIndex)) return prev.filter(x => x !== afterIndex);
      return [...prev, afterIndex].sort((a, b) => a - b);
    });
    setFeedback(null);
  };

  // Toggle vowel mode for a syllable group index
  const toggleMode = (syllIdx: number) => {
    if (done) return;
    setVowelModes(prev => {
      const next = [...prev];
      next[syllIdx] = next[syllIdx] === 'closed' ? 'long' : 'closed';
      return next;
    });
    setFeedback(null);
  };

  const check = () => {
    if (done) return;
    // Check scoop count
    const scoopCount = scoops.length;
    const scoopCorrect = scoopCount === correctScoops;
    // Check vowel modes — check each syllable
    const modeCorrect = vowelModes.length === word.syllables.length &&
      word.syllables.every((s, i) => vowelModes[i] === s.vowelType);

    if (scoopCorrect && modeCorrect) {
      setFeedback('correct');
      BING();
      setDone(true);
    } else {
      setFeedback('wrong');
      WRONG_SND();
      setTimeout(() => setFeedback(null), 1500);
    }
  };

  const nextWord = () => {
    if (wordIdx + 1 >= WORDS.length) { onDone(); return; }
    setWordIdx(i => i + 1);
    setScoops([]);
    setVowelModes(word.syllables.map(() => 'closed'));
    setFeedback(null);
    setDone(false);
  };

  // Init vowel modes when word changes
  if (vowelModes.length !== word.syllables.length) {
    setVowelModes(word.syllables.map(() => 'closed'));
  }

  const groups = getSyllableGroups();
  const scoopPositions = scoops; // indices into word.word.split('')
  // Positions where scoops go (after letter indices)
  const letterArray = word.word.split('');

  return (
    <div style={{textAlign:'center'}}>
      <p style={{color:'#6B7280',fontSize:15,marginBottom:12}}>Step 1: Tap between letters to SCOOP the word into syllables!</p>
      <p style={{color:'#6B7280',fontSize:14,marginBottom:20}}>Step 2: Tap the syllable to mark the vowel ✨(V-e) or 🔒(closed)!</p>

      {/* Letter tiles with scoop zones */}
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:0,margin:'0 auto',width:'fit-content'}}>
        {/* Letters row */}
        <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',justifyContent:'center',maxWidth:380,gap:0}}>
          {letterArray.map((letter, i) => {
            const isScoop = scoops.includes(i);
            return (
              <div key={i} style={{display:'flex',alignItems:'center'}}>
                <div
                  onClick={() => { if (!done) { toggleScoop(i); if (vowelModes.length !== word.syllables.length) setVowelModes(word.syllables.map(()=>'closed')); } }}
                  style={{
                    background: isScoop ? '#C084FC' : '#1E3A5F',
                    color: 'white',
                    borderRadius: 8,
                    width: 36, height: 44,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:22, fontWeight:700, fontFamily:'Fredoka,sans-serif',
                    cursor: done ? 'default' : 'pointer',
                    boxShadow: '0 2px 0 #0F1F33',
                    border: isScoop ? '2px solid #7C3AED' : '2px solid transparent',
                    transition: 'all 0.15s',
                    userSelect:'none',
                  }}>
                  {letter.toUpperCase()}
                </div>
                {isScoop && (
                  <div style={{width:2,height:50,background:'#C084FC',margin:'0 0',alignSelf:'center'}}/>
                )}
              </div>
            );
          })}
        </div>
        {/* Scoop line indicator */}
        <div style={{height:4,width:'100%',background:'#E5E7EB',borderRadius:2,margin:'4px 0'}}/>
        <p style={{color:'#9CA3AF',fontSize:12,margin:'4px 0 12px'}}>Purple lines = syllable breaks</p>
      </div>

      {/* Syllable vowel marker buttons */}
      {groups.length > 1 && (
        <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap',margin:'12px 0'}}>
          {groups.map((grp, syllIdx) => {
            const mode = vowelModes[syllIdx] || 'closed';
            return (
              <button key={syllIdx}
                onClick={() => { if (!done) { const next = [...(vowelModes.length ? vowelModes : word.syllables.map(():'closed'=>'closed'))]; next[syllIdx]=next[syllIdx]==='closed'?'long':'closed'; setVowelModes(next); } }}
                style={{
                  background: mode === 'long' ? '#FBBF24' : '#60A5FA',
                  color: mode === 'long' ? '#78350F' : '#1E40AF',
                  border:'none', borderRadius:12, padding:'10px 18px',
                  fontSize:16, fontFamily:'Fredoka,sans-serif', cursor: done ? 'default' : 'pointer',
                  fontWeight:600, boxShadow:'0 2px 0 rgba(0,0,0,0.15)',
                  borderBottom:'4px solid ' + (mode==='long'?'#D97706':'#2563EB'),
                }}>
                {grp.join('')} — {mode === 'long' ? '✨ V-e (long)' : '🔒 closed (short)'}
              </button>
            );
          })}
        </div>
      )}

      {groups.length <= 1 && (
        <p style={{color:'#9CA3AF',fontSize:13,margin:'8px 0'}}>Tap between letters to add syllable breaks!</p>
      )}

      {/* Feedback */}
      {feedback && (
        <p style={{
          color: feedback === 'correct' ? '#16A34A' : '#EF4444',
          fontSize:17, fontWeight:700, fontFamily:'Fredoka,sans-serif',
          margin:'8px 0'
        }}>
          {feedback === 'correct' ? '✓ Correct! ' + (wordIdx+1 < WORDS.length ? 'Next word...' : 'All done!') : '✗ Not quite — check your scoops and vowel marks!'}
        </p>
      )}

      {/* Buttons */}
      <div style={{display:'flex',gap:12,justifyContent:'center',marginTop:16}}>
        <button onClick={check} disabled={done && !!feedback}
          style={{background:done&&feedback==='correct'?'#9CA3AF':'#7C3AED',color:'white',border:'none',borderRadius:12,padding:'12px 24px',fontSize:16,fontFamily:'Fredoka,sans-serif',cursor:done&&feedback==='correct'?'default':'pointer'}}>
          Check! ✓
        </button>
        {done && feedback === 'correct' && (
          <button onClick={nextWord}
            style={{background:'#16A34A',color:'white',border:'none',borderRadius:12,padding:'12px 24px',fontSize:16,fontFamily:'Fredoka,sans-serif',cursor:'pointer'}}>
            {wordIdx+1 < WORDS.length ? 'Next Word →' : 'Finish! 🎉'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function SyllableScooper() {
  const [screen, setScreen] = useState<'menu'|'scoop'|'win'>('menu');
  const [wordsDone, setWordsDone] = useState(0);
  const [showRating, setShowRating] = useState(false);

  const startScoop = () => { setWordsDone(0); setScreen('scoop'); };
  const handleDone = () => { WIN_SND(); setScreen('win'); };

  // ── MENU ───────────────────────────────────────────────────────────────────
  if (screen === 'menu') {
    return (
      <div style={{minHeight:'100vh',background:'#FFF8F0',fontFamily:'Fredoka,sans-serif',padding:20}}>
        <button className="back-btn" onClick={()=>window.location.href='/'}>← Home</button>
        <div style={{textAlign:'center',marginTop:16}}>
          <h2 style={{color:'#C084FC',fontSize:26,marginBottom:4}}>🔤 Syllable Scooper!</h2>
          <p style={{color:'#666',fontSize:15}}>Fundations-style syllable practice</p>

          <div style={{background:'white',borderRadius:18,padding:'20px',boxShadow:'0 2px 8px rgba(0,0,0,0.08)',maxWidth:400,margin:'24px auto',textAlign:'left'}}>
            <h3 style={{color:'#7C3AED',margin:'0 0 12px',fontSize:20}}>How to Play</h3>
            <p style={{color:'#4B5563',fontSize:14,margin:'0 0 10px'}}><b>Step 1:</b> Look at the word. Tap between letters to SCOOP it into syllables!</p>
            <p style={{color:'#4B5563',fontSize:14,margin:'0 0 10px'}}><b>Step 2:</b> Tap each syllable to mark the vowel:</p>
            <p style={{color:'#2563EB',fontSize:14,margin:'0 0 6px',paddingLeft:12}}>🔒 <b>Closed</b> = short vowel (consonant after, e.g. "cat" /kæ/)</p>
            <p style={{color:'#D97706',fontSize:14,margin:'0 0 14px',paddingLeft:12}}>✨ <b>V-e</b> = long vowel (magic e, e.g. "cake" /keɪk/)</p>
            <p style={{color:'#4B5563',fontSize:14,margin:'0 0 0'}}><b>Step 3:</b> Hit Check! ✓</p>
          </div>

          <div style={{background:'#F0F9FF',borderRadius:14,padding:'14px 18px',textAlign:'left',maxWidth:400,margin:'0 auto 24px'}}>
            <p style={{color:'#0369A1',fontSize:14,margin:0,fontWeight:600}}>Words you'll practice:</p>
            <p style={{color:'#075985',fontSize:14,margin:'6px 0 0'}}>fireman, inside, cupcake, pinecone, rocket, basket, magnet, blanket, carpet, helmet, pillow, dragon, rabbit, pencil, flower, table</p>
          </div>

          <button onClick={startScoop}
            style={{background:'#7C3AED',color:'white',border:'none',borderRadius:16,padding:'16px 40px',fontSize:20,fontFamily:'Fredoka,sans-serif',cursor:'pointer',fontWeight:600,boxShadow:'0 4px 0 #4C1D95'}}>
            Start Scooping! ✂️
          </button>
        </div>
      </div>
    );
  }

  // ── WIN ──────────────────────────────────────────────────────────────────
  if (screen === 'win') {
    return (
      <div style={{minHeight:'100vh',background:'#FFF8F0',fontFamily:'Fredoka,sans-serif',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20}}>
        <h2 style={{color:'#C084FC',fontSize:36}}>🎉 Amazing Work!</h2>
        <p style={{color:'#444',fontSize:22,margin:'8px 0'}}>You scooped all 16 words!</p>
        <div style={{fontSize:64,margin:'16px 0'}}>🌟🌟🌟</div>
        <p style={{color:'#6B7280',fontSize:16,marginBottom:20}}>You're a syllable superstar!</p>
        <div style={{display:'flex',gap:12,marginTop:10}}>
          <button onClick={startScoop}
            style={{background:'#7C3AED',color:'white',border:'none',borderRadius:14,padding:'14px 28px',fontSize:18,fontFamily:'Fredoka,sans-serif',cursor:'pointer'}}>Play Again!</button>
          <button onClick={()=>setShowRating(true)}
            style={{background:'#FF6B9D',color:'white',border:'none',borderRadius:14,padding:'14px 28px',fontSize:18,fontFamily:'Fredoka,sans-serif',cursor:'pointer'}}>Rate ★</button>
          <button className="back-btn" onClick={()=>setScreen('menu')}>← Menu</button>
        </div>
        {showRating && <RatingModal activity="syllable-scooper" activityName="Syllable Scooper" activityEmoji="🔤" kidName="Player" onClose={()=>setShowRating(false)}/>}
      </div>
    );
  }

  // ── GAME ──────────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:'100vh',background:'#FFF8F0',fontFamily:'Fredoka,sans-serif'}}>
      <div style={{background:'#7C3AED',padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <button className="back-btn" onClick={()=>setScreen('menu')}>← Menu</button>
        <span style={{color:'white',fontSize:16,fontWeight:600}}>🔤 Syllable Scooper</span>
        <span style={{color:'white',fontSize:15}}>16 words</span>
      </div>
      <div style={{padding:20}}>
        <ScoopGame onDone={handleDone}/>
      </div>
    </div>
  );
}
