'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useDayNight } from '../lib/dayNightContext';

/**
 * Moon — emissive sphere visible only at night.
 *
 * Positioned high in the sky opposite the sun path so it's roughly
 * overhead during the night phase. Fades in via opacity + scale
 * driven by moonOpacity (which mirrors nightFactor).
 */
export default function Moon() {
  const groupRef = useRef<THREE.Group>(null);
  const haloRef  = useRef<THREE.Mesh>(null);
  const coreRef  = useRef<THREE.Mesh>(null);
  const { moonOpacity } = useDayNight();

  useFrame(() => {
    const op = moonOpacity.current;
    if (groupRef.current) {
      groupRef.current.visible = op > 0.01;
      // Tiny "breath" — slight scale modulation so it doesn't look static
      const breath = 1 + Math.sin(performance.now() * 0.0008) * 0.02;
      groupRef.current.scale.setScalar(breath * Math.max(0.4, op));
    }
    if (coreRef.current) {
      const mat = coreRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = op * 0.95;
    }
    if (haloRef.current) {
      const mat = haloRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = op * 0.35;
    }
  });

  return (
    <group ref={groupRef} position={[20, 35, -50]}>
      <Billboard follow={false}>
        {/* Soft warm halo behind the disc */}
        <mesh ref={haloRef}>
          <sphereGeometry args={[4.2, 24, 24]} />
          <meshBasicMaterial color="#E8D4B0" transparent depthWrite={false} toneMapped={false} />
        </mesh>
        {/* Moon disc */}
        <mesh ref={coreRef}>
          <sphereGeometry args={[2.6, 24, 24]} />
          <meshBasicMaterial color="#FAF1DE" transparent depthWrite={false} toneMapped={false} />
        </mesh>
        {/* Faint crater speckles */}
        <mesh position={[-0.7, 0.4, 2.0]}>
          <sphereGeometry args={[0.35, 12, 12]} />
          <meshBasicMaterial color="#E8D4B0" transparent opacity={0.45} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh position={[0.6, -0.3, 2.0]}>
          <sphereGeometry args={[0.25, 12, 12]} />
          <meshBasicMaterial color="#E8D4B0" transparent opacity={0.4} depthWrite={false} toneMapped={false} />
        </mesh>
      </Billboard>
    </group>
  );
}
