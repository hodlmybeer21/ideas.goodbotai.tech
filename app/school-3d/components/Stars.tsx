'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDayNight } from '../lib/dayNightContext';

/**
 * Stars — instanced sphere field on the upper dome of the sky.
 *
 * 220 stars placed on a sphere of radius 75–95, upper hemisphere only
 * (so they only show above the camera horizon). Per-frame:
 *   - material opacity ramps with nightFactor (0 day → 1 full night)
 *   - subtle twinkle: per-star scale modulation via sin(time + phase)
 *
 * Pure InstancedMesh + procedural positions seeded with a stable RNG so
 * reloads show the same constellation.
 */

const STAR_COUNT = 220;

function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function Stars() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { starOpacity } = useDayNight();

  const stars = useMemo(() => {
    const rng = mulberry32(0xCAFEBABE);
    return Array.from({ length: STAR_COUNT }).map(() => {
      const theta = rng() * Math.PI * 2;
      // Upper hemisphere only: phi ∈ [0, π*0.45]
      const phi = rng() * Math.PI * 0.45;
      const r = 75 + rng() * 20;
      return {
        x: Math.cos(theta) * Math.sin(phi) * r,
        y: Math.cos(phi) * r,
        z: Math.sin(theta) * Math.sin(phi) * r,
        baseScale: 0.18 + rng() * 0.32,
        phase: rng() * Math.PI * 2,
        twinkleSpeed: 0.8 + rng() * 1.4,
      };
    });
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const opacity = starOpacity.current;
    const time = state.clock.elapsedTime;

    const mat = mesh.material as THREE.MeshBasicMaterial;
    mat.opacity = opacity * 0.95;
    mat.transparent = true;
    mat.depthWrite = false;

    for (let i = 0; i < STAR_COUNT; i++) {
      const s = stars[i];
      const twinkle = 1 + Math.sin(time * s.twinkleSpeed + s.phase) * 0.18;
      const finalScale = s.baseScale * twinkle * Math.max(0.0001, opacity);
      dummy.position.set(s.x, s.y, s.z);
      dummy.scale.setScalar(finalScale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, STAR_COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#FFF8E0" transparent depthWrite={false} toneMapped={false} />
    </instancedMesh>
  );
}
