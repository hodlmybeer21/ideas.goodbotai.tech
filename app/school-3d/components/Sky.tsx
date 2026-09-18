'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { makeCloudTexture } from '../textures';
import { useDayNight } from '../lib/dayNightContext';

/**
 * SkyExtras — visible warm sun disc + clouds layered on top of drei's
 * <Sky>. Fades out at night so the moon and stars take over visually.
 *
 * Subscribes to the day/night cycle via useDayNight() — when nightFactor
 * ramps up, the sun group + clouds fade out (opacity 1 → 0).
 */
export default function SkyExtras() {
  const cloudTex = useMemo(() => makeCloudTexture(), []);

  const sunGroupRef  = useRef<THREE.Group>(null);
  const sunCoreRef   = useRef<THREE.Mesh>(null);
  const sunHalo1Ref  = useRef<THREE.Mesh>(null);
  const sunHalo2Ref  = useRef<THREE.Mesh>(null);
  const cloudRefs    = useRef<THREE.Mesh[]>([]);

  const { moonOpacity } = useDayNight();

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

  useFrame(() => {
    // Day-ness = inverse of moon opacity (moonOpacity 1 → nightFactor 1 → no day)
    const op = Math.max(0, 1 - moonOpacity.current);

    if (sunGroupRef.current) {
      sunGroupRef.current.visible = op > 0.02;
      // Subtle scale down as the sun sets for a smoother feeling
      sunGroupRef.current.scale.setScalar(0.7 + op * 0.3);
    }
    if (sunCoreRef.current) {
      (sunCoreRef.current.material as THREE.MeshBasicMaterial).opacity = op;
    }
    if (sunHalo1Ref.current) {
      (sunHalo1Ref.current.material as THREE.MeshBasicMaterial).opacity = op * 0.32;
    }
    if (sunHalo2Ref.current) {
      (sunHalo2Ref.current.material as THREE.MeshBasicMaterial).opacity = op * 0.14;
    }
    cloudRefs.current.forEach((mesh) => {
      if (mesh) {
        (mesh.material as THREE.MeshBasicMaterial).opacity = op;
      }
    });
  });

  return (
    <group>
      {/* Sun — warm disc + concentric halos. Fades to invisible at night. */}
      <group ref={sunGroupRef} position={[55, 18, -45]}>
        <mesh ref={sunCoreRef}>
          <sphereGeometry args={[3.2, 24, 24]} />
          <meshBasicMaterial color="#FFEBC2" toneMapped={false} transparent />
        </mesh>
        <mesh ref={sunHalo1Ref}>
          <sphereGeometry args={[5.5, 24, 24]} />
          <meshBasicMaterial color="#FFD89B" transparent opacity={0.32} toneMapped={false} />
        </mesh>
        <mesh ref={sunHalo2Ref}>
          <sphereGeometry args={[9, 24, 24]} />
          <meshBasicMaterial color="#FFC585" transparent opacity={0.14} toneMapped={false} />
        </mesh>
      </group>

      {/* Clouds — warm cream, billboarded so they always face the camera */}
      {cloudTex && clouds.map((c, i) => (
        <Billboard key={i} position={[c.x, c.y, c.z]} follow={false}>
          <mesh
            ref={(m) => { if (m) cloudRefs.current[i] = m; }}
          >
            <planeGeometry args={[c.scale * 2.5, c.scale]} />
            <meshBasicMaterial
              map={cloudTex}
              transparent
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </Billboard>
      ))}
    </group>
  );
}
