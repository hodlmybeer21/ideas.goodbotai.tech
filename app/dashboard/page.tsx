'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface OverallEntry {
  date: string;
  name: string;
  rating: number;
}

interface ActivityEntry {
  date: string;
  name: string;
  activity: string;
  rating: number;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium';
  added: string;
}

const ACTIVITIES: Record<string, { name: string; emoji: string; color: string; bestKey: string }> = {
  'magic-canvas':  { name: 'Magic Canvas',         emoji: '🎨',   color: 'var(--accent-pink)',    bestKey: '' },
  'story-machine':  { name: 'Story Machine',          emoji: '📖',   color: 'var(--accent-purple)', bestKey: '' },
  'animal-match':  { name: 'Animal Match',            emoji: '🧩',   color: 'var(--accent-yellow)', bestKey: '' },
  'sound-lab':      { name: 'Sound Lab',              emoji: '🎵',   color: 'var(--accent-orange)', bestKey: '' },
  'math-lab':       { name: 'Math Lab',               emoji: '🧮',   color: 'var(--accent-pink)',    bestKey: '' },
  'mad-libs':       { name: 'Mad Libs',               emoji: '📝',   color: 'var(--accent-yellow)', bestKey: 'goodbotkids_madlibs_count' },
  'readalong':      { name: 'Read Along',             emoji: '📖',   color: 'var(--accent-purple)', bestKey: '' },
  'tell-time':      { name: 'Tell Time',              emoji: '🕐',   color: 'var(--accent-blue)',    bestKey: 'telltime_best_easy' },
  'is-the-robot-right': { name: 'Is the Robot Right?', emoji: '🤖', color: 'var(--accent-purple)', bestKey: 'robotright_best_easy' },
  'true-or-false':  { name: 'True or False?',         emoji: '✅❌', color: 'var(--accent-green)',  bestKey: 'truefalse_best_easy' },
  'sentence-builder': { name: 'Sentence Builder',    emoji: '📝',   color: 'var(--accent-yellow)', bestKey: 'sentencebuilder_best_easy' },
  'bug-catcher': { name: 'Bug Catcher',           emoji: '🐛',   color: 'var(--accent-blue)',    bestKey: 'bugcatcher_best_streak' },
  'bunny-hop': { name: 'Bunny Hop Counting',  emoji: '🐰',   color: 'var(--accent-orange)', bestKey: 'bunnyhop_best_streak' },
  'photo-frame-maker': { name: 'Photo Frame Maker', emoji: '🖼️', color: 'var(--accent-purple)', bestKey: 'photoframemaker_best_count' },
  'mirror-draw': { name: 'Mirror Draw', emoji: '🪞', color: 'var(--accent-blue)', bestKey: 'mirrordraw_best_score' },
  'number-bingo': { name: 'Number Bingo', emoji: '🎯', color: 'var(--accent-green)', bestKey: 'numberbingo_best' },
  'beat-composer': { name: 'Beat Composer', emoji: '🎵', color: 'var(--accent-orange)', bestKey: 'beatcomposer_count' },
  // 2nd Grade additions — 2026-08-29 back-to-school batch
  'two-digit-sprint': { name: 'Two-Digit Sprint', emoji: '🏃', color: 'var(--accent-pink)', bestKey: 'twodigit_best_streak' },
  'borrow-bay': { name: 'Borrow Bay', emoji: '🏴‍☠️', color: 'var(--accent-orange)', bestKey: 'borrowbay_best_streak' },
  'time-to-five': { name: 'Time to 5', emoji: '⏰', color: 'var(--accent-blue)', bestKey: 'timeto5_best_streak' },
  'equal-groups': { name: 'Equal Groups', emoji: '🍪', color: 'var(--accent-pink)', bestKey: 'equalgroups_best_streak' },
  'contraction-coop': { name: 'Contraction Co-op', emoji: '🤝', color: 'var(--accent-purple)', bestKey: 'contraction_best_streak' },
  'compound-forge': { name: 'Compound Word Forge', emoji: '⚒️', color: 'var(--accent-orange)', bestKey: 'compound_best_streak' },
  'skip-counter': { name: 'Skip Counter', emoji: '🏃', color: 'var(--accent-blue)', bestKey: 'skipcount_best_streak' },
  'suffix-sorter': { name: 'Suffix Sorter', emoji: '✏️', color: 'var(--accent-purple)', bestKey: 'suffixsort_best_streak' },
  // Feelings track — 2026-08-29 social-emotional learning batch
  'feelings-match': { name: 'Feelings Match', emoji: '🤝', color: 'var(--accent-pink)', bestKey: 'feelings_best_streak' },
  'friendship-fixer': { name: 'Friendship Fixer', emoji: '🌟', color: 'var(--accent-pink)', bestKey: 'friendfixer_best_streak' },
  'mood-wheel': { name: 'Mood Wheel', emoji: '😊', color: 'var(--accent-yellow)', bestKey: 'moodwheel_count' },
  'conversation-starters': { name: 'Conversation Starters', emoji: '🗣️', color: 'var(--accent-purple)', bestKey: 'convstarters_count' },
  'kind-word-bingo': { name: 'Kind Word Bingo', emoji: '💬', color: 'var(--accent-green)', bestKey: 'kindbingo_best_streak' },
  // 2nd Grade back-to-school 2026 expansion — math + ELA additions
  'shape-safari': { name: 'Shape Safari', emoji: '🦒', color: 'var(--accent-green)', bestKey: 'shapesafari_best_streak' },
  'odd-even-oasis': { name: 'Odd-Even Oasis', emoji: '🐫', color: 'var(--accent-orange)', bestKey: 'oddeven_best_streak' },
  'compare-castles': { name: 'Compare Castles', emoji: '🏰', color: 'var(--accent-purple)', bestKey: 'comparecastles_best_streak' },
  'time-travel': { name: 'Time Travel', emoji: '⏳', color: 'var(--accent-blue)', bestKey: 'timetravel_best_streak' },
  'triple-digit-treasure': { name: 'Triple-Digit Treasure', emoji: '💎', color: 'var(--accent-pink)', bestKey: 'tripledigit_best_streak' },
  'array-architect': { name: 'Array Architect', emoji: '🏗️', color: 'var(--accent-orange)', bestKey: 'arrayarchitect_best_streak' },
  'hundreds-hide-seek': { name: 'Hundreds Hide & Seek', emoji: '🔍', color: 'var(--accent-purple)', bestKey: 'hundreds_best_streak' },
  'prefix-pals': { name: 'Prefix Pals', emoji: '🔑', color: 'var(--accent-blue)', bestKey: 'prefixpals_best_streak' },
  'plural-puzzlers': { name: 'Plural Puzzlers', emoji: '🧩', color: 'var(--accent-green)', bestKey: 'pluralpuzzlers_best_streak' },
  'context-clue-cove': { name: 'Context Clue Cove', emoji: '🔎', color: 'var(--accent-purple)', bestKey: 'contextcluecove_best_streak' },
  'comma-crew': { name: 'Comma Crew', emoji: '✉️', color: 'var(--accent-pink)', bestKey: 'commacrew_best_streak' },
  'conjunction-junction': { name: 'Conjunction Junction', emoji: '🚂', color: 'var(--accent-blue)', bestKey: 'conjunctionjunction_best_streak' },
  'poetry-park': { name: 'Poetry Park', emoji: '🎭', color: 'var(--accent-purple)', bestKey: 'poetrypark_best_streak' },
  // Cross-curricular science + social studies (2026-08-29)
  'earth-explorer': { name: 'Earth Explorer', emoji: '🌍', color: 'var(--accent-green)', bestKey: 'earthexplorer_best_streak' },
  'matter-mixer': { name: 'Matter Mixer', emoji: '🧪', color: 'var(--accent-purple)', bestKey: 'mattermixer_best_streak' },
};

export default function Dashboard() {
  const [overall, setOverall] = useState<OverallEntry[]>([]);
  const [activityRatings, setActivityRatings] = useState<ActivityEntry[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('goodbotkids_feedback');
      if (saved) setOverall(JSON.parse(saved));

      const saved2 = localStorage.getItem('goodbotkids_ratings_v2');
      if (saved2) setActivityRatings(JSON.parse(saved2));
    } catch {}

    setSuggestions([
      {
        id: '1',
        title: '🎨 Add a "Save & Name It" feature to drawing',
        description: 'Kids want to save drawings and give them names. Add a name input and gallery of saved drawings.',
        priority: 'high',
        added: '2026-04-15',
      },
      {
        id: '2',
        title: '🎵 Add a music/sound maker',
        description: 'Ages 4-6 respond strongly to audio. A simple drum machine or sound mixer would score high.',
        priority: 'high',
        added: '2026-04-15',
      },
      {
        id: '3',
        title: '🦊 More animal options in Story Machine',
        description: 'Expand animal pool to 20+. Kids will want their specific favorite animal.',
        priority: 'medium',
        added: '2026-04-15',
      },
      {
        id: '4',
        title: '🌙 Add a "Goodnight" screen to Story Machine',
        description: 'Soft animation, calming music option, and a sleep timer. Helps wind-down routine.',
        priority: 'medium',
        added: '2026-04-15',
      },
    ]);
  }, []);

  if (!mounted) return null;

  // Per-activity averages
  const activityAvgs: Record<string, { avg: string; count: number; trend: number; best: number }> = {};
  Object.keys(ACTIVITIES).forEach(key => {
    const rows = activityRatings.filter(r => r.activity === key);
    const act = ACTIVITIES[key];
    // Best score from localStorage (for scoring activities)
    let best = 0;
    if (act.bestKey) {
      try {
        const saved = localStorage.getItem(act.bestKey);
        if (saved) best = parseInt(saved, 10) || 0;
      } catch {}
    }
    if (rows.length > 0) {
      const avg = rows.reduce((s, r) => s + r.rating, 0) / rows.length;
      const recent = rows.slice(0, 3);
      const recentAvg = recent.reduce((s, r) => s + r.rating, 0) / recent.length;
      const trend = rows.length >= 3 ? recentAvg - avg : 0;
      activityAvgs[key] = { avg: avg.toFixed(1), count: rows.length, trend, best };
    } else {
      activityAvgs[key] = { avg: '—', count: 0, trend: 0, best };
    }
  });

  // Overall stats
  const overallAvg = overall.length > 0
    ? (overall.reduce((s, f) => s + f.rating, 0) / overall.length).toFixed(1)
    : null;

  const kids = [...new Set([...overall.map(f => f.name), ...activityRatings.map(r => r.name)])];

  return (
    <div className="dashboard-page slide-up">
      <Link href="/" className="back-btn">← Back to Kids Site</Link>

      <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-pink)', marginBottom: 6 }}>
        🤖 GoodBot Kids — Parent Dashboard
      </h1>
      <p style={{ color: 'var(--text-medium)', marginBottom: 24, fontSize: 14 }}>
        Per-activity feedback from your kids. Updated after each session.
      </p>

      {/* Per-activity scores */}
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>🏆 Activity Scores</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {Object.entries(ACTIVITIES).map(([key, act]) => {
          const data = activityAvgs[key];
          return (
            <div key={key} style={{
              background: 'white', borderRadius: 16, padding: 20, textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: `3px solid ${act.color}33`,
            }}>
              <div style={{ fontSize: 36, marginBottom: 4 }}>{act.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-medium)', marginBottom: 8 }}>{act.name}</div>
              {data.avg !== '—' ? (
                <>
                  {data.best > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text-medium)', marginBottom: 2 }}>
                      🏆 Best: {data.best}/10
                    </div>
                  )}
                  <div style={{ fontSize: 32, fontWeight: 800, color: act.color }}>{data.avg}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-medium)' }}>out of 10</div>
                  <div style={{ fontSize: 11, color: 'var(--text-medium)', marginTop: 4 }}>
                    {data.count} rating{data.count !== 1 ? 's' : ''}
                    {data.trend !== 0 && (
                      <span style={{ color: data.trend > 0 ? 'var(--accent-green)' : 'var(--accent-pink)', marginLeft: 4 }}>
                        {data.trend > 0 ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {data.best > 0 ? (
                    <>
                      <div style={{ fontSize: 11, color: 'var(--text-medium)', marginBottom: 2 }}>🏆 Best score</div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: act.color }}>{data.best}/10</div>
                      <div style={{ fontSize: 11, color: 'var(--text-medium)' }}>No ratings yet</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 24, color: '#CBD5E1' }}>—</div>
                      <div style={{ fontSize: 11, color: '#CBD5E1)' }}>No data yet</div>
                    </>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Overall stats */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-box">
          <div className="stat-number">{overallAvg ?? '—'}</div>
          <div className="stat-label">Overall session avg</div>
        </div>
        <div className="stat-box">
          <div className="stat-number" style={{ color: 'var(--accent-blue)' }}>{activityRatings.length}</div>
          <div className="stat-label">Activity ratings total</div>
        </div>
        <div className="stat-box">
          <div className="stat-number" style={{ color: 'var(--accent-purple)' }}>{kids.join(', ') || '—'}</div>
          <div className="stat-label">Kids using site</div>
        </div>
      </div>

      {/* Per-activity rating history */}
      <div className="dashboard-card">
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>📋 Activity Rating History</h2>
        {activityRatings.length === 0 ? (
          <p style={{ color: 'var(--text-medium)', fontSize: 14 }}>
            No activity ratings yet. Once your kids complete activities, ratings will appear here!
          </p>
        ) : (
          <div className="feedback-list">
            {activityRatings.slice(0, 25).map((r, i) => {
              const act = ACTIVITIES[r.activity];
              return (
                <div key={i} className="feedback-item">
                  <div>
                    <span style={{ fontSize: 20, marginRight: 6 }}>{act?.emoji ?? '❓'}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-medium)', marginLeft: 8 }}>
                      {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-medium)' }}>{act?.name ?? r.activity}</span>
                    <span style={{ fontSize: 18, color: 'var(--accent-yellow)' }}>
                      {'⭐'.repeat(r.rating)} <span style={{ color: 'var(--text-medium)', fontSize: 13 }}>{r.rating}/10</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* GoodBot's suggestions */}
      <div className="dashboard-card">
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>💡 GoodBot&apos;s Improvement Plan</h2>
        <p style={{ fontSize: 13, color: 'var(--text-medium)', marginBottom: 16 }}>
          Based on kid feedback patterns, ages 4-7, and engagement research.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {suggestions.map(s => (
            <div key={s.id} style={{
              padding: '14px 16px', borderRadius: 12,
              background: s.priority === 'high' ? '#FFF0F4' : 'var(--bg-primary)',
              border: `2px solid ${s.priority === 'high' ? 'var(--accent-pink)' : '#E5E0D8'}`,
            }}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-medium)', lineHeight: 1.5 }}>{s.description}</div>
              <div style={{ fontSize: 11, color: 'var(--accent-green)', marginTop: 6, fontWeight: 600 }}>
                Added {s.added} · Priority: {s.priority}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: '12px 16px', background: '#F0FFF4', borderRadius: 12, border: '2px solid var(--accent-green)' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent-green)', marginBottom: 4 }}>
            🤖 Next session: I will research the highest-rated kids learning apps ages 4-7 and plan v2 features.
          </div>
        </div>
      </div>
    </div>
  );
}
