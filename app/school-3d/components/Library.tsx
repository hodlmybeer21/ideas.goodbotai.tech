'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const LIBRARY_POS: [number, number, number] = [0, 0, -6];
const TRIGGER_DISTANCE = 4;

/**
 * Library building — cream walls, blue trim, dark roof, interactive door.
 * Polls playerPosRef each frame to detect proximity to the door.
 */
export default function Library({
  playerPosRef,
  onPlayerNear,
}: {
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
  onPlayerNear: (near: boolean) => void;
}) {
  const wasNearRef = useRef(false);

  useFrame(() => {
    const player = playerPosRef.current;
    const dx = player.x - LIBRARY_POS[0];
    const dz = player.z - LIBRARY_POS[2];
    const dist = Math.sqrt(dx * dx + dz * dz);

    const near = dist < TRIGGER_DISTANCE;
    if (near !== wasNearRef.current) {
      wasNearRef.current = near;
      onPlayerNear(near);
    }
  });

  return (
    <group position={LIBRARY_POS}>
      {/* Main building — cream walls */}
      <mesh castShadow receiveShadow position={[0, 1.5, 0]}>
        <boxGeometry args={[6, 3, 4]} />
        <meshStandardMaterial color="#F5F0E8" roughness={0.7} />
      </mesh>

      {/* Blue trim band along the top */}
      <mesh castShadow position={[0, 2.95, 0]}>
        <boxGeometry args={[6.1, 0.18, 4.1]} />
        <meshStandardMaterial color="#4FC3F7" roughness={0.6} />
      </mesh>

      {/* Blue trim band along the bottom */}
      <mesh castShadow position={[0, 0.15, 0]}>
        <boxGeometry args={[6.1, 0.18, 4.1]} />
        <meshStandardMaterial color="#4FC3F7" roughness={0.6} />
      </mesh>

      {/* Roof — dark sloped using two angled boxes (simple gable) */}
      <mesh castShadow position={[0, 3.55, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[6.4, 0.2, 4.3]} />
        <meshStandardMaterial color="#5D4037" roughness={0.8} />
      </mesh>
      {/* Roof slant — pitched triangle using BoxGeometry rotated */}
      <group position={[0, 3.65, 0]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 6]}>
          <boxGeometry args={[3.6, 0.18, 4.4]} />
          <meshStandardMaterial color="#4E342E" roughness={0.8} />
        </mesh>
        <mesh castShadow rotation={[0, 0, -Math.PI / 6]}>
          <boxGeometry args={[3.6, 0.18, 4.4]} />
          <meshStandardMaterial color="#4E342E" roughness={0.8} />
        </mesh>
      </group>

      {/* Roof peak — small chimney-ish marker */}
      <mesh castShadow position={[2.4, 4.1, 0]}>
        <boxGeometry args={[0.4, 0.6, 0.4]} />
        <meshStandardMaterial color="#795548" />
      </mesh>

      {/* Windows (left + right) */}
      <Window position={[-1.8, 2, 2.001]} />
      <Window position={[1.8, 2, 2.001]} />
      {/* Side windows */}
      <Window position={[-3.001, 2, 0]} side="left" />
      <Window position={[3.001, 2, 0]} side="right" />

      {/* Door frame (brown surround) */}
      <mesh castShadow position={[0, 1.1, 2.01]}>
        <boxGeometry args={[1.2, 2.2, 0.06]} />
        <meshStandardMaterial color="#5D4037" roughness={0.7} />
      </mesh>
      {/* Door (slightly inset) */}
      <mesh castShadow position={[0, 1.1, 2.06]}>
        <boxGeometry args={[0.95, 2, 0.05]} />
        <meshStandardMaterial color="#8D6E63" roughness={0.6} />
      </mesh>
      {/* Door window */}
      <mesh position={[0, 1.6, 2.09]}>
        <boxGeometry args={[0.55, 0.7, 0.02]} />
        <meshStandardMaterial color="#B3E5FC" emissive="#B3E5FC" emissiveIntensity={0.15} />
      </mesh>
      {/* Door handle */}
      <mesh position={[0.32, 1.1, 2.1]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#FFD54F" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Sign above door */}
      <group position={[0, 3.05, 2.02]}>
        <mesh>
          <boxGeometry args={[2.2, 0.55, 0.05]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <Text
          position={[0, 0, 0.04]}
          fontSize={0.32}
          color="#4FC3F7"
          anchorX="center"
          anchorY="middle"
          fontWeight={700}
        >
          📚 LIBRARY
        </Text>
      </group>

      {/* Glowing yellow trigger zone in front of door (visual + functional) */}
      <mesh position={[0, 0.05, 2.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 16]} />
        <meshStandardMaterial color="#FFD54F" emissive="#FFD54F" emissiveIntensity={0.6} transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function Window({ position, side }: { position: [number, number, number]; side?: 'left' | 'right' }) {
  const rotY = side === 'left' ? Math.PI / 2 : side === 'right' ? -Math.PI / 2 : 0;
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* Frame */}
      <mesh>
        <boxGeometry args={[0.9, 0.9, 0.06]} />
        <meshStandardMaterial color="#5D4037" roughness={0.7} />
      </mesh>
      {/* Glass */}
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[0.7, 0.7, 0.03]} />
        <meshStandardMaterial color="#B3E5FC" emissive="#B3E5FC" emissiveIntensity={0.2} transparent opacity={0.85} />
      </mesh>
      {/* Cross mullion */}
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
