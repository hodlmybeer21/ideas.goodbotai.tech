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
 * Humanoid — stylized college-student character (procedural geometry).
 * Reads as "low-poly stylized student" — backpack, baseball cap, hoodie
 * torso, jeans, sneakers. Walking animation: opposite-pair leg/arm swing.
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

  // Proportions — slightly thinner + taller for the stylized-student look
  const s = height;
  const torsoH = 0.7 * s;
  const torsoW = 0.48 * s;
  const torsoD = 0.30 * s;
  const headR = 0.24 * s;
  const limbR = 0.085 * s;
  const armLen = 0.65 * s;
  const handR = 0.10 * s;
  const legLen = 0.75 * s;
  const shoeH = 0.12 * s;

  const accent = emissive ? '#FFFFFF' : '#1A237E';

  return (
    <group ref={root} rotation={[0, facing, 0]}>
      {/* shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.42 * s, 16]} />
        <meshBasicMaterial color="#000" transparent opacity={0.28} />
      </mesh>

      {/* Legs — jeans (dark blue) */}
      <group ref={leftLeg} position={[-torsoW * 0.22, legLen, 0]}>
        <mesh castShadow position={[0, -legLen / 2, 0]}>
          <cylinderGeometry args={[limbR, limbR * 0.95, legLen, 8]} />
          <meshStandardMaterial color="#37474F" roughness={0.75} />
        </mesh>
        {/* sneaker */}
        <mesh castShadow position={[0, -legLen - shoeH / 2, 0.04 * s]}>
          <boxGeometry args={[limbR * 2.2, shoeH, legLen * 0.6]} />
          <meshStandardMaterial color="#212121" roughness={0.5} />
        </mesh>
      </group>

      <group ref={rightLeg} position={[torsoW * 0.22, legLen, 0]}>
        <mesh castShadow position={[0, -legLen / 2, 0]}>
          <cylinderGeometry args={[limbR, limbR * 0.95, legLen, 8]} />
          <meshStandardMaterial color="#37474F" roughness={0.75} />
        </mesh>
        <mesh castShadow position={[0, -legLen - shoeH / 2, 0.04 * s]}>
          <boxGeometry args={[limbR * 2.2, shoeH, legLen * 0.6]} />
          <meshStandardMaterial color="#212121" roughness={0.5} />
        </mesh>
      </group>

      {/* Hoodie torso (the color prop) */}
      <mesh castShadow position={[0, legLen + torsoH / 2, 0]}>
        <boxGeometry args={[torsoW, torsoH, torsoD]} />
        <meshStandardMaterial color={color} roughness={0.65} />
      </mesh>

      {/* Hood (small bump at the top of the hoodie) */}
      <mesh castShadow position={[0, legLen + torsoH + 0.05 * s, 0.08 * s]}>
        <sphereGeometry args={[torsoW * 0.4, 12, 12, 0, Math.PI, 0, Math.PI * 0.5]} />
        <meshStandardMaterial color={color} roughness={0.65} />
      </mesh>

      {/* Backpack on the back */}
      <group position={[0, legLen + torsoH * 0.6, -torsoD / 2 - 0.10 * s]}>
        <mesh castShadow>
          <boxGeometry args={[torsoW * 0.7, torsoH * 0.85, 0.20 * s]} />
          <meshStandardMaterial color="#1565C0" roughness={0.7} />
        </mesh>
        {/* straps */}
        <mesh position={[-torsoW * 0.22, 0, 0.10 * s]}>
          <boxGeometry args={[0.04 * s, torsoH * 0.7, 0.02 * s]} />
          <meshStandardMaterial color="#0D47A1" roughness={0.7} />
        </mesh>
        <mesh position={[torsoW * 0.22, 0, 0.10 * s]}>
          <boxGeometry args={[0.04 * s, torsoH * 0.7, 0.02 * s]} />
          <meshStandardMaterial color="#0D47A1" roughness={0.7} />
        </mesh>
      </group>

      {/* Head */}
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
        <mesh position={[0, -0.10 * s, headR * 0.85]}>
          <torusGeometry args={[0.10 * s, 0.022 * s, 8, 12, Math.PI]} />
          <meshStandardMaterial color={accent} />
        </mesh>
      </group>

      {/* Baseball cap — brim (front-facing box) + crown (cone) */}
      <group position={[0, legLen + torsoH + headR * 1.85, 0]}>
        {/* crown */}
        <mesh castShadow position={[0, 0.04 * s, 0]}>
          <coneGeometry args={[headR * 1.05, 0.18 * s, 12]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        {/* brim — sticks out forward */}
        <mesh castShadow position={[0, 0, headR * 0.7]}>
          <boxGeometry args={[headR * 1.6, 0.02 * s, 0.18 * s]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        {/* cap band — thin cylinder at the base of the crown */}
        <mesh castShadow position={[0, -0.06 * s, 0]}>
          <cylinderGeometry args={[headR * 1.05, headR * 1.05, 0.04 * s, 12]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      </group>

      {/* Left arm */}
      <group ref={leftArm} position={[-torsoW / 2 - limbR * 0.4, legLen + torsoH - 0.05 * s, 0]}>
        <mesh castShadow position={[0, -armLen / 2, 0]}>
          <cylinderGeometry args={[limbR, limbR * 0.95, armLen, 8]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        <mesh castShadow position={[0, -armLen, 0]}>
          <sphereGeometry args={[0.10 * s, 8, 8]} />
          <meshStandardMaterial color={skin} roughness={0.75} />
        </mesh>
      </group>

      {/* Right arm */}
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

      {/* Floating name label */}
      {showName && (
        <Billboard position={[0, legLen + torsoH + headR * 2 + 0.5, 0]}>
          <Text
            fontSize={0.32 * s}
            color="#2D1B00"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02 * s}
            outlineColor="#FFFFFF"
          >
            {showName}
          </Text>
        </Billboard>
      )}
    </group>
  );
}
