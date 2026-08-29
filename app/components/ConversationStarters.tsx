'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Conversation Starters — read a social scenario (new kid at recess, awkward
// silence at lunch, grandma on the phone) and explore 3 starter lines. Tap
// each line to "say it" and get a coach note (great / ok / awkward). Reflective,
// not scored — counts scenarios explored in localStorage.

type Difficulty = 0 | 1 | 2;

interface Starter {
  text: string;
  rating: 'great' | 'okay' | 'awkward';
  coach: string;
}

interface Scenario {
  situation: string;
  emoji: string;
  starters: Starter[];
}

const POOL: Record<string, Scenario[]> = {
  easy: [
    {
      situation: 'You want to say hi to a kid you do not know at recess.',
      emoji: '👋',
      starters: [
        { text: '"Hi! What is your name?"', rating: 'great', coach: 'Yes — that opens the door!' },
        { text: '"Wanna play?"', rating: 'great', coach: 'Short and friendly. Works great!' },
        { text: '"...hi."', rating: 'okay', coach: 'It is okay! Try adding a question next time.' },
        { text: '...say nothing.', rating: 'awkward', coach: 'Sometimes that happens. Try again next time!' },
      ],
    },
    {
      situation: 'Your grandparent is on the phone and asks how you are.',
      emoji: '📞',
      starters: [
        { text: '"I am good! I built a giant tower today."', rating: 'great', coach: 'Nice — they love hearing details!' },
        { text: '"Fine."', rating: 'okay', coach: 'Okay. Try sharing one fun thing!' },
        { text: '"I do not want to talk."', rating: 'awkward', coach: 'Sometimes we need quiet — that is okay too.' },
        { text: '"Ask Mom!"', rating: 'awkward', coach: 'Try one small thing first!' },
      ],
    },
    {
      situation: 'A friend shows you a drawing and asks "do you like it?"',
      emoji: '🎨',
      starters: [
        { text: '"I love the colors you used!"', rating: 'great', coach: 'Saying what you love is a kind compliment.' },
        { text: '"Cool!"', rating: 'okay', coach: 'Good — try telling them WHY it is cool!' },
        { text: '"I do not really like it."', rating: 'okay', coach: 'It is okay to have feelings. Try one nice thing first.' },
        { text: 'Say nothing and look away.', rating: 'awkward', coach: 'Even a small nod or smile helps!' },
      ],
    },
    {
      situation: 'You want to join a board game already in progress.',
      emoji: '🎲',
      starters: [
        { text: '"Can I play next round?"', rating: 'great', coach: 'Polite and clear!' },
        { text: '"Can I join?"', rating: 'great', coach: 'A great question!' },
        { text: 'Just sit down without asking.', rating: 'awkward', coach: 'Asking first is more fun.' },
        { text: 'Stand next to them silently.', rating: 'okay', coach: 'Try adding a small question out loud!' },
      ],
    },
    {
      situation: 'You disagree with a friend about what game to play.',
      emoji: '⚔️',
      starters: [
        { text: '"How about we play yours first, then mine?"', rating: 'great', coach: 'Taking turns is super kind!' },
        { text: '"No, I do not want to play that."', rating: 'okay', coach: 'Try offering a compromise!' },
        { text: '"Your game is dumb."', rating: 'awkward', coach: 'That can hurt feelings. Try a softer version.' },
        { text: 'Walk away and sulk.', rating: 'awkward', coach: 'Let a grown-up help if it is hard!' },
      ],
    },
    {
      situation: 'You want to ask to play a different game at recess.',
      emoji: '🏃',
      starters: [
        { text: '"Can we try kickball instead?"', rating: 'great', coach: 'Asking nicely is great!' },
        { text: '"I am bored of this."', rating: 'okay', coach: 'Okay — but try asking for what you want instead.' },
        { text: 'Refuse to play anymore.', rating: 'awkward', coach: 'Try saying why first.' },
        { text: 'Run away mid-game.', rating: 'awkward', coach: 'Tough moments happen. Try a break first.' },
      ],
    },
  ],
  medium: [
    {
      situation: 'Your class is doing a show-and-tell. It is your turn and you feel shy.',
      emoji: '🎤',
      starters: [
        { text: '"I brought my favorite book. It is about a dragon."', rating: 'great', coach: 'Starting with the topic helps!' },
        { text: '"Um... I do not know."', rating: 'okay', coach: 'Okay! Try one small thing next time.' },
        { text: '"I do not want to."', rating: 'okay', coach: 'Sometimes shyness is strong. Try a small object next time!' },
        { text: 'Freeze up and say nothing.', rating: 'awkward', coach: 'It is okay. The teacher can help you next time.' },
      ],
    },
    {
      situation: 'A friend is upset and does not want to play.',
      emoji: '😢',
      starters: [
        { text: '"Do you want to talk about it?"', rating: 'great', coach: 'Asking if they want to talk is super kind.' },
        { text: '"Want to read together instead?"', rating: 'great', coach: 'A gentle alternative activity.' },
        { text: '"Just cheer up!"', rating: 'awkward', coach: 'Sad feelings need space. Try listening instead.' },
        { text: 'Walk away and find someone else.', rating: 'awkward', coach: 'It is okay to give space, but say so first.' },
      ],
    },
    {
      situation: 'A grown-up asks what you did at school today.',
      emoji: '👨‍👩‍👧',
      starters: [
        { text: '"We did a science experiment — the egg floated!"', rating: 'great', coach: 'Specific moments are fun to share!' },
        { text: '"Nothing."', rating: 'okay', coach: 'Okay — try one tiny thing!' },
        { text: '"I do not want to talk about it."', rating: 'okay', coach: 'Sometimes we need quiet time first.' },
        { text: 'Walk away silently.', rating: 'awkward', coach: 'A short answer still counts!' },
      ],
    },
    {
      situation: 'A new kid is in class and you want to make them feel welcome.',
      emoji: '🌟',
      starters: [
        { text: '"Want to sit with me at lunch?"', rating: 'great', coach: 'That would feel so good to hear!' },
        { text: '"Hi — I am [name]. What is yours?"', rating: 'great', coach: 'Names are magic openers.' },
        { text: '"Do you want to play?"', rating: 'great', coach: 'Short, kind, clear.' },
        { text: 'Stare from across the room.', rating: 'okay', coach: 'Try saying one thing out loud. Even a smile!' },
      ],
    },
    {
      situation: 'A classmate asks to borrow your favorite marker.',
      emoji: '🖍️',
      starters: [
        { text: '"Sure — be careful with it, okay?"', rating: 'great', coach: 'Sharing with a gentle reminder is great.' },
        { text: '"No."', rating: 'okay', coach: 'Okay — try offering a different marker!' },
        { text: '"Whatever."', rating: 'okay', coach: 'A clearer yes or no works better.' },
        { text: 'Yell "Get away from my stuff!"', rating: 'awkward', coach: 'Big feelings need softer words.' },
      ],
    },
  ],
  hard: [
    {
      situation: 'A teacher asks you to apologize to a classmate after an argument.',
      emoji: '🤝',
      starters: [
        { text: '"I am sorry I hurt your feelings. Want to start over?"', rating: 'great', coach: 'Saying HOW you feel bad and asking to fix it is the gold standard!' },
        { text: '"Sorry."', rating: 'okay', coach: 'A real apology can be longer — try one sentence more.' },
        { text: '"But they started it!"', rating: 'okay', coach: 'It is okay to want to explain, but try apologizing first.' },
        { text: '"No."', rating: 'awkward', coach: 'Sometimes we need help from a grown-up to find the right words.' },
      ],
    },
    {
      situation: 'Your friend talks about you behind your back and you find out.',
      emoji: '😟',
      starters: [
        { text: '"I heard what you said and it made me sad. Can we talk?"', rating: 'great', coach: 'Tough moment handled really well!' },
        { text: '"You are not my friend anymore."', rating: 'okay', coach: 'Try telling how it felt first.' },
        { text: 'Never talk to them again.', rating: 'okay', coach: 'Space is okay, but try a calm "I feel hurt" first.' },
        { text: 'Tell everyone they were mean to you too.', rating: 'awkward', coach: 'Try a calm one-on-one talk first.' },
      ],
    },
    {
      situation: 'You accidentally hurt someone and want to make it right.',
      emoji: '💗',
      starters: [
        { text: '"I am so sorry. Are you okay? Can I help?"', rating: 'great', coach: 'A real apology with care and a fix-it offer.' },
        { text: '"Sorry."', rating: 'okay', coach: 'Good start. Try adding HOW you want to fix it.' },
        { text: '"It was an accident!"', rating: 'okay', coach: 'Yes, but they may still feel hurt. Try acknowledging that.' },
        { text: 'Walk away quickly hoping nobody noticed.', rating: 'awkward', coach: 'Facing up is hard but it feels better.' },
      ],
    },
    {
      situation: 'A grown-up keeps asking you to do something and you really do not want to.',
      emoji: '😤',
      starters: [
        { text: '"I am feeling frustrated. Can we talk about it after I take a break?"', rating: 'great', coach: 'Naming the feeling and asking for a break is super mature!' },
        { text: '"Fine, okay."', rating: 'okay', coach: 'Okay — try telling how it felt.' },
        { text: '"No!"', rating: 'okay', coach: 'Big feelings — try a softer tone first.' },
        { text: 'Yell and storm off.', rating: 'awkward', coach: 'Take a calming breath first.' },
      ],
    },
  ],
};

interface Round {
  scenario: Scenario;
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function makeRound(d: Difficulty): Round {
  const key = d === 0 ? 'easy' : d === 1 ? 'medium' : 'hard';
  return { scenario: pick(POOL[key]) };
}

export default function ConversationStarters({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [screen, setScreen] = useState<'menu' | 'play'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [round, setRound] = useState<Round>(() => makeRound(1));
  const [explored, setExplored] = useState<Set<string>>(new Set());
  const [totalExplored, setTotalExplored] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('convstarters_count');
      if (raw) setTotalExplored(parseInt(raw, 10) || 0);
    } catch {}
  }, []);

  const tryStarter = useCallback((s: Starter) => {
    const newExplored = new Set(explored);
    newExplored.add(s.text);
    setExplored(newExplored);
    setTotalExplored(c => {
      const next = c + 1;
      try { localStorage.setItem('convstarters_count', String(next)); } catch {}
      return next;
    });
    try { kindTone(s.rating); } catch {}
  }, [explored]);

  let _ctx: AudioContext | null = null;
  function ctx(): AudioContext {
    if (typeof window === 'undefined') return {} as AudioContext;
    if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (_ctx.state === 'suspended') _ctx.resume();
    return _ctx;
  }
  function kindTone(rating: 'great' | 'okay' | 'awkward') {
    try {
      const c = ctx();
      const seq = rating === 'great' ? [659, 880, 1047] : rating === 'okay' ? [523, 659] : [392, 330];
      seq.forEach((f, i) => {
        const o = c.createOscillator(); const g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.16, c.currentTime + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.1 + 0.3);
        o.start(c.currentTime + i * 0.1); o.stop(c.currentTime + i * 0.1 + 0.32);
      });
    } catch {}
  }

  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 580 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🗣️</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Conversation Starters</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Starting a conversation is a super skill. Read the situation, then <strong>try each starter line</strong> to see how it might land. There is no wrong way to start — just different ones!
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a level:</p>
          <button className="btn btn-green" onClick={() => { setDifficulty(0); setRound(makeRound(0)); setExplored(new Set()); setScreen('play'); }} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · everyday hellos</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => { setDifficulty(1); setRound(makeRound(1)); setExplored(new Set()); setScreen('play'); }} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · show-and-tell & making new friends</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => { setDifficulty(2); setRound(makeRound(2)); setExplored(new Set()); setScreen('play'); }} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · apologies & big feelings</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★★</span>
            </div>
          </button>
        </div>

        {totalExplored > 0 && (
          <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-medium)' }}>
            💬 You have tried <strong>{totalExplored}</strong> starter lines so far!
          </p>
        )}
      </div>
    );
  }

  // Play screen
  const s = round.scenario;
  return (
    <div className="canvas-page slide-up" style={{ maxWidth: 720, textAlign: 'center' }}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 6 }}>🗣️ Conversation Starters</h1>

      <div style={{
        background: 'linear-gradient(180deg, #FFFBEB, #FFF8F0)',
        border: '3px solid var(--accent-yellow)',
        borderRadius: 18,
        padding: '24px 22px',
        marginBottom: 22,
        boxShadow: 'var(--shadow)',
        maxWidth: 600, margin: '0 auto 22px',
      }}>
        <p style={{ fontSize: 56, margin: '0 0 8px', lineHeight: 1 }}>{s.emoji}</p>
        <p style={{ fontSize: 19, fontWeight: 600, color: 'var(--text-dark)', margin: 0, lineHeight: 1.4 }}>
          {s.situation}
        </p>
      </div>

      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-medium)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
        Try saying...
      </p>

      <div style={{ display: 'grid', gap: 10, maxWidth: 600, margin: '0 auto' }}>
        {s.starters.map((starter, i) => {
          const isExplored = explored.has(starter.text);
          const ratingColor = starter.rating === 'great' ? 'var(--accent-green)' 
                            : starter.rating === 'okay' ? 'var(--accent-yellow)' 
                            : 'var(--accent-orange)';
          return (
            <button key={i} onClick={() => tryStarter(starter)} className="btn"
              style={{
                fontSize: 16, fontWeight: 600,
                padding: '14px 18px',
                background: 'white',
                color: 'var(--text-dark)',
                border: `3px solid ${isExplored ? ratingColor : '#E5E0D8'}`,
                boxShadow: `0 4px 0 ${isExplored ? ratingColor : '#C5B5A2'}`,
                textAlign: 'left', fontFamily: 'Fredoka, sans-serif',
              }}>{starter.text}</button>
          );
        })}
      </div>

      {/* Show coaches after exploration */}
      {explored.size === s.starters.length && (
        <div style={{
          marginTop: 24, padding: '16px 18px',
          background: 'white',
          border: '3px solid var(--accent-purple)',
          borderRadius: 18,
          boxShadow: 'var(--shadow)',
          maxWidth: 600, margin: '24px auto 0',
          animation: 'pop 0.4s ease',
        }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-purple)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>
            What a coach might say
          </p>
          {s.starters.map((st, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8,
              padding: '8px 0',
              borderBottom: i < s.starters.length - 1 ? '1px dashed #E5E0D8' : 'none',
            }}>
              <span style={{
                fontSize: 18, color: st.rating === 'great' ? 'var(--accent-green)' : st.rating === 'okay' ? 'var(--accent-yellow)' : 'var(--accent-orange)',
              }}>{st.rating === 'great' ? '⭐' : st.rating === 'okay' ? '👍' : '🤔'}</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{st.text}</p>
                <p style={{ fontSize: 13, color: 'var(--text-medium)', margin: '2px 0 0', fontStyle: 'italic' }}>{st.coach}</p>
              </div>
            </div>
          ))}
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button onClick={() => { setRound(makeRound(difficulty)); setExplored(new Set()); }} className="btn btn-blue"
              style={{ fontSize: 15, padding: '12px 24px' }}>🔄 Try another situation</button>
          </div>
        </div>
      )}

      {explored.size < s.starters.length && explored.size > 0 && (
        <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-medium)' }}>
          {explored.size} of {s.starters.length} tried — tap all to see what a coach would say!
        </p>
      )}

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-medium)' }}>
        💬 Try each one out loud — practice makes starting feel easier.
      </p>

      {totalExplored >= 8 && !rated && (
        <div style={{ marginTop: 18 }}>
          <button onClick={() => setShowRating(true)} className="btn btn-primary" style={{ fontSize: 16, padding: '12px 24px' }}>
            ⭐ Rate Conversation Starters
          </button>
        </div>
      )}

      {showRating && !rated && (
        <RatingModal activity="conversation-starters" activityName="Conversation Starters" activityEmoji="🗣️" kidName={kidName}
          onClose={() => { setRated(true); setShowRating(false); }} />
      )}
    </div>
  );
}
