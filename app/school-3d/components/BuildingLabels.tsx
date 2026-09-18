'use client';

import { Billboard, Text } from '@react-three/drei';
import { BUILDINGS } from '../buildings.config';

type Props = {
  visitedBuildings: Set<string>;
};

/**
 * BuildingLabels — billboarded text floating above each building so kids
 * can see what each one is from across the plaza, not just at the door.
 *
 * Visited buildings show a ✓ prefix and tint slightly sage to signal
 * "you've been here". All labels face the camera every frame.
 */
export default function BuildingLabels({ visitedBuildings }: Props) {
  return (
    <group>
      {BUILDINGS.map((b) => {
        const visited = visitedBuildings.has(b.id);
        const icon = b.stations[0]?.icon ?? '🏫';
        // y=6 sits clearly above the tallest roof (peaked thatch peak ≈ y=4.7).
        return (
          <group key={b.id} position={[b.position[0], 6, b.position[2]]}>
            <Billboard follow>
              {/* Soft warm "shadow plate" behind the label for readability against the sky */}
              <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[4.8, 0.9]} />
                <meshBasicMaterial color="#F5E6CA" transparent opacity={0.55} depthWrite={false} />
              </mesh>
              <Text
                fontSize={0.55}
                color={visited ? '#5E7A4D' : '#2D1B00'}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.04}
                outlineColor="#F5E6CA"
                fontWeight={700}
                letterSpacing={0.05}
              >
                {visited ? `✓ ${icon} ${b.label.toUpperCase()}` : `${icon} ${b.label.toUpperCase()}`}
              </Text>
            </Billboard>
          </group>
        );
      })}
    </group>
  );
}
