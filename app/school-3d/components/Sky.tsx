'use client';

import { useMemo } from 'react';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';

/**
 * SkyExtras — clouds + sun layered on top of drei's <Sky>.
 * Sun is a soft emissive disc with a billboard label. Clouds are flat
 * puffy shapes with a procedural CanvasTexture so they look soft without
 * needing any external asset.
 */
export default function SkyExtras() {
  const cloudTex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const g = c.getContext('2d')!;
    g.clearRect(0, 0, 256, 128);
    // Soft puffy cloud: overlapping circles with radial gradient
    const puffs = [
      [60, 70, 38], [100, 60, 42], [140, 70, 40], [180, 60, 36], [210, 75, 32],
      [85, 80, 28], [155, 80, 28], [125, 70, 35], [195, 70, 28],
    ];
    for (const [x, y, r] of puffs) {
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.7)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      g.fillStyle = grad;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  // Hand-placed clouds — large puffy billboards high in the sky.
  const clouds = [
    { x: -40, y: 28, z: -20, scale: 6 },
    { x:  20, y: 32, z: -30, scale: 7 },
    { x:  35, y: 26, z:  10, scale: 5 },
    { x: -30, y: 30, z:  18, scale: 5.5 },
    { x:   0, y: 34, z:  40, scale: 7 },
    { x: -10, y: 27, z: -38, scale: 4.5 },
  ];

  return (
    <group>
      {/* Sun — emissive disc + soft glow halo */}
      <group position={[55, 60, -40]}>
        <mesh>
          <sphereGeometry args={[3.5, 24, 24]} />
          <meshBasicMaterial color="#FFF6BD" toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[6, 24, 24]} />
          <meshBasicMaterial color="#FFEB99" transparent opacity={0.35} toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[10, 24, 24]} />
          <meshBasicMaterial color="#FFE680" transparent opacity={0.15} toneMapped={false} />
        </mesh>
      </group>

      {/* Clouds */}
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
