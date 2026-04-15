'use client';

import { useState } from 'react';
import RatingModal from './RatingModal';

const ANIMALS = ['🦁', '🐯', '🐻', '🦊', '🐰', '🐸', '🦄', '🐙', '🦋', '🐬'];
const LOCATIONS = ['a magical forest', 'a castle made of clouds', 'an underwater kingdom', 'a candy land', 'a rocket ship going to the moon', 'a dinosaur island', 'a pirate ship sailing the seven seas', 'a treehouse village'];
const VILLAINS = ['a grumpy dragon', 'a mischievous witch', 'a sneaky goblin', 'a loud thundercloud', 'a playful octopus', 'a silly robot', 'a lonely moon'];
const THEMES = ['learning to share', 'being brave even when scared', 'helping a friend', 'finding something lost', 'discovering hidden talent', 'making a new friend', 'the power of saying sorry'];

const TEMPLATES = [
  (kid: string, animal: string, loc: string, villain: string, theme: string) =>
`Once upon a time, there was a curious kid named ${kid} who had a very special friend — a ${animal} named Sparkle! 🪄

One bright morning, ${kid} and Sparkle woke up to find a glowing map under their pillow. It led to ${loc}!

"We have to follow it!" said ${kid}.

When they arrived, they met ${villain} who was blocking the path. ${kid} remembered something important that day — the power of ${theme}.

"I know!" said ${kid}. ${kid} shared their snack with ${villain}, and suddenly... the ${villain} smiled for the very first time! 😄

The path opened to a treasure chest filled with golden stars. But the real treasure? ${kid} had made a new friend, and Sparkle had the best adventure ever.

The End. 🌟

⭐ The magic was inside ${kid} all along.`,

  (kid: string, animal: string, loc: string, villain: string, theme: string) =>
`Tonight's bedtime story is about ${kid} and their magical companion, a ${animal} called Moonbeam. 🌙

It all began when ${kid} found a tiny glowing seed in the backyard. They planted it, and it grew into a door that opened to ${loc}!

Inside, they found ${villain} sitting alone. "Why are you sad?" asked ${kid}.

"Because nobody ever plays with me," said ${villain}. ${kid} knew exactly what to do — ${theme} was the answer!

${kid} invited ${villain} to play, and suddenly ${villain} started to dance! 💃

As the stars came out, ${kid} said goodbye to their new friend. "Come back tomorrow!" called ${villain}.

${kid} climbed back through the glowing door, and the ${animal} curled up next to them. "Same time tomorrow?" whispered Moonbeam.

"Promise," said ${kid}. ✨`,

  (kid: string, animal: string, loc: string, villain: string, theme: string) =>
`Are you ready, ${kid}? This one is extra special! 🌟

Once upon a time, ${kid} went on a walk with their best friend, a ${animal} named Thunder. Today was different — Thunder had found a mysterious compass that pointed to ${loc}!

Off they went! But when they arrived, they discovered ${villain} had taken all the rainbow crystals!

"This isn't fair!" said ${kid}. But then they remembered what their mom always said — ${theme}.

So ${kid} sat down next to ${villain} and said, "You seem lonely. Want to be friends?"

${villain}'s eyes went wide. Nobody had ever been kind like that before. 🌈

The crystals sparkle back to life, and ${kid}, Thunder, and their new friend ${villain} watched the most beautiful sunset ever.

And they all lived Happily Ever After. 🐾💛`,
];

export default function StoryMachine({ kidName, onBack }: { kidName: string; onBack: () => void }) {
  const [animal, setAnimal] = useState(ANIMALS[0]);
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [story, setStory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [rated, setRated] = useState(false);
  const [showRating, setShowRating] = useState(false);

  const generate = () => {
    setIsGenerating(true);
    setRated(false);
    setShowRating(false);
    const villain = VILLAINS[Math.floor(Math.random() * VILLAINS.length)];
    const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
    const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
    setTimeout(() => {
      setStory(template(kidName, animal, location, villain, theme));
      setIsGenerating(false);
    }, 1800);
  };

  const pickAnother = () => {
    setStory('');
    setRated(false);
    setShowRating(false);
    generate();
  };

  return (
    <div className="canvas-page slide-up">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h1 className="page-title">📖 Story Machine</h1>
      <p style={{ color: 'var(--text-medium)', marginBottom: 20, fontSize: 15 }}>
        Pick your adventure, and I'll write a special story just for {kidName}!
      </p>

      {!story && (
        <div className="story-form">
          <div className="form-group">
            <label className="form-label">Who is your adventure buddy?</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ANIMALS.map(a => (
                <button
                  key={a}
                  onClick={() => setAnimal(a)}
                  style={{
                    fontSize: 32,
                    padding: '8px 12px',
                    background: animal === a ? 'var(--accent-purple)' : 'white',
                    border: `3px solid ${animal === a ? 'var(--accent-purple)' : '#E5E0D8'}`,
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Where does your adventure take place?</label>
            <select
              className="form-select"
              value={location}
              onChange={e => setLocation(e.target.value)}
            >
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <button
            className="btn btn-primary"
            onClick={generate}
            disabled={isGenerating}
            style={{ fontSize: 20, padding: '16px 32px' }}
          >
            {isGenerating ? '✨ Magic happening...' : `✨ Write My Story!`}
          </button>
        </div>
      )}

      {story && (
        <div className="slide-up">
          <div className="story-output">{story}</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn-purple" onClick={pickAnother}>🔄 Another Story!</button>
            <button className="btn btn-secondary" onClick={() => { setStory(''); setRated(false); }}>
              ✏️ Change Choices
            </button>
            {!rated && (
              <button
                className="btn btn-blue"
                onClick={() => setShowRating(true)}
                style={{ fontSize: 14, padding: '10px 20px' }}
              >
                ⭐ How was your story?
              </button>
            )}
            {rated && (
              <span style={{ fontSize: 14, color: 'var(--accent-green)', fontWeight: 600 }}>
                ✅ Rating submitted!
              </span>
            )}
          </div>
        </div>
      )}

      {story && showRating && (
        <RatingModal
          activity="story-machine"
          activityName="Story Machine"
          activityEmoji="📖"
          kidName={kidName}
          onClose={() => { setShowRating(false); setRated(true); }}
        />
      )}
    </div>
  );
}
