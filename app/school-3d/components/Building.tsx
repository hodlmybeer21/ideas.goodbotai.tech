'use client';

import { useRef, Suspense } from 'react';
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
 * Building — reusable procedural 3D building with door trigger.
 * The whole building auto-orients toward the courtyard (origin), so the
 * door always faces the player approach direction.
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
  const wallColor  = building.wallColor ?? '#F5F0E8';
  const roofColor  = building.roofColor ?? '#5D4037';
  const trimColor  = building.color;

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

      {/* Roof — varies by style */}
      <Roof style={building.roofStyle} width={w} depth={d} height={h} color={roofColor} accent={trimColor} />

      {/* Front step (small lip on +Z face) */}
      <mesh castShadow receiveShadow position={[0, 0.06, d / 2 + 0.3]}>
        <boxGeometry args={[w * 0.35, 0.12, 0.6]} />
        <meshStandardMaterial color="#D4C4A8" roughness={0.85} />
      </mesh>

      {/* Door frame */}
      <mesh castShadow position={[0, 1.1, d / 2 + 0.02]}>
        <boxGeometry args={[1.2, 2.2, 0.05]} />
        <meshStandardMaterial color="#5D4037" roughness={0.7} />
      </mesh>
      {/* Door */}
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

      {/* Sign above door — wood-framed plaque with image texture + emoji/label overlay */}
      <group position={[0, h + 0.45, d / 2 + 0.02]}>
        <mesh castShadow>
          <boxGeometry args={[w * 0.65, 0.55, 0.06]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <Suspense fallback={null}>
          <SignTexturePlane id={building.id} w={w * 0.65} h={0.55} z={d / 2 + 0.025} />
        </Suspense>
        {/* Emoji on top */}
        <Text
          position={[0, 0.32, 0.045]}
          fontSize={0.24}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.012}
          outlineColor="#2D1B00"
        >
          {building.stations[0]?.icon ?? '🏫'}
        </Text>
        {/* Label below emoji */}
        <Text
          position={[0, -0.06, 0.045]}
          fontSize={0.22}
          color={trimColor}
          anchorX="center"
          anchorY="middle"
          fontWeight={700}
          maxWidth={w * 0.55}
          outlineWidth={0.01}
          outlineColor="white"
        >
          {building.label.toUpperCase()}
        </Text>
      </group>

      {/* Windows — front (on +Z face) */}
      <Window position={[-w * 0.28, 2.0, d / 2 + 0.01]} />
      <Window position={[ w * 0.28, 2.0, d / 2 + 0.01]} />
      {/* Side windows */}
      <Window position={[-w / 2 - 0.01, 2.0, 0]} side="left" />
      <Window position={[ w / 2 + 0.01, 2.0, 0]} side="right" />

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
  if (style === 'open') {
    return null; // Playground — no roof
  }
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
  if (style === 'peaked') {
    // Triangular prism running along X axis
    return (
      <group position={[0, height + 0.05, 0]}>
        <mesh castShadow rotation={[0, 0, 0]}>
          <boxGeometry args={[width + 0.3, 0.2, depth + 0.3]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        <mesh castShadow position={[0, 0.6, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[depth * 1.2, 0.18, width + 0.35]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        <mesh castShadow position={[0, 0.6, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[depth * 1.2, 0.18, width + 0.35]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      </group>
    );
  }
  if (style === 'pagoda') {
    // Two-tier stylized roof
    return (
      <group position={[0, height + 0.05, 0]}>
        <mesh castShadow>
          <boxGeometry args={[width + 0.3, 0.2, depth + 0.3]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        <mesh castShadow position={[0, 0.5, 0]}>
          <boxGeometry args={[width + 0.1, 0.2, depth + 0.1]} />
          <meshStandardMaterial color={accent} roughness={0.7} />
        </mesh>
        <mesh castShadow position={[0, 0.95, 0]}>
          <coneGeometry args={[Math.min(width, depth) * 0.55, 0.9, 4]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      </group>
    );
  }
  // gable — default
  return (
    <group position={[0, height + 0.05, 0]}>
      <mesh castShadow>
        <boxGeometry args={[width + 0.3, 0.2, depth + 0.3]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 0.65, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[depth * 1.2, 0.18, width + 0.35]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.65, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[depth * 1.2, 0.18, width + 0.35]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Chimney */}
      <mesh castShadow position={[width * 0.35, 1.1, 0]}>
        <boxGeometry args={[0.35, 0.6, 0.35]} />
        <meshStandardMaterial color="#795548" />
      </mesh>
    </group>
  );
}
