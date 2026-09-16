'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Humanoid from './Humanoid';

/**
 * NPCs — courtyard guides. All use the Humanoid component so they share
 * the kid-style character look with the player. Each has a fixed position
 * and one optional bounce for visual life.
 *
 * When the player walks within `LOOK_RANGE`, each guide smoothly turns to
 * face them — gives the courtyard a bit of life without needing full
 * NPC pathing.
 */
const LOOK_RANGE = 8;

export default function NPCs({ playerPosRef }: { playerPosRef?: React.MutableRefObject<THREE.Vector3> }) {
  return (
    <group>
      <NPC position={[ 3, 0, -3]} color="#6BCBFF" skin="#FFE0B2" name="Bellabot 🤖" emoji="🤖" bounce playerPosRef={playerPosRef} />
      <NPC position={[-3, 0,  2]} color="#C084FC" skin="#FFE0B2" name="Book Bot 📖"  emoji="📖"          playerPosRef={playerPosRef} />
      <NPC position={[ 2, 0,  3]} color="#FFD54F" skin="#FFE0B2" name="Math Bot 🧮"  emoji="🧮"          playerPosRef={playerPosRef} />
    </group>
  );
}

function NPC({
  position, color, name, bounce, playerPosRef,
}: {
  position: [number, number, number];
  color: string;
  skin: string;
  name: string;
  emoji: string;
  bounce?: boolean;
  playerPosRef?: React.MutableRefObject<THREE.Vector3>;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const facingRef = useRef(0);

  useFrame(() => {
    if (!meshRef.current || !playerPosRef?.current) return;
    const dx = playerPosRef.current.x - position[0];
    const dz = playerPosRef.current.z - position[2];
    const dist = Math.sqrt(dx * dx + dz * dz);
    // Only turn to face the player when they're nearby — otherwise the
    // guides just face forward (+Z) like a static statue.
    if (dist < LOOK_RANGE && dist > 0.1) {
      const target = Math.atan2(dx, dz);
      // Shortest-path lerp — handles the ±π wrap so the body doesn't spin.
      let delta = target - facingRef.current;
      while (delta >  Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      facingRef.current += delta * 0.12;
    }
    meshRef.current.rotation.y = facingRef.current;
  });

  return (
    <group ref={meshRef} position={position}>
      <Humanoid
        color={color}
        height={1.0}
        moving={false}
        facing={0}
        showName={name}
        bounce={bounce}
      />
    </group>
  );
}
