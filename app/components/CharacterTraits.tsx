'use client';

import { useState } from 'react';

// ─── Character Data ───────────────────────────────────────────────────────────

type Trait = { id: string; label: string };

type Character = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  traits: Trait[];
  allTraits: Trait[];
  description: string;
};

const CHARACTERS: Character[] = [
  {
    id: 'cinderella',
    name: 'Cinderella',
    emoji: '👸',
    color: '#FF69B4',
    description: 'The kind and brave princess who never gives up.',
    traits: [
      { id: 'kind', label: 'Kind' },
      { id: 'brave', label: 'Brave' },
      { id: 'grateful', label: 'Grateful' },
    ],
    allTraits: [
      { id: 'kind', label: 'Kind' },
      { id: 'brave', label: 'Brave' },
      { id: 'grateful', label: 'Grateful' },
      { id: 'cruel', label: 'Cruel' },
      { id: 'selfish', label: 'Selfish' },
      { id: 'jealous', label: 'Jealous' },
    ],
  },
  {
    id: 'fairy-godmother',
    name: 'Fairy Godmother',
    emoji: '🪄',
    color: '#9370DB',
    description: 'The magical helper who grants Cinderella\'s wish.',
    traits: [
      { id: 'generous', label: 'Generous' },
      { id: 'magical', label: 'Magical' },
      { id: 'kind', label: 'Kind' },
    ],
    allTraits: [
      { id: 'generous', label: 'Generous' },
      { id: 'magical', label: 'Magical' },
      { id: 'kind', label: 'Kind' },
      { id: 'cruel', label: 'Cruel' },
      { id: 'selfish', label: 'Selfish' },
      { id: 'mean', label: 'Mean' },
    ],
  },
  {
    id: 'stepmother',
    name: 'Stepmother',
    emoji: '😤',
    color: '#8B0000',
    description: 'The mean stepmother who treats Cinderella unfairly.',
    traits: [
      { id: 'cruel', label: 'Cruel' },
      { id: 'selfish', label: 'Selfish' },
      { id: 'mean', label: 'Mean' },
    ],
    allTraits: [
      { id: 'cruel', label: 'Cruel' },
      { id: 'selfish', label: 'Selfish' },
      { id: 'mean', label: 'Mean' },
      { id: 'kind', label: 'Kind' },
      { id: 'brave', label: 'Brave' },
      { id: 'generous', label: 'Generous' },
    ],
  },
  {
    id: 'stepsisters',
    name: 'Stepsisters',
    emoji: '😒',
    color: '#CD5C5C',
    description: 'The stepsisters who are jealous and unkind to Cinderella.',
    traits: [
      { id: 'jealous', label: 'Jealous' },
      { id: 'mean', label: 'Mean' },
      { id: 'selfish', label: 'Selfish' },
    ],
    allTraits: [
      { id: 'jealous', label: 'Jealous' },
      { id: 'mean', label: 'Mean' },
      { id: 'selfish', label: 'Selfish' },
      { id: 'kind', label: 'Kind' },
      { id: 'brave', label: 'Brave' },
      { id: 'helpful', label: 'Helpful' },
    ],
  },
  {
    id: 'prince',
    name: 'The Prince',
    emoji: '🤴',
    color: '#4169E1',
    description: 'The handsome prince who searches for his princess.',
    traits: [
      { id: 'kind', label: 'Kind' },
      { id: 'brave', label: 'Brave' },
      { id: 'charming', label: 'Charming' },
    ],
    allTraits: [
      { id: 'kind', label: 'Kind' },
      { id: 'brave', label: 'Brave' },
      { id: 'charming', label: 'Charming' },
      { id: 'cruel', label: 'Cruel' },
      { id: 'selfish', label: 'Selfish' },
      { id: 'mean', label: 'Mean' },
    ],
  },
  {
    id: 'mice',
    name: 'The Mice',
    emoji: '🐭',
    color: '#A9A9A9',
    description: 'Cinderella\'s tiny friends who help her get ready for the ball.',
    traits: [
      { id: 'helpful', label: 'Helpful' },
      { id: 'friendly', label: 'Friendly' },
      { id: 'brave', label: 'Brave' },
    ],
    allTraits: [
      { id: 'helpful', label: 'Helpful' },
      { id: 'friendly', label: 'Friendly' },
      { id: 'brave', label: 'Brave' },
      { id: 'cruel', label: 'Cruel' },
      { id: 'selfish', label: 'Selfish' },
      { id: 'jealous', label: 'Jealous' },
    ],
  },
];

// ─── Trait Card ───────────────────────────────────────────────────────────────

function TraitCard({ trait, onClick, status }: { trait: Trait; onClick?: () => void; status?: 'correct' | 'wrong' | 'unused' }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-2 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer
        ${status === 'correct' ? 'bg-green-400 text-green-900 scale-95' : ''}
        ${status === 'wrong' ? 'bg-red-400 text-red-900 scale-95' : ''}
        ${status === 'unused' ? 'bg-white border-2 border-purple-200 text-purple-800 hover:border-purple-400 hover:scale-105 hover:shadow-md' : ''}
        ${!status ? 'bg-white border-2 border-purple-200 text-purple-800 hover:border-purple-400 hover:scale-105 hover:shadow-md' : ''}
      `}
    >
      {trait.label}
    </button>
  );
}

// ─── Character Display ───────────────────────────────────────────────────────

function CharacterDisplay({ character }: { character: Character }) {
  const size = 80;
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="rounded-full flex items-center justify-center text-5xl shadow-lg border-4 border-white"
        style={{ background: character.color + '22', width: size + 24, height: size + 24, borderColor: character.color }}
      >
        {character.emoji}
      </div>
      <span className="text-xs font-bold text-gray-700 text-center leading-tight">{character.name}</span>
    </div>
  );
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────

function DropZone({
  label,
  color,
  acceptedTraits,
  correctTraits,
  dropped,
  onDrop,
  emoji,
}: {
  label: string;
  color: string;
  acceptedTraits: string[];
  correctTraits: string[];
  dropped: Trait[];
  onDrop: (trait: Trait) => void;
  emoji: string;
}) {
  const correct = dropped.filter(t => correctTraits.includes(t.id));
  const wrong = dropped.filter(t => !correctTraits.includes(t.id));

  return (
    <div className="flex-1 min-w-0">
      <div
        className="rounded-2xl border-4 border-dashed p-3 min-h-[140px] flex flex-col gap-2 transition-all duration-200"
        style={{ borderColor: color, background: color + '15' }}
      >
        <div className="flex items-center gap-2 justify-center">
          <span className="text-xl">{emoji}</span>
          <span className="font-bold text-sm" style={{ color }}>{label}</span>
          <span className="text-xs bg-white rounded-full px-2 py-0.5 font-bold text-gray-500">{dropped.length}/{acceptedTraits.length}</span>
        </div>

        {dropped.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-gray-400 text-center">Drag traits here</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 justify-center">
            {dropped.map(t => (
              <div
                key={t.id}
                className={`
                  px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 animate-drop-in
                  ${correctTraits.includes(t.id) ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900'}
                `}
              >
                {correctTraits.includes(t.id) ? '✓' : '✗'} {t.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Success Stars ─────────────────────────────────────────────────────────────

function Stars({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? score / max : 0;
  const filled = pct >= 1 ? 3 : pct >= 0.6 ? 2 : pct > 0 ? 1 : 0;
  return (
    <div className="flex gap-1 text-2xl">
      {[1, 2, 3].map(s => (
        <span key={s} className={s <= filled ? 'animate-bounce' : 'opacity-20'}>⭐</span>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CharacterTraits({ onBack }: { onBack: () => void }) {
  const [charIndex, setCharIndex] = useState(0);
  const [round, setRound] = useState(0); // 0 = drop traits, 1 = results shown
  const [droppedGood, setDroppedGood] = useState<Trait[]>([]);
  const [droppedEvil, setDroppedEvil] = useState<Trait[]>([]);
  const [shuffledTraits, setShuffledTraits] = useState<Trait[]>([]);
  const [showIntro, setShowIntro] = useState(true);
  const [finished, setFinished] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [roundScores, setRoundScores] = useState<number[]>([]);

  const character = CHARACTERS[charIndex];

  function startRound() {
    const all = [...character.allTraits];
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    setShuffledTraits(all);
    setDroppedGood([]);
    setDroppedEvil([]);
    setRound(0);
  }

  function handleStart() {
    setShowIntro(false);
    setFinished(false);
    setTotalScore(0);
    setRoundScores([]);
    setCharIndex(0);
    startRound();
  }

  function handleDrop(trait: Trait, zone: 'good' | 'evil') {
    if (zone === 'good') {
      setDroppedGood(prev => [...prev, trait]);
      setShuffledTraits(prev => prev.filter(t => t.id !== trait.id));
    } else {
      setDroppedEvil(prev => [...prev, trait]);
      setShuffledTraits(prev => prev.filter(t => t.id !== trait.id));
    }
  }

  function handleBackToTray(trait: Trait, zone: 'good' | 'evil') {
    if (zone === 'good') {
      setDroppedGood(prev => prev.filter(t => t.id !== trait.id));
      setShuffledTraits(prev => [...prev, trait]);
    } else {
      setDroppedEvil(prev => prev.filter(t => t.id !== trait.id));
      setShuffledTraits(prev => [...prev, trait]);
    }
  }

  function checkAnswers() {
    const goodTraits = droppedGood.filter(t => character.traits.map(x => x.id).includes(t.id));
    const evilTraits = droppedEvil.filter(t => !character.traits.map(x => x.id).includes(t.id));
    const correctGood = droppedGood.filter(t => character.traits.map(x => x.id).includes(t.id));
    const correctEvil = droppedEvil.filter(t => !character.traits.map(x => x.id).includes(t.id));
    const score = correctGood.length + correctEvil.length;
    const max = character.allTraits.length;
    setTotalScore(prev => prev + score);
    setRoundScores(prev => [...prev, score]);
    setRound(1);
  }

  function nextCharacter() {
    if (charIndex < CHARACTERS.length - 1) {
      setCharIndex(prev => prev + 1);
      startRound();
    } else {
      setFinished(true);
    }
  }

  function resetAll() {
    setShowIntro(true);
    setFinished(false);
    setTotalScore(0);
    setRoundScores([]);
    setCharIndex(0);
  }

  // ── Intro Screen ──────────────────────────────────────────────────────────────
  if (showIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-indigo-100 flex flex-col items-center justify-center p-4 gap-6">
        <button onClick={onBack} className="absolute top-4 left-4 bg-white rounded-full px-3 py-1.5 text-sm font-bold shadow">← Back</button>

        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">👸🪄🤴</div>
          <h1 className="text-2xl font-black text-purple-800 mb-2">Character Traits Sorter</h1>
          <p className="text-purple-700 text-sm leading-relaxed">
            Read about a character from Cinderella. Then drag their trait cards to the right bucket — <span className="font-bold">Good</span> or <span className="font-bold">Evil</span>!
          </p>
        </div>

        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-4 flex flex-col gap-4">
          <p className="text-sm font-bold text-gray-600 text-center">Characters you'll meet:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {CHARACTERS.map(c => (
              <div key={c.id} className="flex flex-col items-center gap-1">
                <div className="text-3xl">{c.emoji}</div>
                <span className="text-xs font-bold text-gray-600">{c.name}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleStart}
          className="bg-purple-600 text-white font-black text-lg px-8 py-4 rounded-2xl shadow-xl hover:scale-105 hover:shadow-2xl transition-all"
        >
          Let's Go! 👸
        </button>
      </div>
    );
  }

  // ── Finished Screen ────────────────────────────────────────────────────────────
  if (finished) {
    const maxPossible = CHARACTERS.reduce((sum, c) => sum + c.allTraits.length, 0);
    const total = roundScores.reduce((a, b) => a + b, 0);
    const pct = maxPossible > 0 ? total / maxPossible : 0;
    const stars = pct >= 1 ? 3 : pct >= 0.7 ? 2 : pct >= 0.4 ? 1 : 0;

    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-100 flex flex-col items-center justify-center p-4 gap-6">
        <div className="text-center">
          <div className="text-6xl mb-3">🎉</div>
          <h1 className="text-2xl font-black text-purple-800 mb-2">Amazing Work!</h1>
          <p className="text-purple-700 text-sm">You analyzed all the Cinderella characters!</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
          <p className="text-sm text-gray-500 mb-2">Final Score</p>
          <p className="text-4xl font-black text-purple-800 mb-2">{total} / {maxPossible}</p>
          <div className="flex justify-center gap-1 text-3xl mb-3">
            {[1, 2, 3].map(s => <span key={s} className={s <= stars ? 'animate-bounce' : 'opacity-20'}>⭐</span>)}
          </div>
          <div className="flex justify-center gap-2 flex-wrap">
            {roundScores.map((s, i) => (
              <div key={i} className="bg-purple-100 rounded-full px-3 py-1 text-xs font-bold text-purple-700">
                {CHARACTERS[i]?.emoji} {s}/{CHARACTERS[i]?.allTraits.length}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={resetAll}
          className="bg-purple-600 text-white font-black px-8 py-4 rounded-2xl shadow-xl hover:scale-105 transition-all"
        >
          Play Again! 🔄
        </button>

        <button onClick={onBack} className="text-sm text-purple-600 font-bold">← Back to Home</button>
      </div>
    );
  }

  // ── Game Screen ────────────────────────────────────────────────────────────────
  const allDropped = [...droppedGood, ...droppedEvil];
  const allPlaced = allDropped.length === character.allTraits.length;

  const score = round === 1
    ? [...droppedGood.filter(t => character.traits.map(x => x.id).includes(t.id)), ...droppedEvil.filter(t => !character.traits.map(x => x.id).includes(t.id))].length
    : 0;
  const maxScore = character.allTraits.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-indigo-100 flex flex-col gap-3 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="bg-white rounded-full px-3 py-1.5 text-sm font-bold shadow">← Back</button>
        <div className="text-xs font-bold text-purple-600 bg-purple-100 rounded-full px-3 py-1">
          {charIndex + 1} / {CHARACTERS.length}
        </div>
        <Stars score={totalScore + (round === 1 ? score : 0)} max={charIndex * maxScore + maxScore} />
      </div>

      {/* Character */}
      <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col items-center gap-2">
        <div className="text-xs font-bold text-purple-500 uppercase tracking-wider">Who is this?</div>
        <CharacterDisplay character={character} />
        <p className="text-sm text-gray-600 text-center italic">"{character.description}"</p>
      </div>

      {/* Instruction */}
      <div className="text-center">
        <p className="text-sm font-bold text-purple-700">
          {round === 0
            ? `Drag the traits to the right bucket — 👑 Good or 👿 Evil!`
            : `You found ${score} out of ${maxScore} traits correctly!`}
        </p>
      </div>

      {/* Trait Cards (left to place) */}
      {round === 0 && shuffledTraits.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md p-3">
          <div className="text-xs font-bold text-gray-400 mb-2 text-center">Traits to sort</div>
          <div className="flex flex-wrap gap-2 justify-center">
            {shuffledTraits.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  // Tap to choose which bucket
                  const container = document.getElementById('trait-tray');
                  const containerRect = container?.getBoundingClientRect();
                  // Just toggle into good by default on tap
                  handleDrop(t, 'good');
                }}
                className="px-3 py-2 rounded-xl font-bold text-sm bg-purple-50 border-2 border-purple-200 text-purple-800 hover:border-purple-400 hover:scale-105 hover:shadow-sm transition-all cursor-pointer"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Instruction for placed traits */}
      {round === 0 && allPlaced && (
        <button
          onClick={checkAnswers}
          className="bg-green-500 text-white font-black py-3 rounded-2xl shadow-xl hover:scale-105 transition-all"
        >
          Check Answers ✓
        </button>
      )}

      {/* Drop Zones */}
      <div className="flex gap-3">
        <DropZone
          label="👑 Good"
          color="#16A34A"
          acceptedTraits={character.traits.map(t => t.id)}
          correctTraits={character.traits.map(t => t.id)}
          dropped={droppedGood}
          onDrop={t => handleDrop(t, 'good')}
          emoji="👑"
        />
        <DropZone
          label="👿 Evil"
          color="#DC2626"
          acceptedTraits={character.allTraits.filter(t => !character.traits.map(x => x.id).includes(t.id)).map(t => t.id)}
          correctTraits={character.allTraits.filter(t => !character.traits.map(x => x.id).includes(t.id)).map(t => t.id)}
          dropped={droppedEvil}
          onDrop={t => handleDrop(t, 'evil')}
          emoji="👿"
        />
      </div>

      {/* Placed traits in trays — click to return */}
      {round === 0 && (droppedGood.length > 0 || droppedEvil.length > 0) && (
        <div className="bg-white rounded-2xl shadow-md p-3">
          <div className="text-xs font-bold text-gray-400 mb-2 text-center">Tap a trait to move it back</div>
          <div className="flex flex-wrap gap-2 justify-center">
            {droppedGood.map(t => (
              <button
                key={t.id}
                onClick={() => handleBackToTray(t, 'good')}
                className="px-3 py-2 rounded-xl font-bold text-sm bg-green-100 border-2 border-green-300 text-green-800 hover:scale-105 transition-all cursor-pointer"
              >
                {t.label} ↩
              </button>
            ))}
            {droppedEvil.map(t => (
              <button
                key={t.id}
                onClick={() => handleBackToTray(t, 'evil')}
                className="px-3 py-2 rounded-xl font-bold text-sm bg-red-100 border-2 border-red-300 text-red-800 hover:scale-105 transition-all cursor-pointer"
              >
                {t.label} ↩
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {round === 1 && (
        <div className="flex flex-col gap-3">
          <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
            <div className="text-3xl mb-1">⭐ {score}/{maxScore}</div>
            <p className="text-sm text-gray-600">
              {score === maxScore ? 'Perfect! You nailed every trait!' :
               score >= maxScore * 0.6 ? 'Great job! Keep learning!' :
               'Keep practicing — you\'ll get faster!'}
            </p>
          </div>

          <button
            onClick={nextCharacter}
            className="bg-purple-600 text-white font-black py-3 rounded-2xl shadow-xl hover:scale-105 transition-all"
          >
            {charIndex < CHARACTERS.length - 1 ? `Next Character →` : 'See Final Score 🎉'}
          </button>
        </div>
      )}

      <style jsx global>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce { animation: bounce 0.5s ease infinite; }
        .animate-drop-in { animation: dropIn 0.2s ease; }
        @keyframes dropIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
