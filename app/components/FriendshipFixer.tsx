'use client';
import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// Friendship Fixer — given a tricky social scenario, pick the kindest response.
// CASEL-aligned: relationship skills + social problem-solving. Wrong answers
// give coach-tone correction rather than a hard fail; the goal is reflection,
// not a punishing streak.

type Difficulty = 0 | 1 | 2;

interface Scenario {
  situation: string;
  choices: { text: string; kind: boolean }[];
  prompt: string;
}

const POOL: Record<string, Scenario[]> = {
  easy: [
    {
      prompt: 'Someone drops all their books. What do you do?',
      situation: 'A friend at school just dropped all her books on the floor.',
      choices: [
        { text: 'Help her pick them up.', kind: true },
        { text: 'Walk past — someone else will help.', kind: false },
        { text: 'Laugh about it.', kind: false },
        { text: 'Pretend you did not see.', kind: false },
      ],
    },
    {
      prompt: 'A new kid is sitting alone. What do you do?',
      situation: 'A new student is sitting by herself at lunch.',
      choices: [
        { text: 'Ask her to come sit with you.', kind: true },
        { text: 'Ignore her like the other kids do.', kind: false },
        { text: 'Stare at her without saying anything.', kind: false },
        { text: 'Tell your friends she looks weird.', kind: false },
      ],
    },
    {
      prompt: 'Your friend is crying. What do you do?',
      situation: 'Your friend starts crying because she lost her favorite pencil.',
      choices: [
        { text: 'Listen and ask if she is okay.', kind: true },
        { text: 'Tell her to stop crying — it is just a pencil.', kind: false },
        { text: 'Walk away because crying makes you uncomfortable.', kind: false },
        { text: 'Make fun of her for crying.', kind: false },
      ],
    },
    {
      prompt: 'Someone gives you a turn on the swing. What do you say?',
      situation: 'A classmate lets you have a turn on the swing after she has had a long turn.',
      choices: [
        { text: 'Thank her and say "That was really nice of you!"', kind: true },
        { text: 'Just hop on without saying anything.', kind: false },
        { text: 'Take a really long turn.', kind: false },
        { text: 'Say "Took you long enough!"', kind: false },
      ],
    },
    {
      prompt: 'You bump into someone by accident. What do you do?',
      situation: 'You are running and bump into a friend in the hallway.',
      choices: [
        { text: 'Stop and say "Sorry, are you okay?"', kind: true },
        { text: 'Keep running — it was just a bump.', kind: false },
        { text: 'Blame someone else for the bump.', kind: false },
        { text: 'Pretend nothing happened.', kind: false },
      ],
    },
    {
      prompt: 'A friend wants to play a game you do not like. What do you do?',
      situation: 'Your friend wants to play a game you find boring.',
      choices: [
        { text: 'Say "I would rather play something else — how about this?"', kind: true },
        { text: 'Say "That game is stupid."', kind: false },
        { text: 'Pretend to play but stop paying attention.', kind: false },
        { text: 'Walk away without saying anything.', kind: false },
      ],
    },
    {
      prompt: 'You see someone being teased. What do you do?',
      situation: 'You see two kids teasing another kid on the playground.',
      choices: [
        { text: 'Stand near the kid being teased and say "Leave them alone."', kind: true },
        { text: 'Join in and tease too.', kind: false },
        { text: 'Look away and pretend it is not happening.', kind: false },
        { text: 'Laugh so they think you think it is funny.', kind: false },
      ],
    },
    {
      prompt: 'You forgot to bring your snack. What do you do?',
      situation: 'You forgot your snack at home and you are hungry.',
      choices: [
        { text: 'Ask an adult for help.', kind: true },
        { text: 'Take a snack from someone else without asking.', kind: false },
        { text: 'Complain loudly about it the whole lunch.', kind: false },
        { text: 'Hide so nobody sees you do not have one.', kind: false },
      ],
    },
  ],
  medium: [
    {
      prompt: 'Two friends want you to join different games. What do you do?',
      situation: 'Two friends both want you to play with them, but at different things.',
      choices: [
        { text: 'Take turns — play one game then the other.', kind: true },
        { text: 'Pick one and ignore the other friend.', kind: false },
        { text: 'Say you will play both but actually play neither.', kind: false },
        { text: 'Tell both friends the other game is dumb.', kind: false },
      ],
    },
    {
      prompt: 'Your sibling says something mean to you. What do you do?',
      situation: 'Your brother or sister says something mean about you in front of friends.',
      choices: [
        { text: 'Take a breath and tell them how it made you feel.', kind: true },
        { text: 'Say something even meaner back.', kind: false },
        { text: 'Start crying and run away.', kind: false },
        { text: 'Ignore it forever and never talk to them again.', kind: false },
      ],
    },
    {
      prompt: 'You accidentally break a friend\u2019s toy. What do you do?',
      situation: 'You accidentally break your friend\u2019s favorite toy.',
      choices: [
        { text: 'Say sorry and offer to help fix it or replace it.', kind: true },
        { text: 'Hide it and pretend it was already broken.', kind: false },
        { text: 'Blame your friend for having a fragile toy.', kind: false },
        { text: 'Run away before anyone sees.', kind: false },
      ],
    },
    {
      prompt: 'A friend tells you a secret. What do you do?',
      situation: 'Your friend told you a secret about something embarrassing.',
      choices: [
        { text: 'Keep it private — secrets stay between friends.', kind: true },
        { text: 'Tell one or two other people — it is too good not to share!', kind: false },
        { text: 'Tell everyone as a joke.', kind: false },
        { text: 'Bring it up later to tease your friend.', kind: false },
      ],
    },
    {
      prompt: 'Your friend wants to go first. What do you do?',
      situation: 'You really want to go first in a game, but your friend does too.',
      choices: [
        { text: 'Offer to let your friend go first this time.', kind: true },
        { text: 'Insist on going first because you really want to.', kind: false },
        { text: 'Pretend to let them go first but then go anyway.', kind: false },
        { text: 'Quit the game because you did not get your way.', kind: false },
      ],
    },
    {
      prompt: 'You see someone sitting alone at recess. What do you do?',
      situation: 'You notice a kid sitting by themselves at recess every day.',
      choices: [
        { text: 'Ask if they want to play together.', kind: true },
        { text: 'Assume they prefer being alone.', kind: false },
        { text: 'Tell other kids they are weird.', kind: false },
        { text: 'Wait for a teacher to do something.', kind: false },
      ],
    },
    {
      prompt: 'You cannot finish your homework. What do you do?',
      situation: 'You are struggling with a homework problem and getting frustrated.',
      choices: [
        { text: 'Ask a parent, teacher, or friend for help.', kind: true },
        { text: 'Rip up the paper and pretend you never had it.', kind: false },
        { text: 'Copy someone else\u2019s answers quickly.', kind: false },
        { text: 'Yell at your homework and throw it.', kind: false },
      ],
    },
  ],
  hard: [
    {
      prompt: 'You made a mistake that hurt the team. What do you do?',
      situation: 'Your team lost the game because of a mistake you made.',
      choices: [
        { text: 'Apologize to your teammates and focus on next time.', kind: true },
        { text: 'Blame another teammate for the loss.', kind: false },
        { text: 'Quit the team so nobody reminds you.', kind: false },
        { text: 'Make excuses until everyone agrees it was not your fault.', kind: false },
      ],
    },
    {
      prompt: 'Your friend keeps excluding another kid. What do you do?',
      situation: 'Your friend group keeps leaving out one specific kid on purpose.',
      choices: [
        { text: 'Speak up and ask your friends to include everyone.', kind: true },
        { text: 'Stay quiet and go along with it.', kind: false },
        { text: 'Help your friends leave that kid out even more.', kind: false },
        { text: 'Pretend you do not notice anything.', kind: false },
      ],
    },
    {
      prompt: 'Someone says something unfair about a whole group. What do you do?',
      situation: 'A classmate says "All [kids with glasses / left-handed kids / quiet kids] are weird."',
      choices: [
        { text: 'Say "That is not fair — people are all different."', kind: true },
        { text: 'Laugh because the joke was funny.', kind: false },
        { text: 'Pretend you never heard it.', kind: false },
        { text: 'Say something even meaner back.', kind: false },
      ],
    },
    {
      prompt: 'You really want to be on the winning team. What do you do?',
      situation: 'It is team-picking time and you really want to be on the winning team.',
      choices: [
        { text: 'Be happy with whichever team you are on and play your best.', kind: true },
        { text: 'Whine if you do not get the team you want.', kind: false },
        { text: 'Refuse to play if you are not on a winning team.', kind: false },
        { text: 'Tell the captain to put all the slow kids on the other team.', kind: false },
      ],
    },
    {
      prompt: 'Your friend is being mean to a kid you do not know. What do you do?',
      situation: 'Your friend is being mean to another kid who you do not know.',
      choices: [
        { text: 'Tell your friend privately that it is not okay.', kind: true },
        { text: 'Cheer your friend on to keep being mean.', kind: false },
        { text: 'Ignore it and walk away.', kind: false },
        { text: 'Join in so you do not get bullied yourself.', kind: false },
      ],
    },
    {
      prompt: 'You win and your friend loses. What do you do?',
      situation: 'You just beat your friend at a game and she looks sad.',
      choices: [
        { text: 'Say "Good game!" and ask if she wants to play again.', kind: true },
        { text: 'Boast about winning and tease her.', kind: false },
        { text: 'Pretend you did not notice she is sad.', kind: false },
        { text: 'Walk away without saying anything.', kind: false },
      ],
    },
  ],
};

interface Round {
  scenario: Scenario;
  correctIndex: number;
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function makeRound(d: Difficulty): Round {
  const key = d === 0 ? 'easy' : d === 1 ? 'medium' : 'hard';
  const scenario = pick(POOL[key]);
  const correctIndex = scenario.choices.findIndex(c => c.kind);
  return { scenario, correctIndex };
}

let _ctx: AudioContext | null = null;
function ctx(): AudioContext {
  if (typeof window === 'undefined') return {} as AudioContext;
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}
function heartChime() {
  try {
    const c = ctx();
    [523, 659, 880].forEach((f, i) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.18, c.currentTime + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.08 + 0.3);
      o.start(c.currentTime + i * 0.08); o.stop(c.currentTime + i * 0.08 + 0.32);
    });
  } catch {}
}
function thud() {
  try {
    const c = ctx();
    const o = c.createOscillator(); const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'square';
    o.frequency.setValueAtTime(180, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(110, c.currentTime + 0.2);
    g.gain.setValueAtTime(0.12, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.24);
    o.start(c.currentTime); o.stop(c.currentTime + 0.26);
  } catch {}
}
function cheer() {
  try {
    const c = ctx();
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.18, c.currentTime + i * 0.13);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.13 + 0.28);
      o.start(c.currentTime + i * 0.13); o.stop(c.currentTime + i * 0.13 + 0.3);
    });
  } catch {}
}

function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const colors = ['#FF6B9D', '#FFD93D', '#6BCBFF', '#6BCB77', '#C084FC', '#FF9F43'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i, left: `${Math.random() * 100}%`,
    color: colors[i % colors.length], delay: `${Math.random() * 0.8}s`,
    size: 6 + Math.random() * 8,
  }));
  return (
    <div className="confetti-container">
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          left: `${p.left}%`, background: p.color, animationDelay: p.delay,
          width: p.size, height: p.size * 2, borderRadius: 2,
        }} />
      ))}
    </div>
  );
}

const TOTAL_ROUNDS = 8;

export default function FriendshipFixer({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [screen, setScreen] = useState<'menu' | 'game' | 'results'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [round, setRound] = useState<Round>(() => makeRound(1));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [roundCount, setRoundCount] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'good' | 'try'; text: string } | null>(null);
  const [locked, setLocked] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem('friendfixer_best_streak');
      if (s) setBestStreak(parseInt(s, 10) || 0);
      const sc = localStorage.getItem('friendfixer_best_score');
      if (sc) setBestScore(parseInt(sc, 10) || 0);
    } catch {}
  }, []);

  const startGame = useCallback((d: Difficulty) => {
    setDifficulty(d);
    setRound(makeRound(d));
    setScore(0); setStreak(0); setRoundCount(0);
    setFeedback(null); setLocked(false);
    setScreen('game');
  }, []);

  const nextRound = useCallback((d: Difficulty) => {
    setRound(makeRound(d));
    setFeedback(null);
    setLocked(false);
  }, []);

  const choose = useCallback((idx: number) => {
    if (locked) return;
    const isCorrect = round.scenario.choices[idx].kind;
    if (isCorrect) {
      const newStreak = streak + 1;
      setScore(s => s + 10);
      setStreak(newStreak);
      setRoundCount(c => c + 1);
      setLocked(true);
      heartChime();
      setFeedback({
        kind: 'good',
        text: `Yes — that is the kind choice. ${round.scenario.choices[idx].text}`,
      });
      const isLast = roundCount + 1 >= TOTAL_ROUNDS;
      setTimeout(() => {
        try {
          if (newStreak > bestStreak) localStorage.setItem('friendfixer_best_streak', String(newStreak));
        } catch {}
        if (isLast) setScreen('results');
        else nextRound(difficulty);
      }, 1600);
    } else {
      thud();
      setStreak(0);
      setFeedback({
        kind: 'try',
        text: `Think about how the other person would feel. Try another option!`,
      });
    }
  }, [locked, round, streak, bestStreak, roundCount, difficulty, nextRound]);

  useEffect(() => {
    if (screen === 'results') {
      try { if (score > bestScore) localStorage.setItem('friendfixer_best_score', String(score)); } catch {}
      if (score >= 50) cheer();
    }
  }, [screen, score, bestScore]);

  if (screen === 'menu') {
    return (
      <div className="canvas-page slide-up" style={{ textAlign: 'center', maxWidth: 580 }}>
        <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
        <div style={{ fontSize: 80, marginTop: 12 }}>🌟</div>
        <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 8 }}>Friendship Fixer</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', maxWidth: 460, margin: '0 auto 24px' }}>
          Sometimes tricky moments pop up at school. Read the situation, pick the <strong>kind</strong> thing to do. The point is to think — every answer teaches us something.
        </p>

        <div style={{ display: 'grid', gap: 14, maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-medium)', textAlign: 'center' }}>Pick a level:</p>
          <button className="btn btn-green" onClick={() => startGame(0)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌱 Easy · everyday kind choices</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★</span>
            </div>
          </button>
          <button className="btn btn-blue" onClick={() => startGame(1)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌿 Medium · sharing & secrets</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★</span>
            </div>
          </button>
          <button className="btn btn-purple" onClick={() => startGame(2)} style={{ fontSize: 17, padding: '14px 18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌳 Hard · group fairness & speaking up</span>
              <span style={{ fontSize: 13, opacity: 0.85 }}>★★★</span>
            </div>
          </button>
        </div>

        {(bestStreak > 0 || bestScore > 0) && (
          <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-medium)' }}>
            🏆 Best: streak <strong>{bestStreak}</strong> · score <strong>{bestScore}</strong>
          </p>
        )}
        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-medium)' }}>
          8 situations per round. Take your time — being kind is a skill that takes practice!
        </p>
      </div>
    );
  }

  if (screen === 'results') {
    const pct = Math.round((score / (TOTAL_ROUNDS * 10)) * 100);
    const stars = pct >= 90 ? 3 : pct >= 65 ? 2 : pct >= 35 ? 1 : 0;
    return (
      <>
        <Confetti active={stars >= 2} />
        <div className="canvas-page slide-up" style={{ textAlign: 'center' }}>
          <button className="back-btn" onClick={onBack} style={{ marginRight: 'auto' }}>← Back</button>
          <div style={{ fontSize: 90, marginTop: 24 }}>{stars >= 3 ? '🏆🌟' : stars >= 1 ? '🎉🌟' : '💪🌟'}</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--accent-pink)', marginTop: 12 }}>You are a Friendship Hero!</h1>
          <p style={{ fontSize: 18, color: 'var(--text-medium)', marginTop: 8 }}>
            Score: <strong>{score}</strong> · Kind streak: <strong>{streak}</strong>
          </p>
          <div style={{ fontSize: 56, margin: '12px 0' }}>{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>

          {!rated && (
            <button className="btn btn-primary" onClick={() => setShowRating(true)} style={{ marginTop: 12, fontSize: 17, padding: '14px 28px' }}>
              ⭐ Rate this game
            </button>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 18, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-blue" onClick={() => startGame(difficulty)} style={{ fontSize: 16, padding: '14px 24px' }}>🔄 Play Again</button>
            <button className="btn btn-secondary" onClick={() => setScreen('menu')} style={{ fontSize: 16, padding: '14px 24px' }}>📋 Pick Level</button>
            <button className="btn btn-green" onClick={onBack} style={{ fontSize: 16, padding: '14px 24px' }}>🏠 Home</button>
          </div>
        </div>
        {showRating && !rated && (
          <RatingModal activity="friendship-fixer" activityName="Friendship Fixer" activityEmoji="🌟" kidName={kidName}
            onClose={() => { setRated(true); setShowRating(false); }} />
        )}
      </>
    );
  }

  return (
    <div className="canvas-page slide-up" style={{ maxWidth: 720, textAlign: 'center' }}>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title" style={{ justifyContent: 'center', marginBottom: 6 }}>🌟 Friendship Fixer</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-medium)' }}>
        <span><strong style={{ color: 'var(--accent-pink)' }}>{score}</strong> pts</span>
        <span>·</span>
        <span>🌟 streak <strong style={{ color: 'var(--accent-orange)' }}>{streak}</strong></span>
        <span>·</span>
        <span>🏆 <strong>{bestStreak}</strong></span>
        <span>·</span>
        <span>Round <strong style={{ color: 'var(--accent-blue)' }}>{roundCount + 1}</strong>/{TOTAL_ROUNDS}</span>
      </div>

      <div style={{
        background: 'linear-gradient(180deg, #FFF0F8, #FFF8F0)',
        border: '3px solid var(--accent-pink)',
        borderRadius: 18,
        padding: '24px 22px',
        marginBottom: 18,
        boxShadow: 'var(--shadow)',
        maxWidth: 600, margin: '0 auto 18px',
      }}>
        <p style={{ fontSize: 13, color: 'var(--text-medium)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>
          Situation
        </p>
        <p style={{ fontSize: 19, fontWeight: 600, color: 'var(--text-dark)', margin: '0 0 14px', lineHeight: 1.4 }}>
          {round.scenario.situation}
        </p>
        <p style={{ fontSize: 16, fontStyle: 'italic', color: 'var(--accent-pink)', margin: 0 }}>
          {round.scenario.prompt}
        </p>
      </div>

      <div style={{ display: 'grid', gap: 10, maxWidth: 600, margin: '0 auto' }}>
        {round.scenario.choices.map((c, i) => (
          <button key={i} onClick={() => choose(i)} disabled={locked} className="btn"
            style={{
              fontSize: 16, fontWeight: 600,
              padding: '16px 18px',
              background: 'white',
              color: 'var(--text-dark)',
              border: '3px solid #E5E0D8', boxShadow: '0 4px 0 #C5B5A2',
              cursor: locked ? 'default' : 'pointer', opacity: locked ? 0.7 : 1,
              textAlign: 'left', fontFamily: 'Fredoka, sans-serif',
            }}>{c.text}</button>
        ))}
      </div>

      {feedback && (
        <div style={{
          marginTop: 18, padding: '14px 18px', borderRadius: 14,
          textAlign: 'center', fontWeight: 700, fontSize: 16,
          animation: 'pop 0.3s ease',
          background: feedback.kind === 'good' ? 'var(--accent-green)' : '#FEF3C7',
          color: feedback.kind === 'good' ? 'white' : 'var(--text-dark)',
          boxShadow: '0 4px 0 rgba(0,0,0,0.08)',
          maxWidth: 600, margin: '18px auto 0',
        }}>{feedback.text}</div>
      )}

      <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-medium)' }}>
        💡 Before you tap, imagine how the other person feels.
      </p>

      {showRating && !rated && (
        <RatingModal activity="friendship-fixer" activityName="Friendship Fixer" activityEmoji="🌟" kidName={kidName}
          onClose={() => { setRated(true); setShowRating(false); }} />
      )}
    </div>
  );
}
