'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import RatingModal from './RatingModal';

// ─── Types ────────────────────────────────────────────────────────────────────

type Direction = 'up' | 'right' | 'down' | 'left';
type Mode = 'easy' | 'hard';

interface Command { id: string; label: string; icon: string; color: string; }

interface Level {
  gridCols: number; gridRows: number;
  botStart: { x: number; y: number };
  goal: { x: number; y: number };
  walls: { x: number; y: number }[];
  minCommands: number; maxCommands: number;
}

interface Position { x: number; y: number; }

// ─── Level Data ───────────────────────────────────────────────────────────────

const COMMANDS: Command[] = [
  { id: 'forward',   label: 'Forward',    icon: '↑', color: '#3B82F6' },
  { id: 'turnRight', label: 'Turn Right', icon: '↻', color: '#F59E0B' },
  { id: 'turnLeft',  label: 'Turn Left',  icon: '↺', color: '#F97316' },
];

const EASY_LEVELS: Level[] = [
  { gridCols: 3, gridRows: 4, botStart: { x: 0, y: 0 }, goal: { x: 1, y: 0 }, walls: [], minCommands: 1, maxCommands: 4 },
  { gridCols: 3, gridRows: 4, botStart: { x: 0, y: 0 }, goal: { x: 2, y: 0 }, walls: [], minCommands: 2, maxCommands: 4 },
  { gridCols: 3, gridRows: 4, botStart: { x: 0, y: 0 }, goal: { x: 1, y: 1 }, walls: [], minCommands: 3, maxCommands: 4 },
  { gridCols: 3, gridRows: 4, botStart: { x: 0, y: 0 }, goal: { x: 2, y: 1 }, walls: [], minCommands: 4, maxCommands: 4 },
];

const HARD_LEVELS: Level[] = [
  { gridCols: 5, gridRows: 5, botStart: { x: 0, y: 0 }, goal: { x: 2, y: 0 }, walls: [], minCommands: 2, maxCommands: 8 },
  { gridCols: 5, gridRows: 5, botStart: { x: 0, y: 0 }, goal: { x: 4, y: 0 }, walls: [{ x: 2, y: 0 }], minCommands: 4, maxCommands: 8 },
  { gridCols: 5, gridRows: 5, botStart: { x: 0, y: 2 }, goal: { x: 4, y: 2 }, walls: [{ x: 2, y: 2 }, { x: 3, y: 2 }], minCommands: 5, maxCommands: 8 },
  { gridCols: 5, gridRows: 5, botStart: { x: 0, y: 0 }, goal: { x: 4, y: 4 }, walls: [{ x: 1, y: 1 }, { x: 3, y: 2 }, { x: 2, y: 3 }], minCommands: 8, maxCommands: 8 },
];

const DIRECTION_ORDER: Direction[] = ['up', 'right', 'down', 'left'];
const GRID_CELL = 64;
const STEP_MS = 500;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function rotateDir(dir: Direction, turn: 'right' | 'left'): Direction {
  const i = DIRECTION_ORDER.indexOf(dir);
  return DIRECTION_ORDER[(i + (turn === 'right' ? 1 : -1) + 4) % 4];
}

function stepForward(pos: Position, dir: Direction): Position {
  return dir === 'up' ? { x: pos.x, y: pos.y - 1 }
       : dir === 'down' ? { x: pos.x, y: pos.y + 1 }
       : dir === 'left' ? { x: pos.x - 1, y: pos.y }
       : { x: pos.x + 1, y: pos.y };
}

const dirRotation = (dir: Direction): number =>
  ({ up: 0, right: 90, down: 180, left: 270 }[dir]);

const starsDisplay = (n: number) => '⭐'.repeat(n) + '☆'.repeat(3 - n);

// ─── Component ────────────────────────────────────────────────────────────────

export default function CodeBots({ onBack, kidName = 'Friend' }: { onBack: () => void; kidName?: string }) {
  const [showIntro, setShowIntro]   = useState(true);
  const [selectedMode, setSelectedMode] = useState<Mode>('easy');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [sequence, setSequence]     = useState<string[]>([]);
  const [isRunning, setIsRunning]   = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [botPos, setBotPos]         = useState<Position>({ x: 0, y: 0 });
  const [botDir, setBotDir]         = useState<Direction>('right');
  const [showSuccess, setShowSuccess] = useState(false);
  const [starsEarned, setStarsEarned] = useState(0);
  const [rated, setRated]           = useState(false);
  const [failed, setFailed]        = useState(false);

  // All mutable execution state lives in refs — the setInterval reads from these
  // and only triggers React state updates for things the UI must show.
  const seqRef       = useRef<string[]>([]);
  const stepRef       = useRef(0);
  const posRef        = useRef<Position>({ x: 0, y: 0 });
  const dirRef        = useRef<Direction>('right');
  const goalRef       = useRef<Position>({ x: 0, y: 0 });
  const wallsRef      = useRef<{ x: number; y: number }[]>([]);
  const colsRef       = useRef(3);
  const rowsRef       = useRef(4);
  const minCmdsRef    = useRef(1);
  const runningRef    = useRef(false);
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  const levels  = selectedMode === 'easy' ? EASY_LEVELS : HARD_LEVELS;
  const level   = levels[currentLevel];
  const maxSeq  = level.maxCommands;

  // Sync mutable refs with latest state
  useEffect(() => { seqRef.current = sequence; }, [sequence]);
  useEffect(() => {
    posRef.current = level.botStart;
    dirRef.current = 'right';
    goalRef.current = level.goal;
    wallsRef.current = level.walls;
    colsRef.current = level.gridCols;
    rowsRef.current = level.gridRows;
    minCmdsRef.current = level.minCommands;
    setBotPos({ ...level.botStart });
    setBotDir('right');
  }, [level]);

  const resetLevel = useCallback(() => {
    setSequence([]);
    setIsRunning(false);
    setCurrentStepIndex(-1);
    setShowSuccess(false);
    setStarsEarned(0);
    setFailed(false);
    seqRef.current = [];
    stepRef.current = 0;
    runningRef.current = false;
    posRef.current = { ...level.botStart };
    dirRef.current = 'right';
    goalRef.current = level.goal;
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, [level]);

  useEffect(() => { resetLevel(); }, [resetLevel]);

  // ─── Execution Engine ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      runningRef.current = false;
      return;
    }

    runningRef.current = true;

    intervalRef.current = setInterval(() => {
      if (!runningRef.current) return;

      const step = stepRef.current;
      const seq  = seqRef.current;
      if (step >= seq.length) {
        // Done — check win
        runningRef.current = false;
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        const won = posRef.current.x === goalRef.current.x && posRef.current.y === goalRef.current.y;
        if (won) {
          const stars = seq.length <= minCmdsRef.current ? 3 : seq.length <= minCmdsRef.current + 2 ? 2 : 1;
          setStarsEarned(stars);
          setShowSuccess(true);
        } else {
          setFailed(true);
        }
        setIsRunning(false);
        setCurrentStepIndex(-1);
        return;
      }

      const cmdId = seq[step];

      if (cmdId === 'forward') {
        const next = stepForward(posRef.current, dirRef.current);
        if (next.x < 0 || next.x >= colsRef.current || next.y < 0 || next.y >= rowsRef.current ||
            wallsRef.current.some(w => w.x === next.x && w.y === next.y)) {
          // Hit wall — fail
          runningRef.current = false;
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setFailed(true);
          setIsRunning(false);
          setCurrentStepIndex(-1);
          return;
        }
        posRef.current = next;
        setBotPos({ ...next });
        stepRef.current = step + 1;
        setCurrentStepIndex(step + 1);
      } else if (cmdId === 'turnRight') {
        const nd = rotateDir(dirRef.current, 'right');
        dirRef.current = nd;
        setBotDir(nd);
        stepRef.current = step + 1;
        setCurrentStepIndex(step + 1);
      } else if (cmdId === 'turnLeft') {
        const nd = rotateDir(dirRef.current, 'left');
        dirRef.current = nd;
        setBotDir(nd);
        stepRef.current = step + 1;
        setCurrentStepIndex(step + 1);
      }
    }, STEP_MS);

    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      runningRef.current = false;
    };
  }, [isRunning]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleCommand = (cmdId: string) => {
    if (isRunning || showSuccess) return;
    if (sequence.length >= maxSeq) return;
    setSequence(prev => [...prev, cmdId]);
  };

  const handleClear = () => { if (!isRunning) { setSequence([]); setCurrentStepIndex(-1); } };

  const handleRun = () => {
    if (isRunning || sequence.length === 0) return;
    stepRef.current = 0;
    posRef.current = { ...level.botStart };
    dirRef.current = 'right';
    seqRef.current = sequence;
    setBotPos({ ...level.botStart });
    setBotDir('right');
    setCurrentStepIndex(0);
    setShowSuccess(false);
    setFailed(false);
    setIsRunning(true);
  };

  const handleNextLevel = () => {
    if (currentLevel < levels.length - 1) setCurrentLevel(prev => prev + 1);
    else { setShowIntro(true); setCurrentLevel(0); }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  const renderCell = (x: number, y: number) => {
    const isBot  = botPos.x === x && botPos.y === y;
    const isGoal = level.goal.x === x && level.goal.y === y;
    const isWall = level.walls.some(w => w.x === x && w.y === y);
    const bg = isWall ? '#374151' : isGoal ? '#6BCB77' : (x + y) % 2 === 0 ? '#F8F8F4' : 'white';
    return (
      <div key={`${x}-${y}`} style={{
        width: GRID_CELL, height: GRID_CELL,
        background: bg,
        border: '1.5px solid #E5E0D8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: isGoal && !isBot ? '0 0 14px #6BCB77' : undefined,
      }}>
        {isGoal && !isBot && <span style={{ fontSize: 26 }}>⭐</span>}
        {isBot && (
          <span style={{
            fontSize: 34,
            transform: `rotate(${dirRotation(botDir)}deg)`,
            transition: 'transform 0.25s ease',
            display: 'inline-block',
          }}>🤖</span>
        )}
      </div>
    );
  };

  // ─── Intro ───────────────────────────────────────────────────────────────────

  if (showIntro) {
    return (
      <div className="canvas-page slide-up">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1 className="page-title">🤖 CodeBots</h1>
        <p style={{ fontSize: 16, color: '#6B7280', marginBottom: 28 }}>
          Program your robot to reach the ⭐!
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <button className="btn btn-blue" style={{ fontSize: 18, padding: '22px 32px', borderRadius: 20 }}
            onClick={() => { setSelectedMode('easy'); setShowIntro(false); setCurrentLevel(0); }}>
            🌟 Easy — Ages 4–5
            <div style={{ fontSize: 13, marginTop: 4, opacity: 0.85 }}>3×4 grid · 3 commands · 4 levels</div>
          </button>
          <button className="btn btn-purple" style={{ fontSize: 18, padding: '22px 32px', borderRadius: 20 }}
            onClick={() => { setSelectedMode('hard'); setShowIntro(false); setCurrentLevel(0); }}>
            🚀 Hard — Ages 6–7
            <div style={{ fontSize: 13, marginTop: 4, opacity: 0.85 }}>5×5 grid · Walls · 8 commands · 4 levels</div>
          </button>
        </div>
      </div>
    );
  }

  // ─── Game ────────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="canvas-page slide-up">
        <button className="back-btn" onClick={onBack}>← Back</button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h1 className="page-title">🤖 CodeBots</h1>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', background: '#F3F4F6', padding: '4px 12px', borderRadius: 20 }}>
            {selectedMode === 'easy' ? '🌟 Easy' : '🚀 Hard'} · Level {currentLevel + 1}/{levels.length}
          </span>
        </div>

        {starsEarned > 0 && !isRunning && (
          <div style={{ fontSize: 18, marginBottom: 6, color: '#F59E0B' }}>
            {starsDisplay(starsEarned)} — {starsEarned === 3 ? 'Perfect!' : starsEarned === 2 ? 'Great job!' : 'You tried!'}
          </div>
        )}

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${level.gridCols}, ${GRID_CELL}px)`,
          borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          marginBottom: 16, width: 'fit-content',
        }}>
          {Array.from({ length: level.gridRows }, (_, y) =>
            Array.from({ length: level.gridCols }, (_, x) => renderCell(x, y))
          ).flat()}
        </div>

        {/* Command Palette */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          {COMMANDS.map(cmd => {
            const disabled = isRunning || showSuccess || sequence.length >= maxSeq;
            return (
              <button key={cmd.id} onClick={() => handleCommand(cmd.id)}
                disabled={disabled}
                style={{
                  background: cmd.color, color: 'white', border: 'none', borderRadius: 14,
                  padding: '12px 18px', fontSize: 15, fontWeight: 700,
                  fontFamily: 'Fredoka, sans-serif',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.45 : 1,
                  minWidth: 70, minHeight: 52,
                  display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: disabled ? 'none' : '0 3px 0 rgba(0,0,0,0.2)',
                  transform: 'translateY(0)', transition: 'all 0.1s',
                }}
                onMouseDown={e => { if (!disabled) (e.target as HTMLElement).style.transform = 'translateY(2px)'; }}
                onMouseUp={e => { (e.target as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                <span style={{ fontSize: 20 }}>{cmd.icon}</span>
                {cmd.label}
              </button>
            );
          })}
        </div>

        {/* Sequence Tray */}
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap', minHeight: 52,
          alignItems: 'center', background: '#F1F5F9', borderRadius: 14, padding: '10px 14px', marginBottom: 14,
        }}>
          <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, marginRight: 4 }}>Program:</span>
          {sequence.length === 0 ? (
            <span style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>
              Tap the commands above to build your program...
            </span>
          ) : (
            sequence.map((cmdId, i) => {
              const cmd = COMMANDS.find(c => c.id === cmdId)!;
              const isActive = i === currentStepIndex && isRunning;
              return (
                <span key={i} style={{
                  background: cmd.color, color: 'white', borderRadius: 10,
                  padding: '6px 13px', fontSize: 15, fontWeight: 700,
                  border: isActive ? '3px solid #1F2937' : '3px solid transparent',
                  boxShadow: isActive ? '0 0 10px rgba(0,0,0,0.45)' : undefined,
                  transition: 'border 0.15s, box-shadow 0.15s',
                }}>
                  {cmd.icon}
                </span>
              );
            })
          )}
          {sequence.length >= maxSeq && (
            <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 700 }}>Max!</span>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <button className="btn btn-gray" onClick={handleClear} disabled={isRunning} style={{ fontSize: 15 }}>
            🗑️ Clear
          </button>
          <button className="btn btn-green" onClick={handleRun}
            disabled={isRunning || sequence.length === 0}
            style={{ fontSize: 16, minWidth: 110, fontWeight: 800 }}>
            ▶️ RUN
          </button>
        </div>

        {/* Success */}
        {showSuccess && (
          <div style={{ background: '#F0FFF4', border: '3px solid #22C55E', borderRadius: 18, padding: '18px 20px', textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#16A34A', marginBottom: 4 }}>Way to go, {kidName}!</div>
            <div style={{ fontSize: 18, color: '#6B7280', marginBottom: 14 }}>{starsDisplay(starsEarned)}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-blue" onClick={() => resetLevel()}>🔄 Try Again</button>
              <button className="btn btn-green" onClick={handleNextLevel}>
                {currentLevel < levels.length - 1 ? 'Next Level ➡️' : '🎊 All Done!'}
              </button>
            </div>
          </div>
        )}

        {/* Failure */}
        {failed && !showSuccess && (
          <div style={{ background: '#FFF0F4', border: '3px solid #EF4444', borderRadius: 18, padding: '18px 20px', textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🤖💦</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#EF4444', marginBottom: 4 }}>Oops! Try again!</div>
            <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 14 }}>Your robot didn&apos;t reach the ⭐.</div>
            <button className="btn btn-blue" onClick={() => resetLevel()}>🔄 Try Again</button>
          </div>
        )}

        {/* Level picker */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
          <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>Levels:</span>
          {levels.map((_, i) => (
            <button key={i} onClick={() => !isRunning && setCurrentLevel(i)}
              style={{
                width: 36, height: 36, borderRadius: 10, border: 'none',
                background: i === currentLevel ? '#8B5CF6' : '#E5E7EB',
                color: i === currentLevel ? 'white' : '#6B7280',
                fontWeight: 700, fontSize: 14,
                cursor: isRunning ? 'not-allowed' : 'pointer',
              }}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {showSuccess && !rated && (
        <RatingModal activity="codebots" activityName="CodeBots" activityEmoji="🤖" kidName={kidName} onClose={() => setRated(true)} />
      )}
    </>
  );
}