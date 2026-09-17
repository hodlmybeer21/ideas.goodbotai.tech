'use client';

import { useRef, useMemo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { Building } from '../buildings.config';
import { makeThatchTexture, makeWallTexture, makeWoodTexture } from '../textures';

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
// 1×1 transparent PNG — guarantees useTexture always resolves so musicrm
// (which has no image) doesn't break Suspense.
const SIGN_FALLBACK = '/school-3d/signs/_blank.png';

function SignTexturePlane({ id, w, h, z }: { id: string; w: number; h: number; z: number }) {
  const path = SIGN_TEXTURE[id] ?? SIGN_FALLBACK;
  const tex = useTexture(path);
  if (!SIGN_TEXTURE[id]) return null;
  return (
    <mesh position={[0, 0, z]}>
      <planeGeometry args={[w * 0.94, h * 0.92]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  );
}

type Props = {
  building: Building;
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
  onPlayerNear: (buildingId: string, near: boolean) => void;
};

/**
 * Building — Ghibli-pastoral procedural 3D building with door trigger.
 *
 * Visual signature:
 *   - Cream walls with subtle wood-plank texture
 *   - Vertical wooden beams at corners (half-timbered Totoro-house look)
 *   - Thatched roof with wide overhanging eaves (the Ghibli tell)
 *   - Warm wood door + frames, hand-painted wooden sign above
 *
 * Doors still auto-orient toward the courtyard so the door always faces
 * the player approach direction.
 */
export default function Building({ building, playerPosRef, onPlayerNear }: Props) {
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
  const h = 3.0;
  const wallColor  = building.wallColor ?? '#EFE3D0';
  const roofColor  = building.roofColor ?? '#7B4F36';
  const trimColor  = building.color;

  // Shared textures — created once per building instance.
  const wallTex  = useMemo(() => makeWallTexture(),  []);
  const thatchTex = useMemo(() => makeThatchTexture(), []);
  const woodTex  = useMemo(() => makeWoodTexture(),  []);

  const wallMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: wallColor, roughness: 0.85, metalness: 0,
    });
    if (wallTex) { m.map = wallTex; m.needsUpdate = true; }
    return m;
  }, [wallTex, wallColor]);

  const thatchMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: roofColor, roughness: 0.95, metalness: 0,
    });
    if (thatchTex) { m.map = thatchTex; m.needsUpdate = true; }
    return m;
  }, [thatchTex, roofColor]);

  const woodMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: '#7A5235', roughness: 0.85, metalness: 0,
    });
    if (woodTex) { m.map = woodTex; m.needsUpdate = true; }
    return m;
  }, [woodTex]);

  const trimMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: trimColor, roughness: 0.75, metalness: 0 }),
    [trimColor]
  );

  return (
    <group position={building.position} rotation={[0, angle, 0]}>
      {/* Wall base — cream with subtle plank texture */}
      <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <primitive object={wallMat} attach="material" />
      </mesh>

      {/* Half-timbered corner posts — vertical wooden beams */}
      {([
        [-w / 2, -d / 2], [ w / 2, -d / 2],
        [-w / 2,  d / 2], [ w / 2,  d / 2],
      ] as Array<[number, number]>).map(([cx, cz], i) => (
        <mesh key={`post-${i}`} castShadow position={[cx, h / 2 + 0.05, cz]}>
          <boxGeometry args={[0.22, h + 0.1, 0.22]} />
          <primitive object={woodMat} attach="material" />
        </mesh>
      ))}

      {/* Horizontal beam band (under the eaves) */}
      <mesh castShadow position={[0, h - 0.08, 0]}>
        <boxGeometry args={[w + 0.12, 0.22, d + 0.12]} />
        <primitive object={woodMat} attach="material" />
      </mesh>
      {/* Lower trim band — colored accent */}
      <mesh castShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[w + 0.12, 0.18, d + 0.12]} />
        <primitive object={trimMat} attach="material" />
      </mesh>

      {/* Roof — thatched with wide overhanging eaves */}
      <ThatchedRoof
        style={building.roofStyle}
        width={w}
        depth={d}
        height={h}
        material={thatchMat}
      />

      {/* Architectural flourishes: chimney, weathervane, clock */}
      <RoofDetails
        buildingId={building.id}
        style={building.roofStyle}
        w={w}
        d={d}
        h={h}
        roofColor={roofColor}
        woodMat={woodMat}
      />

      {/* Front step — wooden plank */}
      <mesh castShadow receiveShadow position={[0, 0.08, d / 2 + 0.3]}>
        <boxGeometry args={[w * 0.35, 0.16, 0.6]} />
        <primitive object={woodMat} attach="material" />
      </mesh>

      {/* Door frame */}
      <mesh castShadow position={[0, 1.1, d / 2 + 0.02]}>
        <boxGeometry args={[1.2, 2.2, 0.06]} />
        <primitive object={woodMat} attach="material" />
      </mesh>
      {/* Door */}
      <mesh castShadow position={[0, 1.1, d / 2 + 0.05]}>
        <boxGeometry args={[0.95, 2.0, 0.04]} />
        <meshStandardMaterial color="#6B4631" roughness={0.7} />
      </mesh>
      {/* Door window — warm cream pane */}
      <mesh position={[0, 1.6, d / 2 + 0.075]}>
        <boxGeometry args={[0.55, 0.7, 0.02]} />
        <meshStandardMaterial color="#FFE8B8" emissive="#FFD89B" emissiveIntensity={0.18} transparent opacity={0.88} />
      </mesh>
      {/* Door handle — warm brass */}
      <mesh position={[0.32, 1.1, d / 2 + 0.08]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#C9A155" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Sign above door — wooden-framed plaque with image texture + emoji/label overlay */}
      <group position={[0, h + 0.55, d / 2 + 0.02]}>
        {/* Wooden plank background (instead of white) */}
        <mesh castShadow>
          <boxGeometry args={[w * 0.65, 0.6, 0.07]} />
          <primitive object={woodMat} attach="material" />
        </mesh>
        <Suspense fallback={null}>
          <SignTexturePlane id={building.id} w={w * 0.65} h={0.6} z={0.04} />
        </Suspense>
        {/* Emoji on top */}
        <Text
          position={[0, 0.34, 0.055]}
          fontSize={0.26}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.012}
          outlineColor="#2D1B00"
        >
          {building.stations[0]?.icon ?? '🏫'}
        </Text>
        {/* Label below emoji */}
        <Text
          position={[0, -0.08, 0.055]}
          fontSize={0.22}
          color="#2D1B00"
          anchorX="center"
          anchorY="middle"
          fontWeight={700}
          maxWidth={w * 0.55}
          outlineWidth={0.012}
          outlineColor="#F5E6CA"
        >
          {building.label.toUpperCase()}
        </Text>
      </group>

      {/* Windows — front (on +Z face) */}
      <Window position={[-w * 0.28, 2.0, d / 2 + 0.01]} woodMat={woodMat} />
      <Window position={[ w * 0.28, 2.0, d / 2 + 0.01]} woodMat={woodMat} />
      {/* Side windows */}
      <Window position={[-w / 2 - 0.01, 2.0, 0]} side="left"  woodMat={woodMat} />
      <Window position={[ w / 2 + 0.01, 2.0, 0]} side="right" woodMat={woodMat} />

      {/* Subtle warm amber trigger disc on the front step (was bright yellow) */}
      <mesh position={[0, 0.05, d / 2 + 0.65]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.65, 16]} />
        <meshStandardMaterial
          color="#E8B57E"
          emissive="#E8B57E"
          emissiveIntensity={0.35}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
}

function Window({
  position, side, woodMat,
}: {
  position: [number, number, number];
  side?: 'left' | 'right';
  woodMat: THREE.Material;
}) {
  const rotY = side === 'left' ? Math.PI / 2 : side === 'right' ? -Math.PI / 2 : 0;
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.9, 0.9, 0.06]} />
        <primitive object={woodMat} attach="material" />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[0.7, 0.7, 0.03]} />
        <meshStandardMaterial color="#FFE8B8" emissive="#FFD89B" emissiveIntensity={0.22} transparent opacity={0.88} />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[0.72, 0.05, 0.02]} />
        <primitive object={woodMat} attach="material" />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[0.05, 0.72, 0.02]} />
        <primitive object={woodMat} attach="material" />
      </mesh>
    </group>
  );
}

/**
 * ThatchedRoof — wide overhanging eaves + steep thatched peak.
 *
 * All styles (except `open`) use the same Ghibli signature: a wide low
 * cylindrical eave that overhangs the wall, then a steep thatched cone
 * or pyramid above it. Style just changes the upper silhouette.
 */
function ThatchedRoof({
  style, width, depth, height, material,
}: {
  style: Building['roofStyle'];
  width: number;
  depth: number;
  height: number;
  material: THREE.Material;
}) {
  if (style === 'open') return null; // Playground — no roof

  // Eave overhang: ~25% wider than the wall on each side.
  const eaveR  = Math.max(width, depth) * 0.62;
  const eaveH  = 0.32;
  const peakH  = 1.4; // tall, dramatic — Ghibli silhouette

  // Helper for the wide low eave (shared across styles).
  const Eave = () => (
    <mesh castShadow position={[0, height + eaveH / 2 + 0.05, 0]}>
      <cylinderGeometry args={[eaveR * 0.95, eaveR, eaveH, 12]} />
      <primitive object={material} attach="material" />
    </mesh>
  );

  if (style === 'flat') {
    // Low gentle dome — like a thatched haystack cap
    return (
      <Eave />
    );
  }

  if (style === 'dome') {
    // Wide base + tall thatched cap
    return (
      <>
        <Eave />
        <mesh castShadow position={[0, height + eaveH + 0.05 + peakH * 0.5, 0]}>
          <cylinderGeometry args={[0.01, Math.min(width, depth) * 0.5, peakH, 12]} />
          <primitive object={material} attach="material" />
        </mesh>
      </>
    );
  }

  if (style === 'peaked') {
    // Wide eave + tall slim cone (Howl's castle-ish silhouette)
    return (
      <>
        <Eave />
        <mesh castShadow position={[0, height + eaveH + 0.05 + peakH * 0.5, 0]}>
          <coneGeometry args={[Math.min(width, depth) * 0.5, peakH, 12]} />
          <primitive object={material} attach="material" />
        </mesh>
      </>
    );
  }

  if (style === 'pagoda') {
    // Two-tier thatched (Spirited Away bathhouse nod)
    return (
      <>
        <Eave />
        <mesh castShadow position={[0, height + eaveH + 0.4, 0]}>
          <cylinderGeometry args={[eaveR * 0.78, eaveR * 0.92, 0.28, 12]} />
          <primitive object={material} attach="material" />
        </mesh>
        <mesh castShadow position={[0, height + eaveH + 0.4 + 0.7, 0]}>
          <coneGeometry args={[eaveR * 0.5, 1.0, 12]} />
          <primitive object={material} attach="material" />
        </mesh>
      </>
    );
  }

  // gable (default) — wide eave + tall thatched cone
  return (
    <>
      <Eave />
      <mesh castShadow position={[0, height + eaveH + 0.05 + peakH * 0.5, 0]}>
        <coneGeometry args={[Math.min(width, depth) * 0.55, peakH, 12]} />
        <primitive object={material} attach="material" />
      </mesh>
    </>
  );
}

function RoofDetails({
  buildingId, style, w, d, h, roofColor, woodMat,
}: {
  buildingId: string;
  style: Building['roofStyle'];
  w: number;
  d: number;
  h: number;
  roofColor: string;
  woodMat: THREE.Material;
}) {
  // Chimney for gable/pagoda roofs
  const hasChimney = style === 'gable' || style === 'pagoda';
  if (hasChimney) {
    return (
      <group position={[w * 0.32, h + 2.2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.35, 0.9, 0.35]} />
          <primitive object={woodMat} attach="material" />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.45, 0.1, 0.45]} />
          <meshStandardMaterial color="#3E2723" />
        </mesh>
      </group>
    );
  }
  // Weathervane for peaked roofs
  if (style === 'peaked') {
    return (
      <group position={[0, h + 2.4, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.04, 0.04, 1.4, 6]} />
          <meshStandardMaterial color="#5D4037" />
        </mesh>
        <mesh position={[0.35, 0.5, 0]}>
          <planeGeometry args={[0.4, 0.25]} />
          <meshStandardMaterial color="#C99B96" side={2} />
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
          <meshStandardMaterial color="#F5E6CA" />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <cylinderGeometry args={[0.4, 0.4, 0.02, 24]} />
          <meshStandardMaterial color="#E8B57E" />
        </mesh>
        {/* hour hand */}
        <mesh position={[0, 0.15, 0.07]}>
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
