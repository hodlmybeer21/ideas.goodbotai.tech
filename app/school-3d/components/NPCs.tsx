'use client';

import { useEffect, useState } from 'react';
import { Billboard, Text } from '@react-three/drei';
import Humanoid from './Humanoid';

/**
 * NPCs — courtyard guides.
 *
 * Ghibli palette: dusty rose, soft sky, warm sage. Same kid-friendly
 * Humanoid component, just retuned to harmonize with the new world.
 *
 * Bellabot waves 👋 with a small speech bubble for the first 4.5s of
 * every game session — instant warmth for first-time visitors.
 */
export default function NPCs() {
  return (
    <group>
      <Bellabot />
      <NPC position={[-3, 0,  2]} color="#C9A6B0" name="Book Bot 📖"  />
      <NPC position={[ 2, 0,  3]} color="#D8B26E" name="Math Bot 🧮"  />
    </group>
  );
}

function Bellabot() {
  const [showGreeting, setShowGreeting] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowGreeting(false), 4500);
    return () => clearTimeout(t);
  }, []);

  return (
    <group position={[3, 0, -3]}>
      <Humanoid
        color="#9DB6C9"
        height={1.0}
        moving={false}
        facing={0}
        showName="Bellabot 🤖"
        bounce
      />
      {showGreeting && (
        <Billboard position={[0, 2.45, 0]} follow>
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[1.6, 0.7]} />
            <meshBasicMaterial color="#FAF1DE" transparent opacity={0.92} depthWrite={false} />
          </mesh>
          <Text
            fontSize={0.34}
            color="#2D1B00"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.025}
            outlineColor="#F5E6CA"
            fontWeight={700}
          >
            👋 Hi there!
          </Text>
        </Billboard>
      )}
    </group>
  );
}

function NPC({
  position, color, name,
}: {
  position: [number, number, number];
  color: string;
  name: string;
  bounce?: boolean;
}) {
  return (
    <group position={position}>
      <Humanoid
        color={color}
        height={1.0}
        moving={false}
        facing={0}
        showName={name}
        bounce
      />
    </group>
  );
}
