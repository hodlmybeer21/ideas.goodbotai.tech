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
};

/**
 * Humanoid — kid-sized blocky character with head, torso, arms, legs.
 * Used for both the player and the courtyard NPCs.
 *
 * Walk animation: when `moving` is true, legs/arms swing in opposite
 * pairs (L-arm with R-leg, R-arm with L-leg) using a sine wave on
 * elapsed time. Idle state: subtle bob if `bounce`.
 */
export default function Humanoid({
  color,
  skin = '#FFE0B2',
  height = 1.0,
  moving = false,
  facing = 0,
  showName,
  bounce = false,
  emissive = false,
}: Props) {
  const root        = useRef<THREE.Group>(null);
  const leftArm     = useRef<THREE.Group>(null);
  const rightArm    = useRef<THREE.Group>(null);
  const leftLeg     = useRef<THREE.Group>(null);
  const rightLeg    = useRef<THREE.Group>(null);
  const walkPhase   = useRef(0);

  useFrame((state, delta) => {
    // Idle bounce
    if (bounce && root.current) {
      root.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 2.5)) * 0.18;
    }
    // Walk cycle
    if (moving) {
      walkPhase.current += delta * 8; // swing speed
    } else {
      walkPhase.current += delta * 2; // slow decay
    }
    const t = walkPhase.current;
    const swing = Math.sin(t) * (moving ? 0.9 : 0.15);
    if (leftArm.current)  leftArm.current.rotation.x =  swing;
    if (rightArm.current) rightArm.current.rotation.x = -swing;
    if (leftLeg.current)  leftLeg.current.rotation.x = -swing;
    if (rightLeg.current) rightLeg.current.rotation.x =  swing;
    // Subtle torso bob
    if (root.current) {
      const bob = moving ? Math.abs(Math.sin(t * 2)) * 0.05 : 0;
      root.current.position.y = (bounce ? Math.abs(Math.sin(state.clock.elapsedTime * 2.5)) * 0.18 : 0) + bob;
    }
  });

  // Proportions (all multiplied by height for scale)
  const s = height;
  const torsoH = 0.6 * s;
  const torsoW = 0.55 * s;
  const torsoD = 0.32 * s;
  const headR = 0.28 * s;
  const limbR = 0.10 * s;
  const armLen = 0.6 * s;
  const legLen = 0.6 * s;
  const shoeH = 0.12 * s;
  const handR = 0.11 * s;

  const accent = emissive ? '#FFFFFF' : '#1A237E';

  return (
    <group ref={root} rotation={[0, facing, 0]}>
      {/* shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.42 * s, 16]} />
        <meshBasicMaterial color="#000" transparent opacity={0.28} />
      </mesh>

      {/* Torso */}
      <mesh castShadow position={[0, legLen + torsoH / 2, 0]}>
        <boxGeometry args={[torsoW, torsoH, torsoD]} />
        <meshStandardMaterial color={color} roughness={0.65} />
      </mesh>

      {/* Head (slightly above torso) */}
      <group position={[0, legLen + torsoH + headR * 0.6, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[headR, 16, 16]} />
          <meshStandardMaterial color={skin} roughness={0.75} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.10 * s, 0.03 * s, headR * 0.85]}>
          <sphereGeometry args={[0.045 * s, 8, 8]} />
          <meshStandardMaterial color={accent} />
        </mesh>
        <mesh position={[0.10 * s, 0.03 * s, headR * 0.85]}>
          <sphereGeometry args={[0.045 * s, 8, 8]} />
          <meshStandardMaterial color={accent} />
        </mesh>
        {/* Smile */}
        <mesh position={[0, -0.10 * s, headR * 0.85]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.10 * s, 0.022 * s, 8, 12, Math.PI]} />
          <meshStandardMaterial color={accent} />
        </mesh>
        {/* Tiny hair tuft */}
        <mesh position={[0, headR * 0.85, 0]} castShadow>
          <coneGeometry args={[0.10 * s, 0.18 * s, 6]} />
          <meshStandardMaterial color="#3E2723" roughness={0.8} />
        </mesh>
      </group>

      {/* Left arm — pivot at shoulder */}
      <group ref={leftArm} position={[-torsoW / 2 - limbR * 0.4, legLen + torsoH - 0.05 * s, 0]}>
        <mesh castShadow position={[0, -armLen / 2, 0]}>
          <cylinderGeometry args={[limbR, limbR * 0.95, armLen, 8]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        {/* hand */}
        <mesh castShadow position={[0, -armLen, 0]}>
          <sphereGeometry args={[handR, 8, 8]} />
          <meshStandardMaterial color={skin} roughness={0.75} />
        </mesh>
      </group>

      {/* Right arm — pivot at shoulder */}
      <group ref={rightArm} position={[torsoW / 2 + limbR * 0.4, legLen + torsoH - 0.05 * s, 0]}>
        <mesh castShadow position={[0, -armLen / 2, 0]}>
          <cylinderGeometry args={[limbR, limbR * 0.95, armLen, 8]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        <mesh castShadow position={[0, -armLen, 0]}>
          <sphereGeometry args={[handR, 8, 8]} />
          <meshStandardMaterial color={skin} roughness={0.75} />
        </mesh>
      </group>

      {/* Left leg — pivot at hip */}
      <group ref={leftLeg} position={[-torsoW * 0.22, legLen, 0]}>
        <mesh castShadow position={[0, -legLen / 2, 0]}>
          <cylinderGeometry args={[limbR * 1.05, limbR * 0.95, legLen, 8]} />
          <meshStandardMaterial color="#37474F" roughness={0.7} />
        </mesh>
        {/* shoe */}
        <mesh castShadow position={[0, -legLen - shoeH / 2, 0.04 * s]}>
          <boxGeometry args={[limbR * 2.2, shoeH, legLen * 0.6]} />
          <meshStandardMaterial color="#212121" roughness={0.5} />
        </mesh>
      </group>

      {/* Right leg */}
      <group ref={rightLeg} position={[torsoW * 0.22, legLen, 0]}>
        <mesh castShadow position={[0, -legLen / 2, 0]}>
          <cylinderGeometry args={[limbR * 1.05, limbR * 0.95, legLen, 8]} />
          <meshStandardMaterial color="#37474F" roughness={0.7} />
        </mesh>
        <mesh castShadow position={[0, -legLen - shoeH / 2, 0.04 * s]}>
          <boxGeometry args={[limbR * 2.2, shoeH, legLen * 0.6]} />
          <meshStandardMaterial color="#212121" roughness={0.5} />
        </mesh>
      </group>

      {/* Floating name label */}
      {showName && (
        <Billboard position={[0, legLen + torsoH + headR * 2 + 0.5, 0]}>
          <Text
            fontSize={0.32 * s}
            color="#2D1B00"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.04 * s}
            outlineColor="white"
          >
            {showName}
          </Text>
        </Billboard>
      )}
    </group>
  );
}
