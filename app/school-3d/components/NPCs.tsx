'use client';

import Humanoid from './Humanoid';

/**
 * NPCs — courtyard guides. All use the Humanoid component so they share
 * the kid-style character look with the player. Each has a fixed position
 * and one optional bounce for visual life.
 */
export default function NPCs() {
  return (
    <group>
      <NPC position={[ 3, 0, -3]} color="#6BCBFF" skin="#FFE0B2" name="Bellabot 🤖" emoji="🤖" bounce />
      <NPC position={[-3, 0,  2]} color="#C084FC" skin="#FFE0B2" name="Book Bot 📖"  emoji="📖" />
      <NPC position={[ 2, 0,  3]} color="#FFD54F" skin="#FFE0B2" name="Math Bot 🧮"  emoji="🧮" />
    </group>
  );
}

function NPC({
  position, color, name, bounce,
}: {
  position: [number, number, number];
  color: string;
  skin: string;
  name: string;
  emoji: string;
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
