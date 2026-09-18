'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { type Season, SEASON_META } from '../lib/season';

type Props = {
  season: Season;
};

type Particle = {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: number;
  rotVel: number;
  scale: number;
  phase: number;
};

/**
 * WeatherParticles — falling petals / leaves / snow based on the
 * current season.
 *
 * Single InstancedMesh per season, count and tint pulled from
 * SEASON_META. Summer renders nothing.
 *
 * Each particle wraps around the 80×80 area when it falls below y=0
 * (recycled to y=25) or drifts past x/z bounds (re-wrapped inward).
 * A side-to-side wind wobble gives the leaves a Ghibli swirl.
 */
export default function WeatherParticles({ season }: Props) {
  const meta = SEASON_META[season];
  const count = meta.particleCount;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const particles = useMemo<Particle[]>(() => {
    if (count === 0) return [];
    return Array.from({ length: count }).map(() => ({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 80,
        Math.random() * 25,
        (Math.random() - 0.5) * 80,
      ),
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * meta.spread,
        meta.fallSpeed * (0.7 + Math.random() * 0.6),
        (Math.random() - 0.5) * meta.spread,
      ),
      rot: Math.random() * Math.PI * 2,
      rotVel: (Math.random() - 0.5) * 1.8,
      scale: 0.10 + Math.random() * 0.10,
      phase: Math.random() * Math.PI * 2,
    }));
  }, [count, meta.fallSpeed, meta.spread]);

  // Reset particle positions when season changes (so we don't get a
  // mid-air bounce from one season to another)
  useEffect(() => {
    if (count === 0) return;
    particles.forEach((p) => {
      p.pos.set(
        (Math.random() - 0.5) * 80,
        Math.random() * 25,
        (Math.random() - 0.5) * 80,
      );
    });
  }, [season, count, particles]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (count === 0) return;
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const p = particles[i];

      // Side-to-side wind wobble
      const windX = Math.sin(t * 0.7 + p.phase) * meta.windStrength * 0.4;
      const windZ = Math.cos(t * 0.5 + p.phase) * meta.windStrength * 0.4;

      p.pos.x += (p.vel.x + windX) * delta;
      p.pos.y += p.vel.y * delta;
      p.pos.z += (p.vel.z + windZ) * delta;
      p.rot += p.rotVel * delta;

      // Wrap when below ground
      if (p.pos.y < 0) {
        p.pos.y = 25;
        p.pos.x = (Math.random() - 0.5) * 80;
        p.pos.z = (Math.random() - 0.5) * 80;
      }
      // Wrap horizontally so wind doesn't blow particles out forever
      if (p.pos.x > 40)  p.pos.x = -40;
      if (p.pos.x < -40) p.pos.x = 40;
      if (p.pos.z > 40)  p.pos.z = -40;
      if (p.pos.z < -40) p.pos.z = 40;

      // Leaves (autumn) tumble; sakura petals flutter more; snow falls flat
      let rotX = p.rot;
      let rotY = p.rot * 0.5;
      if (season === 'winter') {
        rotX = 0; rotY = 0;
      }

      dummy.position.copy(p.pos);
      dummy.rotation.set(rotX, rotY, p.rot);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (count === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        color={meta.color}
        side={THREE.DoubleSide}
        transparent
        opacity={0.88}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
