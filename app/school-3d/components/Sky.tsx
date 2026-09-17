'use client';

import { useMemo } from 'react';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { makeCloudTexture } from '../textures';

/**
 * SkyExtras — sun + clouds layered on top of drei's <Sky>.
 *
 * Golden-hour positioning to match the warm lighting in page.tsx. Clouds
 * use the warm-cream CanvasTexture so they pick up the sunset tint.
 */
export default function SkyExtras() {
  const cloudTex = useMemo(() => makeCloudTexture(), []);

  // Hand-placed clouds — drifting across the warm sky.
  const clouds = [
    { x: -28, y: 18, z: -12, scale: 5.5 },
    { x:  20, y: 22, z: -20, scale: 6.5 },
    { x:  32, y: 16, z:   8, scale: 4.5 },
    { x: -22, y: 20, z:  14, scale: 5.0 },
    { x:   0, y: 24, z:  30, scale: 6.0 },
    { x: -10, y: 17, z: -28, scale: 4.0 },
    { x:  16, y: 14, z: -10, scale: 4.0 },
  ];

  return (
    <group>
      {/* Sun — low golden-hour disc with concentric warm halos. */}
      <group position={[55, 18, -45]}>
        <mesh>
          <sphereGeometry args={[3.2, 24, 24]} />
          <meshBasicMaterial color="#FFEBC2" toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[5.5, 24, 24]} />
          <meshBasicMaterial color="#FFD89B" transparent opacity={0.32} toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[9, 24, 24]} />
          <meshBasicMaterial color="#FFC585" transparent opacity={0.14} toneMapped={false} />
        </mesh>
      </group>

      {/* Clouds — warm cream, billboarded so they always face the camera */}
      {cloudTex && clouds.map((c, i) => (
        <Billboard key={i} position={[c.x, c.y, c.z]} follow={false}>
          <mesh>
            <planeGeometry args={[c.scale * 2.5, c.scale]} />
            <meshBasicMaterial map={cloudTex} transparent depthWrite={false} toneMapped={false} />
          </mesh>
        </Billboard>
      ))}
    </group>
  );
}
