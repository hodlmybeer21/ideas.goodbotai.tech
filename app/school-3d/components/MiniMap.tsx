'use client';

import { BUILDINGS } from '../buildings.config';

type Props = {
  playerPos: { x: number; z: number };
  visitedBuildings: Set<string>;
  nearBuildingId: string | null;
};

const SIZE = 140;
const PAD = 10;
const WORLD_RANGE = 32; // world ±32 maps to the inner square (player bounds ≈ ±28)

/**
 * MiniMap — fixed bottom-right SVG overlay showing the campus top-down.
 *
 * Building dots:
 *   - colored dot if never visited
 *   - sage-green dot if visited (with checkmark emoji)
 *   - pulsing golden ring on the building the player is currently near
 *
 * Player is a brown dot with a soft pulse.
 *
 * Pure SVG + CSS animation — no Canvas, no reflow churn.
 */
export default function MiniMap({ playerPos, visitedBuildings, nearBuildingId }: Props) {
  const scale = (SIZE / 2 - PAD) / WORLD_RANGE;
  const toMap = (wx: number, wz: number) => ({
    x: SIZE / 2 + wx * scale,
    y: SIZE / 2 + wz * scale,
  });
  const center = toMap(0, 0);

  return (
    <div style={wrapStyle}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-label="Campus mini-map">
        {/* Background disc */}
        <defs>
          <radialGradient id="mm-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor="#FAF1DE" stopOpacity="0.96" />
            <stop offset="100%" stopColor="#E8C9A8" stopOpacity="0.92" />
          </radialGradient>
        </defs>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 2} fill="url(#mm-bg)" stroke="#5C4128" strokeWidth="2" />

        {/* Compass labels */}
        <text x={SIZE / 2} y={14} fontSize="9" fill="#5C4128" textAnchor="middle" fontWeight="700">N</text>
        <text x={SIZE / 2} y={SIZE - 6} fontSize="9" fill="#5C4128" textAnchor="middle" fontWeight="700">S</text>
        <text x={8} y={SIZE / 2 + 3} fontSize="9" fill="#5C4128" fontWeight="700">W</text>
        <text x={SIZE - 14} y={SIZE / 2 + 3} fontSize="9" fill="#5C4128" fontWeight="700">E</text>

        {/* Path spokes from center to each building */}
        {BUILDINGS.map((b) => {
          const end = toMap(b.position[0], b.position[2]);
          return (
            <line
              key={`path-${b.id}`}
              x1={center.x} y1={center.y}
              x2={end.x}   y2={end.y}
              stroke="#A88E70" strokeWidth="1" opacity="0.45"
            />
          );
        })}

        {/* Plaza dot */}
        <circle cx={center.x} cy={center.y} r={3} fill="#C9A982" stroke="#5C4128" strokeWidth="0.5" />

        {/* Building dots */}
        {BUILDINGS.map((b) => {
          const pos = toMap(b.position[0], b.position[2]);
          const visited = visitedBuildings.has(b.id);
          const isNear = nearBuildingId === b.id;
          const fill = visited ? '#7A9B6E' : b.color;
          return (
            <g key={b.id}>
              {isNear && (
                <circle cx={pos.x} cy={pos.y} r={6} fill="none" stroke="#E8B57E" strokeWidth="1.5" opacity="0.7">
                  <animate attributeName="r" values="5;9;5" dur="1.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0;0.7" dur="1.4s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isNear ? 4.5 : 3.5}
                fill={fill}
                stroke={isNear ? '#FFD93D' : '#2D1B00'}
                strokeWidth={isNear ? 1.5 : 0.7}
              />
              <text
                x={pos.x} y={pos.y + 2}
                fontSize="6" fill="white" textAnchor="middle"
                fontWeight="700"
              >
                {visited ? '✓' : (b.stations[0]?.icon ?? '🏫')}
              </text>
            </g>
          );
        })}

        {/* Player dot + pulse */}
        {(() => {
          const pos = toMap(playerPos.x, playerPos.z);
          return (
            <g>
              <circle cx={pos.x} cy={pos.y} r={6} fill="none" stroke="#A04F3F" strokeWidth="1" opacity="0.5">
                <animate attributeName="r" values="3;9;3" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx={pos.x} cy={pos.y} r={3.5} fill="#A04F3F" stroke="#FAF1DE" strokeWidth="1.2" />
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

const wrapStyle: React.CSSProperties = {
  position: 'fixed',
  // Sit above the bottom-right BGM button (BGM: bottom:24 + 48h + 12 gap = bottom:84).
  bottom: 88,
  right: 24,
  zIndex: 50,
  borderRadius: '50%',
  boxShadow: '0 4px 14px rgba(92, 65, 40, 0.25)',
  fontFamily: 'Fredoka, sans-serif',
};
