'use client';

import { useState, useEffect, useCallback } from 'react';
import RatingModal from './RatingModal';

// ─── Types ────────────────────────────────────────────────────────────────────

type Direction = 'up' | 'right' | 'down' | 'left';
type Mode = 'easy' | 'hard';

interface Command {
  id: string;
  label: string;
  icon: string;
  color: string;
}

interface Level {
  gridCols: number;
  gridRows: number;
  botStart: { x: number; y: number };
  goal: { x: number; y: number };
  walls: { x: number; y: number }[];
  minCommands: number; // for 3-star rating
  maxCommands: number;
}

interface Position {
  x: number;
  y: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COMMANDS_EASY: Command[] = [
  { id: 'forward',   label: 'Forward',   icon: '↑', color: '#3B82F6' },
  { id: 'turnRight', label: 'Turn Right', icon: '↻', color: '#F59E0B' },
  { id: 'turnLeft',  label: 'Turn Left',  icon: '↺', color: '#F97316' },
];

const COMMANDS_HARD: Command[] = [
  { id: 'forward',   label: 'Forward',    icon: '↑', color: '#3B82F6' },
  { id: 'turnRight', label: 'Turn Right',  icon: '↻', color: '#F59E0B' },
  { id: 'turnLeft',  label: 'Turn Left',   icon: '↺', color: '#F97316' },
];

const EASY_LEVELS: Level[] = [
  {
    gridCols: 3, gridRows: 4,
    botStart: { x: 0, y: 0 },
    goal: { x: 1, y: 0 },
    walls: [],
    minCommands: 1, maxCommands: 4,
  },
  {
    gridCols: 3, gridRows: 4,
    botStart: { x: 0, y: 0 },
    goal: { x: 2, y: 0 },
    walls: [],
    minCommands: 2, maxCommands: 4,
  },
  {
    gridCols: 3, gridRows: 4,
    botStart: { x: 0, y: 0 },
    goal: { x: 1, y: 1 },
    walls: [],
    minCommands: 3, maxCommands: 4,
  },
  {
    gridCols: 3, gridRows: 4,
    botStart: { x: 0, y: 0 },
    goal: { x: 2, y: 1 },
    walls: [],
    minCommands: 4, maxCommands: 4,
  },
];

const HARD_LEVELS: Level[] = [
  {
    gridCols: 5, gridRows: 5,
    botStart: { x: 0, y: 0 },
    goal: { x: 2, y: 0 },
    walls: [],
    minCommands: 2, maxCommands: 8,
  },
  {
    gridCols: 5, gridRows: 5,
    botStart: { x: 0, y: 0 },
    goal: { x: 4, y: 0 },
    walls: [{ x: 2, y: 0 }],
    minCommands: 4, maxCommands: 8,
  },
  {
    gridCols: 5, gridRows: 5,
    botStart: { x: 0, y: 2 },
    goal: { x: 4, y: 2 },
    walls: [{ x: 2, y: 2 }, { x: 3, y: 2 }],
    minCommands: 5, maxCommands: 8,
  },
  {
    gridCols: 5, gridRows: 5,
    botStart: { x: 0, y: 0 },
    goal: { x: 4, y: 4 },
    walls: [{ x: 1, y: 1 }, { x: 3, y: 2 }, { x: 2, y: 3 }],
    minCommands: 8, maxCommands: 8,
  },
];

const DIRECTION_ORDER: Direction[] = ['up', 'right', 'down', 'left'];
const GRID_CELL = 64; // px per cell

// ─── Helpers ───────────────────────────────────────────────────────────────────

function directionDelta(dir: Direction): Position {
  switch (dir) {
    case 'up':    return { x: 0,  y: -1 };
    case 'right': return { x: 1,  y:  0 };
    case 'down':  return { x: 0,  y:  1 };
    case 'left':  return { x: -1, y:  0 };
  }
}

function rotateDir(dir: Direction, turn: 'right' | 'left'): Direction {
  const i = DIRECTION_ORDER.indexOf(dir);
  const delta = turn === 'right' ? 1 : -1;
  return DIRECTION_ORDER[(i + delta + 4) % 4];
}

function calcNextPosition(pos: Position, dir: Direction): Position {
  const delta = directionDelta(dir);
  return { x: pos.x + delta.x, y: pos.y + delta.y };
}

function isWall(x: number, y: number, walls: Level['walls']): boolean {
  return walls.some(w => w.x === x && w.y === y);
}

function isGoal(pos: Position, goal: Position): boolean {
  return pos.x === goal.x && pos.y === goal.y;
}

function isOutOfBounds(pos: Position, cols: number, rows: number): boolean {
  return pos.x < 0 || pos.x >= cols || pos.y < 0 || pos.y >= rows;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CodeBots({ onBack, kidName }: { onBack: () => void; kidName: string }) {
  const [showIntro, setShowIntro]       = useState(true);
  const [selectedMode, setSelectedMode] = useState<Mode>('easy');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [sequence, setSequence]         = useState<string[]>([]);
  const [isRunning, setIsRunning]       = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [botPosition, setBotPosition]   = useState<Position>({ x: 0, y: 0 });
  const [botDirection, setBotDirection] = useState<Direction>('right');
  const [showSuccess, setShowSuccess]   = useState(false);
  const [starsEarned, setStarsEarned]   = useState(0);
  const [rated, setRated]               = useState(false);
  const [failed, setFailed]            = useState(false);

  const levels = selectedMode === 'easy' ? EASY_LEVELS : HARD_LEVELS;
  const level  = levels[currentLevel];
  const commands = selectedMode === 'easy' ? COMMANDS_EASY : COMMANDS_HARD;
  const maxSeq  = level.maxCommands;

  const resetLevel = useCallback(() => {
    setSequence([]);
    setIsRunning(false);
    setCurrentStepIndex(-1);
    setBotPosition({ ...level.botStart });
    setBotDirection('right');
    setShowSuccess(false);
    setStarsEarned(0);
    setFailed(false);
  }, [level]);

  useEffect(() => { resetLevel(); }, [selectedMode, currentLevel, resetLevel]);

  const handleCommand = (cmdId: string) => {
    if (isRunning || showSuccess) return;
    if (sequence.length >= maxSeq) return;
    setSequence(prev => [...prev, cmdId]);
  };

  const handleClear = () => {
    if (isRunning) return;
    setSequence([]);
    setCurrentStepIndex(-1);
  };

  const handleRun = () => {
    if (isRunning || sequence.length === 0) return;
    setIsRunning(true);
    setCurrentStepIndex(0);
    setBotPosition({ ...level.botStart });
    setBotDirection('right');
    setShowSuccess(false);
    setFailed(false);
  };

  // Step-by-step execution
  useEffect(() => {
    if (!isRunning) return;
    if (currentStepIndex < 0) return;

    const timer = setTimeout(() => {
      if (currentStepIndex >= sequence.length) {
        // Done — check win
        setIsRunning(false);
        setCurrentStepIndex(-1);
        if (isGoal(botPosition, level.goal)) {
          setShowSuccess(true);
          const stars = sequence.length <= level.minCommands
            ? 3
            : sequence.length <= level.minCommands + 2
            ? 2
            : 1;
          setStarsEarned(stars);
        } else {
          setFailed(true);
        }
        return;
      }

      const cmdId = sequence[currentStepIndex];
      let newPos: Position = { ...botPosition };

      if (cmdId === 'forward') {
        newPos = calcNextPosition(botPosition, botDirection);
        if (isOutOfBounds(newPos, level.gridCols, level.gridRows) ||
            isWall(newPos.x, newPos.y, level.walls)) {
          // Hit wall / boundary — fail
          setIsRunning(false);
          setCurrentStepIndex(-1);
          setFailed(true);
          return;
        }
        setBotPosition(newPos);
      } else if (cmdId === 'turnRight') {
        setBotDirection(rotateDir(botDirection, 'right'));
      } else if (cmdId === 'turnLeft') {
        setBotDirection(rotateDir(botDirection, 'left'));
      }

      setCurrentStepIndex(prev => prev + 1);
    }, 500);

    return () => clearTimeout(timer);
  }, [isRunning, currentStepIndex, sequence, botPosition, botDirection, level]);

  const handleNextLevel = () => {
    if (currentLevel < levels.length - 1) {
      setCurrentLevel(prev => prev + 1);
    } else {
      // All levels done — go back to mode select
      setShowIntro(true);
      setCurrentLevel(0);
    }
  };

  const handleRetry = () => {
    resetLevel();
  };

  // ─── Render helpers ─────────────────────────────────────────────────────────

  const renderCell = (x: number, y: number) => {
    const isBot   = botPosition.x === x && botPosition.y === y;
    const isGoal  = level.goal.x === x && level.goal.y === y;
    const isWall  = level.walls.some(w => w.x === x && w.y === y);
    const isStart = level.botStart.x === x && level.botStart.y === y;

    let bg = 'white';
    if (isWall)  bg = '#374151';
    else if (isGoal) bg = '#6BCB77';
    else if ((x + y) % 2 === 0) bg = '#F8F8F4';

    const rotation: Record<Direction, number> = {
      up: 0, right: 90, down: 180, left: 270,
    };
    const rot = rotation[botDirection];

    return (
      <div
        key={`${x}-${y}`}
        style={{
          width: GRID_CELL,
          height: GRID_CELL,
          background: bg,
          border: '1.5px solid #E5E0D8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'background 0.2s',
          boxShadow: isGoal ? '0 0 12px #6BCB77' : undefined,
        }}
      >
        {isGoal && !isBot && (
          <span style={{ fontSize: 28 }}>⭐</span>
        )}
        {isBot && (
          <span style={{
            fontSize: 36,
            transform: `rotate(${rot}deg)`,
            transition: 'transform 0.3s ease',
            display: 'inline-block',
          }}>
            🤖
          </span>
        )}
      </div>
    );
  };

  const starsDisplay = (n: number) => '⭐'.repeat(n) + '☆'.repeat(3 - n);

  // ─── Intro screen ───────────────────────────────────────────────────────────

  if (showIntro) {
    return (
      <div className="canvas-page slide-up">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1 className="page-title">🤖 CodeBots</h1>
        <p style={{ fontSize: 16, color: 'var(--text-medium)', marginBottom: 24 }}>
          Program your robot to reach the star! Choose your difficulty:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <button
            className="btn btn-blue"
            style={{ fontSize: 18, padding: '20px 32px', borderRadius: 20 }}
            onClick={() => { setSelectedMode('easy'); setShowIntro(false); setCurrentLevel(0); }}
          >
            🌟 Easy — Ages 4–5
            <div style={{ fontSize: 13, marginTop: 4, opacity: 0.8 }}>
              3×4 grid · 3 commands · 4 levels
            </div>
          </button>
          <button
            className="btn btn-purple"
            style={{ fontSize: 18, padding: '20px 32px', borderRadius: 20 }}
            onClick={() => { setSelectedMode('hard'); setShowIntro(false); setCurrentLevel(0); }}
          >
            🚀 Hard — Ages 6–7
            <div style={{ fontSize: 13, marginTop: 4, opacity: 0.8 }}>
              5×5 grid · Walls · 8 commands · 4 levels
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ─── Main game ──────────────────────────────────────────────────────────────

  return (
    <>
      <div className="canvas-page slide-up">
        <button className="back-btn" onClick={onBack}>← Back</button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h1 className="page-title">🤖 CodeBots</h1>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-medium)', background: 'var(--bg-primary)', padding: '4px 12px', borderRadius: 20 }}>
            {selectedMode === 'easy' ? '🌟 Easy' : '🚀 Hard'} · Level {currentLevel + 1}/{levels.length}
          </span>
        </div>

        {/* Stars earned */}
        {starsEarned > 0 && (
          <div style={{ fontSize: 20, marginBottom: 8, color: 'var(--accent-yellow)' }}>
            {starsDisplay(starsEarned)} — {starsEarned === 3 ? 'Perfect!' : starsEarned === 2 ? 'Great job!' : 'You tried!'}
          </div>
        )}

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${level.gridCols}, ${GRID_CELL}px)`,
          gap: 0,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          marginBottom: 16,
          width: 'fit-content',
        }}>
          {Array.from({ length: level.gridRows }, (_, y) =>
            Array.from({ length: level.gridCols }, (_, x) => renderCell(x, y))
          ).flat()}
        </div>

        {/* Command palette */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          {commands.map(cmd => (
            <button
              key={cmd.id}
              onClick={() => handleCommand(cmd.id)}
              disabled={isRunning || showSuccess || sequence.length >= maxSeq}
              style={{
                background: cmd.color,
                color: 'white',
                border: 'none',
                borderRadius: 14,
                padding: '10px 16px',
                fontSize: 15,
                fontWeight: 700,
                fontFamily: 'Fredoka, sans-serif',
                cursor: isRunning || showSuccess || sequence.length >= maxSeq ? 'not-allowed' : 'pointer',
                opacity: isRunning || showSuccess || sequence.length >= maxSeq ? 0.5 : 1,
                minWidth: 60,
                minHeight: 48,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 18 }}>{cmd.icon}</span>
              {cmd.label}
            </button>
          ))}
        </div>

        {/* Sequence stack */}
        <div style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          minHeight: 52,
          marginBottom: 12,
          alignItems: 'center',
          background: '#F1F5F9',
          borderRadius: 12,
          padding: '8px 12px',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-medium)', fontWeight: 600, marginRight: 4 }}>
            Program:
          </span>
          {sequence.length === 0 ? (
            <span style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>
              Tap commands above to add them...
            </span>
          ) : (
            sequence.map((cmdId, i) => {
              const cmd = commands.find(c => c.id === cmdId)!;
              return (
                <span
                  key={i}
                  style={{
                    background: cmd.color,
                    color: 'white',
                    borderRadius: 10,
                    padding: '6px 12px',
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: 'Fredoka, sans-serif',
                    border: i === currentStepIndex ? '3px solid #1F2937' : '3px solid transparent',
                    boxShadow: i === currentStepIndex ? '0 0 8px rgba(0,0,0,0.4)' : undefined,
                    transition: 'border 0.2s, box-shadow 0.2s',
                  }}
                >
                  {cmd.icon}
                </span>
              );
            })
          )}
          {sequence.length >= maxSeq && (
            <span style={{ fontSize: 12, color: 'var(--accent-pink)', fontWeight: 700 }}>
              Max {maxSeq}!
            </span>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <button
            className="btn btn-gray"
            onClick={handleClear}
            disabled={isRunning}
            style={{ fontSize: 15 }}
          >
            🗑️ Clear
          </button>
          <button
            className="btn btn-green"
            onClick={handleRun}
            disabled={isRunning || sequence.length === 0}
            style={{ fontSize: 15, minWidth: 100 }}
          >
            ▶️ RUN
          </button>
        </div>

        {/* Status messages */}
        {showSuccess && (
          <div style={{
            background: '#F0FFF4',
            border: '3px solid var(--accent-green)',
            borderRadius: 16,
            padding: '16px 20px',
            textAlign: 'center',
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-green)' }}>
              You did it, {kidName}!
            </div>
            <div style={{ fontSize: 16, color: 'var(--text-medium)', marginBottom: 12 }}>
              {starsDisplay(starsEarned)} earned!
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-blue" onClick={handleRetry}>🔄 Try Again</button>
              <button className="btn btn-green" onClick={handleNextLevel}>
                {currentLevel < levels.length - 1 ? '➡️ Next Level' : '🎊 All Done!'}
              </button>
            </div>
          </div>
        )}

        {failed && !showSuccess && (
          <div style={{
            background: '#FFF0F4',
            border: '3px solid var(--accent-pink)',
            borderRadius: 16,
            padding: '16px 20px',
            textAlign: 'center',
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🤖💔</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-pink)', marginBottom: 4 }}>
              Oops! Try again!
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-medium)', marginBottom: 12 }}>
              Your robot didn&apos;t reach the star. Change your commands and try again!
            </div>
            <button className="btn btn-blue" onClick={handleRetry}>🔄 Try Again</button>
          </div>
        )}

        {/* Level select */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          {levels.map((_, i) => (
            <button
              key={i}
              onClick={() => !isRunning && setCurrentLevel(i)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: 'none',
                background: i === currentLevel ? 'var(--accent-pink)' : '#E5E0D8',
                color: i === currentLevel ? 'white' : 'var(--text-medium)',
                fontWeight: 700,
                fontSize: 14,
                cursor: isRunning ? 'not-allowed' : 'pointer',
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-medium)', marginTop: 4 }}>
          Pick a level
        </div>
      </div>

      {showSuccess && !rated && (
        <RatingModal
          activity="codebots"
          activityName="CodeBots"
          activityEmoji="🤖"
          kidName={kidName}
          onClose={() => setRated(true)}
        />
      )}
    </>
  );
}
