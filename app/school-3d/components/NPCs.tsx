'use client';

import Humanoid from './Humanoid';

/**
 * NPCs — courtyard guides.
 *
 * Ghibli palette: dusty rose, soft sky, warm sage. Same kid-friendly
 * Humanoid component, just retuned to harmonize with the new world.
 */
export default function NPCs() {
  return (
    <group>
      <NPC position={[ 3, 0, -3]} color="#9DB6C9" name="Bellabot 🤖" bounce />
      <NPC position={[-3, 0,  2]} color="#C9A6B0" name="Book Bot 📖"  />
      <NPC position={[ 2, 0,  3]} color="#D8B26E" name="Math Bot 🧮"  />
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
