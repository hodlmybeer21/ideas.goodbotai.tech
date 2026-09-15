'use client';

import { useRef, useEffect, useMemo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { Building } from '../buildings.config';

const TRIGGER_DISTANCE = 3.5;

// Map of building id → sign texture path. Buildings without an entry
// (currently just `musicrm`) fall back to the placeholder.
const SIGN_TEXTURE: Record<string, string> = {
  library:    '/school-3d/signs/library.png',
  artroom:    '/school-3d/signs/artroom.png',
  sciceng:    '/school-3d/signs/sciceng.png',
  auditorium: '/school-3d/signs/auditorium.png',
  playground: '/school-3d/signs/playground.png',
  office:     '/school-3d/signs/office.png',
  gym:        '/school-3d/signs/gym.png',
  cafetria:   '/school-3d/signs/cafetria.png',
  nurse:      '/school-3d/signs/nurse.png',
  mathroom:   '/school-3d/signs/mathroom.png',
  greenhouse: '/school-3d/signs/greenhouse.png',
};
const SIGN_FALLBACK = '/school-3d/signs/_blank.png';

function SignTexturePlane({ id, w, h, z }: { id: string; w: number; h: number; z: number }) {
  const path = SIGN_TEXTURE[id] ?? SIGN_FALLBACK;
  const tex = useTexture(path);
  if (!SIGN_TEXTURE[id]) return null;
  return (
    <mesh position={[0, 0, z]}>
      <planeGeometry args={[w * 0.94, h * 0.94]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  );
}

// Buildings that get columned porticos (Greek/Roman style) on their front face,
// matching the reference image's library / office / auditorium look.
const COLUMNS_BUILDINGS = new Set(['library', 'office', 'auditorium']);

/**
 * Building — reusable procedural 3D building with door trigger.
 * Roofs: flat (single slab), dome (half-sphere), peaked/gable (proper triangular
 * prism via ExtrudeGeometry — no more X-shape cross), pagoda (2-tier + cone).
 * Sign hangs in front of the door (so it never gets occluded by any roof).
 * Multi-story: wall height scales with `building.height` (floors), and a
 * row of upper-floor windows gets added on the front face.
 * Decorative columns: library / office / auditorium get a row of white
 * columns + header beam across their front, matching the reference image.
 */
export default function Building({ building, playerPosRef, onPlayerNear }: {
  building: Building;
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
  onPlayerNear: (buildingId: string, near: boolean) => void;
}) {
  const wasNearRef = useRef(false);

  // Orientation: angle from building to courtyard (door on +Z face)
  const angle = Math.atan2(-building.position[0], -building.position[2]);

  useFrame(() => {
    const p = playerPosRef.current;
    const dx = p.x - building.position[0];
    const dz = p.z - building.position[2];
    const dist = Math.sqrt(dx * dx + dz * dz);
    const near = dist < TRIGGER_DISTANCE;
    if (near !== wasNearRef.current) {
      wasNearRef.current = near;
      onPlayerNear(building.id, near);
    }
  });

  const [w, d] = building.size;
  const floors = building.height ?? 1;
  const h = 3.0 * floors;              // wall height scales with floor count
  const wallColor  = building.wallColor ?? '#F5F0E8';
  const roofColor  = building.roofColor ?? '#5D4037';
  const trimColor  = building.color;
  const hasColumns = COLUMNS_BUILDINGS.has(building.id);

  // Sign dimensions — larger so the wood plaque + emoji + label are readable
  const signW = Math.min(w * 0.65, 3.6);
  const signH = 1.05;

  return (
    <group position={building.position} rotation={[0, angle, 0]}>
      {/* Wall base */}
      <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={wallColor} roughness={0.7} />
      </mesh>

      {/* Top trim band */}
      <mesh castShadow position={[0, h - 0.08, 0]}>
        <boxGeometry args={[w + 0.12, 0.18, d + 0.12]} />
        <meshStandardMaterial color={trimColor} roughness={0.6} />
      </mesh>
      {/* Bottom trim band */}
      <mesh castShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[w + 0.12, 0.18, d + 0.12]} />
        <meshStandardMaterial color={trimColor} roughness={0.6} />
      </mesh>

      {/* Roof — varies by style. All non-X variants. */}
      <Roof style={building.roofStyle} width={w} depth={d} height={h} color={roofColor} accent={trimColor} />

      {/* Architectural flourishes: chimney on gable roofs, weathervane on peaked, clock on Main Office */}
      <RoofDetails buildingId={building.id} style={building.roofStyle} w={w} d={d} h={h} roofColor={roofColor} />

      {/* Front step (small lip on +Z face) */}
      <mesh castShadow receiveShadow position={[0, 0.06, d / 2 + 0.3]}>
        <boxGeometry args={[w * 0.35, 0.12, 0.6]} />
        <meshStandardMaterial color="#D4C4A8" roughness={0.85} />
      </mesh>

      {/* Door frame (brown surround) — at the bottom (ground level) */}
      <mesh castShadow position={[0, 1.1, d / 2 + 0.02]}>
        <boxGeometry args={[1.2, 2.2, 0.05]} />
        <meshStandardMaterial color="#5D4037" roughness={0.7} />
      </mesh>
      {/* Door (slightly inset) */}
      <mesh castShadow position={[0, 1.1, d / 2 + 0.05]}>
        <boxGeometry args={[0.95, 2.0, 0.04]} />
        <meshStandardMaterial color="#8D6E63" roughness={0.6} />
      </mesh>
      {/* Door window */}
      <mesh position={[0, 1.6, d / 2 + 0.075]}>
        <boxGeometry args={[0.55, 0.7, 0.02]} />
        <meshStandardMaterial color="#B3E5FC" emissive="#B3E5FC" emissiveIntensity={0.2} transparent opacity={0.9} />
      </mesh>
      {/* Door handle */}
      <mesh position={[0.32, 1.1, d / 2 + 0.08]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#FFD54F" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* SIGN — hangs in front of the door at eye-level so every roof shape
          leaves it readable. Larger + clearer text than the old above-the-roof
          version, which was tiny and got occluded by peaked/gable peaks. */}
      <group position={[0, h - 0.5, d / 2 + 0.85]} rotation={[0.08, 0, 0]}>
        {/* Two chains holding the sign */}
        <mesh position={[-signW / 2 + 0.18, signH / 2 + 0.25, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.55, 4]} />
          <meshStandardMaterial color="#212121" />
        </mesh>
        <mesh position={[signW / 2 - 0.18, signH / 2 + 0.25, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.55, 4]} />
          <meshStandardMaterial color="#212121" />
        </mesh>

        {/* Sign background (wood-framed plaque) */}
        <mesh castShadow>
          <boxGeometry args={[signW, signH, 0.1]} />
          <meshStandardMaterial color="white" />
        </mesh>

        {/* Image texture overlay (wood-plaque sign generated by minimax/image-01) */}
        <Suspense fallback={null}>
          <SignTexturePlane id={building.id} w={signW} h={signH} z={0.055} />
        </Suspense>

        {/* Emoji on top */}
        <Text
          position={[0, 0.42, 0.07]}
          fontSize={0.5}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.025}
          outlineColor="#2D1B00"
        >
          {building.stations[0]?.icon ?? '🏫'}
        </Text>

        {/* Label below emoji */}
        <Text
          position={[0, -0.2, 0.07]}
          fontSize={0.3}
          color={trimColor}
          anchorX="center"
          anchorY="middle"
          fontWeight={700}
          maxWidth={signW * 0.92}
          outlineWidth={0.015}
          outlineColor="white"
        >
          {building.label.toUpperCase()}
        </Text>
      </group>

      {/* Windows — front (on +Z face). For multi-story buildings, add a row of
          upper-floor windows at y = h - 1.2. For single-story, just the ground
          floor windows at y = 2.0. */}
      <Window position={[-w * 0.28, 2.0, d / 2 + 0.01]} />
      <Window position={[ w * 0.28, 2.0, d / 2 + 0.01]} />
      {floors >= 2 && (
        <>
          <Window position={[-w * 0.28, h - 1.2, d / 2 + 0.01]} />
          <Window position={[ w * 0.28, h - 1.2, d / 2 + 0.01]} />
        </>
      )}
      {/* Side windows */}
      <Window position={[-w / 2 - 0.01, 2.0, 0]} side="left" />
      <Window position={[ w / 2 + 0.01, 2.0, 0]} side="right" />
      {floors >= 2 && (
        <>
          <Window position={[-w / 2 - 0.01, h - 1.2, 0]} side="left" />
          <Window position={[ w / 2 + 0.01, h - 1.2, 0]} side="right" />
        </>
      )}

      {/* Decorative columns on the front face (Greek/Roman portico style) for
          library / office / auditorium. 5 white columns across the front,
          header beam across the top, all on the +Z (door-facing) side. */}
      {hasColumns && (
        <group position={[0, 0, d / 2 + 0.2]}>
          {[-w * 0.32, -w * 0.16, 0, w * 0.16, w * 0.32].map((cx, i) => (
            <mesh key={`col-${i}`} castShadow position={[cx, h / 2, 0]}>
              <cylinderGeometry args={[0.12, 0.14, h - 0.3, 12]} />
              <meshStandardMaterial color="#F5F5F5" roughness={0.5} />
            </mesh>
          ))}
          {/* Header beam across the top of the columns */}
          <mesh castShadow position={[0, h - 0.15, 0]}>
            <boxGeometry args={[w * 0.7 + 0.3, 0.3, 0.25]} />
            <meshStandardMaterial color="#EFEBE9" roughness={0.6} />
          </mesh>
          {/* Pediment (low triangle above the beam) */}
          <mesh castShadow position={[0, h + 0.05, 0]} rotation={[0, 0, 0]}>
            <coneGeometry args={[w * 0.4, 0.5, 3]} />
            <meshStandardMaterial color="#EFEBE9" roughness={0.6} />
          </mesh>
        </group>
      )}

      {/* Glowing yellow trigger disc on the front step */}
      <mesh position={[0, 0.05, d / 2 + 0.65]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 16]} />
        <meshStandardMaterial
          color="#FFD54F"
          emissive="#FFD54F"
          emissiveIntensity={0.55}
          transparent
          opacity={0.55}
        />
      </mesh>
    </group>
  );
}

function Window({ position, side }: { position: [number, number, number]; side?: 'left' | 'right' }) {
  const rotY = side === 'left' ? Math.PI / 2 : side === 'right' ? -Math.PI / 2 : 0;
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh>
        <boxGeometry args={[0.9, 0.9, 0.06]} />
        <meshStandardMaterial color="#5D4037" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[0.7, 0.7, 0.03]} />
        <meshStandardMaterial color="#B3E5FC" emissive="#B3E5FC" emissiveIntensity={0.25} transparent opacity={0.88} />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[0.72, 0.05, 0.02]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[0.05, 0.72, 0.02]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
    </group>
  );
}

/**
 * Roof — single component that emits the right shape per `style`. No more
 * crossed-box X shape for peaked/gable: those now use an ExtrudeGeometry
 * triangular prism (proper gable, single solid roof).
 */
function Roof({
  style, width, depth, height, color, accent,
}: {
  style: Building['roofStyle'];
  width: number;
  depth: number;
  height: number;
  color: string;
  accent: string;
}) {
  if (style === 'open') return null; // Playground — no roof

  if (style === 'flat') {
    return (
      <mesh castShadow position={[0, height + 0.05, 0]}>
        <boxGeometry args={[width + 0.3, 0.25, depth + 0.3]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    );
  }

  if (style === 'dome') {
    return (
      <mesh castShadow position={[0, height + 0.5, 0]}>
        <sphereGeometry args={[Math.min(width, depth) * 0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.65} />
      </mesh>
    );
  }

  // Triangular prism (gable / peaked) — proper roof, no X-shape cross.
  // Triangle base spans building width (X), apex up (Y), prism length along depth (Z).
  const gableShape = useMemo(() => {
    const shape = new THREE.Shape();
    const w = width + 0.3;
    const h = 1.05;
    shape.moveTo(-w / 2, 0);
    shape.lineTo(w / 2, 0);
    shape.lineTo(0, h);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, {
      depth: depth + 0.3,
      bevelEnabled: false,
    });
  }, [width, depth]);

  // Center the prism along Z so it spans [-depth/2, +depth/2]
  const gableZ = -(depth + 0.3) / 2;

  if (style === 'peaked') {
    return (
      <group position={[0, height + 0.05, 0]}>
        <mesh castShadow geometry={gableShape} position={[0, 0, gableZ]}>
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      </group>
    );
  }

  if (style === 'pagoda') {
    return (
      <group position={[0, height + 0.05, 0]}>
        {/* Bottom eave */}
        <mesh castShadow>
          <boxGeometry args={[width + 0.3, 0.2, depth + 0.3]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        {/* Middle ridge layer (slightly smaller) */}
        <mesh castShadow position={[0, 0.55, 0]}>
          <boxGeometry args={[width + 0.05, 0.18, depth + 0.05]} />
          <meshStandardMaterial color={accent} roughness={0.7} />
        </mesh>
        {/* Top conical finial */}
        <mesh castShadow position={[0, 1.1, 0]}>
          <coneGeometry args={[Math.min(width, depth) * 0.45, 0.7, 8]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      </group>
    );
  }

  // gable — default
  return (
    <group position={[0, height + 0.05, 0]}>
      <mesh castShadow geometry={gableShape} position={[0, 0, gableZ]}>
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Chimney on the slope */}
      <mesh castShadow position={[width * 0.32, 0.95, 0]}>
        <boxGeometry args={[0.35, 0.55, 0.35]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
    </group>
  );
}

function RoofDetails({
  buildingId, style, w, d, h, roofColor,
}: {
  buildingId: string;
  style: Building['roofStyle'];
  w: number;
  d: number;
  h: number;
  roofColor: string;
}) {
  // Chimney smoke wisps for gable/pagoda roofs
  const hasChimney = style === 'gable' || style === 'pagoda';
  if (hasChimney) {
    return (
      <group position={[w * 0.32, h + 1.6, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.35, 0.8, 0.35]} />
          <meshStandardMaterial color="#5D4037" />
        </mesh>
        {/* chimney cap */}
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.45, 0.08, 0.45]} />
          <meshStandardMaterial color="#3E2723" />
        </mesh>
      </group>
    );
  }
  // Weathervane for peaked roofs (small flag-like detail)
  if (style === 'peaked') {
    return (
      <group position={[0, h + 1.85, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.04, 0.04, 1.4, 6]} />
          <meshStandardMaterial color="#5D4037" />
        </mesh>
        <mesh position={[0.35, 0.5, 0]}>
          <planeGeometry args={[0.4, 0.25]} />
          <meshStandardMaterial color="#FF6B9D" side={2} />
        </mesh>
      </group>
    );
  }
  // Clock on Main Office
  if (buildingId === 'office') {
    return (
      <group position={[0, h + 0.5, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.1, 24]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <cylinderGeometry args={[0.4, 0.4, 0.02, 24]} />
          <meshStandardMaterial color="#FFD54F" />
        </mesh>
        {/* hour hand */}
        <mesh position={[0, 0.15, 0.07]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.04, 0.3, 0.02]} />
          <meshStandardMaterial color="#2D1B00" />
        </mesh>
        {/* minute hand */}
        <mesh position={[0.18, 0, 0.07]} rotation={[0, 0, -Math.PI / 2]}>
          <boxGeometry args={[0.03, 0.35, 0.02]} />
          <meshStandardMaterial color="#2D1B00" />
        </mesh>
      </group>
    );
  }
  return null;
}
