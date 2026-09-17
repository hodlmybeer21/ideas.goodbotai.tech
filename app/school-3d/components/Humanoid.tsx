'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';

type Props = {
  color: string;
  skin?: string;       // skin tone for head/hands/feet
  height?: number;     // overall height scale, default 1
  moving?: boolean;    // whether to animate walk cycle
  facing?: number;     // radians Y rotation
  showName?: string;   // floating name label
  bounce?: boolean;    // gentle idle bounce
  emissive?: boolean;  // for hover/active state
  hairColor?: string;  // override default brown hair
};

/**
 * Humanoid — chibi-proportioned kid character used for the player and NPCs.
 *
 * Ghibli-pastoral adjustments:
 *   - Bigger head relative to body (chibi / Ghibli signature)
 *   - Rosy cheek dots instead of stark smile torus
 *   - Warmer skin tones, gentler eye proportions
 *   - Round, simple shapes (no harsh box edges)
 *
 * Walk animation: when `moving` is true, legs/arms swing in opposite
 * pairs (L-arm with R-leg, R-arm with L-leg) using a sine wave on
 * elapsed time. Idle state: subtle bob if `bounce`.
 */
export default function Humanoid({
  color,
  skin = '#FFD7A8',
  height = 1.0,
  moving = false,
  facing = 0,
  showName,
  bounce = false,
  emissive = false,
  hairColor = '#5C4128',
}: Props) {
  const root        = useRef<THREE.Group>(null);
  const leftArm     = useRef<THREE.Group>(null);
  const rightArm    = useRef<THREE.Group>(null);
  const leftLeg     = useRef<THREE.Group>(null);
  const rightLeg    = useRef<THREE.Group>(null);
  const walkPhase   = useRef(0);

  useFrame((state, delta) => {
    if (bounce && root.current) {
      root.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 2.5)) * 0.18;
    }
    if (moving) {
      walkPhase.current += delta * 8;
    } else {
      walkPhase.current += delta * 2;
    }
    const t = walkPhase.current;
    const swing = Math.sin(t) * (moving ? 0.9 : 0.15);
    if (leftArm.current)  leftArm.current.rotation.x =  swing;
    if (rightArm.current) rightArm.current.rotation.x = -swing;
    if (leftLeg.current)  leftLeg.current.rotation.x = -swing;
    if (rightLeg.current) rightLeg.current.rotation.x =  swing;
    if (root.current) {
      const bob = moving ? Math.abs(Math.sin(t * 2)) * 0.05 : 0;
      root.current.position.y = (bounce ? Math.abs(Math.sin(state.clock.elapsedTime * 2.5)) * 0.18 : 0) + bob;
    }
  });

  // Chibi proportions — bigger head, shorter torso, rounder overall.
  const s = height;
  const torsoH = 0.5 * s;   // was 0.6
  const torsoW = 0.55 * s;
  const torsoD = 0.32 * s;
  const headR = 0.36 * s;   // was 0.28 — chibi head/body ratio
  const limbR = 0.10 * s;
  const armLen = 0.55 * s;
  const legLen = 0.55 * s;  // was 0.6
  const shoeH = 0.10 * s;
  const handR = 0.12 * s;

  const eyeColor = emissive ? '#FFFFFF' : '#2D1B00';

  return (
    <group ref={root} rotation={[0, facing, 0]}>
      {/* Soft ground shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.4 * s, 16]} />
        <meshBasicMaterial color="#3E2723" transparent opacity={0.22} />
      </mesh>

      {/* Torso (rounded box via higher segments on a regular box still reads as soft in this scale) */}
      <mesh castShadow position={[0, legLen + torsoH / 2, 0]}>
        <boxGeometry args={[torsoW, torsoH, torsoD]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>

      {/* Head — bigger, with rosy cheeks and small dot eyes (Ghibli tot look) */}
      <group position={[0, legLen + torsoH + headR * 0.55, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[headR, 18, 18]} />
          <meshStandardMaterial color={skin} roughness={0.85} />
        </mesh>
        {/* Hair — larger fluff cap that hugs the top half of the head */}
        <mesh castShadow position={[0, headR * 0.45, 0]}>
          <sphereGeometry args={[headR * 1.02, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color={hairColor} roughness={0.95} />
        </mesh>
        {/* Tiny dot eyes */}
        <mesh position={[-0.12 * s, 0.02 * s, headR * 0.88]}>
          <sphereGeometry args={[0.04 * s, 8, 8]} />
          <meshStandardMaterial color={eyeColor} />
        </mesh>
        <mesh position={[0.12 * s, 0.02 * s, headR * 0.88]}>
          <sphereGeometry args={[0.04 * s, 8, 8]} />
          <meshStandardMaterial color={eyeColor} />
        </mesh>
        {/* Rosy cheeks — soft pink dots */}
        <mesh position={[-0.18 * s, -0.08 * s, headR * 0.7]}>
          <sphereGeometry args={[0.06 * s, 8, 8]} />
          <meshBasicMaterial color="#E8B4A0" transparent opacity={0.55} />
        </mesh>
        <mesh position={[0.18 * s, -0.08 * s, headR * 0.7]}>
          <sphereGeometry args={[0.06 * s, 8, 8]} />
          <meshBasicMaterial color="#E8B4A0" transparent opacity={0.55} />
        </mesh>
        {/* Tiny smile — subtle curve via small dark line */}
        <mesh position={[0, -0.14 * s, headR * 0.88]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.07 * s, 0.018 * s, 6, 10, Math.PI]} />
          <meshStandardMaterial color="#7A3E2A" roughness={0.7} />
        </mesh>
      </group>

      {/* Left arm */}
      <group ref={leftArm} position={[-torsoW / 2 - limbR * 0.4, legLen + torsoH - 0.05 * s, 0]}>
        <mesh castShadow position={[0, -armLen / 2, 0]}>
          <cylinderGeometry args={[limbR, limbR * 0.95, armLen, 8]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0, -armLen, 0]}>
          <sphereGeometry args={[handR, 10, 10]} />
          <meshStandardMaterial color={skin} roughness={0.85} />
        </mesh>
      </group>

      {/* Right arm */}
      <group ref={rightArm} position={[torsoW / 2 + limbR * 0.4, legLen + torsoH - 0.05 * s, 0]}>
        <mesh castShadow position={[0, -armLen / 2, 0]}>
          <cylinderGeometry args={[limbR, limbR * 0.95, armLen, 8]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0, -armLen, 0]}>
          <sphereGeometry args={[handR, 10, 10]} />
          <meshStandardMaterial color={skin} roughness={0.85} />
        </mesh>
      </group>

      {/* Left leg — warm brown pants */}
      <group ref={leftLeg} position={[-torsoW * 0.22, legLen, 0]}>
        <mesh castShadow position={[0, -legLen / 2, 0]}>
          <cylinderGeometry args={[limbR * 1.05, limbR * 0.95, legLen, 8]} />
          <meshStandardMaterial color="#6B4631" roughness={0.85} />
        </mesh>
        <mesh castShadow position={[0, -legLen - shoeH / 2, 0.04 * s]}>
          <boxGeometry args={[limbR * 2.2, shoeH, legLen * 0.6]} />
          <meshStandardMaterial color="#5C4128" roughness={0.7} />
        </mesh>
      </group>

      {/* Right leg */}
      <group ref={rightLeg} position={[torsoW * 0.22, legLen, 0]}>
        <mesh castShadow position={[0, -legLen / 2, 0]}>
          <cylinderGeometry args={[limbR * 1.05, limbR * 0.95, legLen, 8]} />
          <meshStandardMaterial color="#6B4631" roughness={0.85} />
        </mesh>
        <mesh castShadow position={[0, -legLen - shoeH / 2, 0.04 * s]}>
          <boxGeometry args={[limbR * 2.2, shoeH, legLen * 0.6]} />
          <meshStandardMaterial color="#5C4128" roughness={0.7} />
        </mesh>
      </group>

      {/* Floating name label */}
      {showName && (
        <Billboard position={[0, legLen + torsoH + headR * 2.1 + 0.4, 0]}>
          <Text
            fontSize={0.32 * s}
            color="#2D1B00"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.04 * s}
            outlineColor="#F5E6CA"
          >
            {showName}
          </Text>
        </Billboard>
      )}
    </group>
  );
}
