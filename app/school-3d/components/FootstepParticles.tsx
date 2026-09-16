'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * FootstepParticles — emits small dust circles at the player's feet every
 * STEP_INTERVAL units of motion, then fades them out over ~0.5 s.
 *
 * Cheap visual feedback for walking without a full particle system. Each
 * puff is a flat disc with a transparent material — no shadows, no
 * light interaction, just a soft circle that grows + fades.
 */

const STEP_INTERVAL = 1.2;   // world-units between puffs
const MAX_PUFFS     = 12;     // ring buffer of live puffs
const PUFF_LIFE     = 0.55;   // seconds before each puff fully fades
const PUFF_RADIUS   = 0.32;   // starting radius
const PUFF_GROW     = 0.45;   // total radius growth over its life

export default function FootstepParticles({
  positionRef,
  sprinting = false,
}: {
  positionRef: React.MutableRefObject<THREE.Vector3>;
  sprinting?: boolean;
}) {
  // Pre-allocated ring of puff descriptors. We mutate them in place rather
  // than allocating each frame, so this stays cheap.
  type Puff = {
    pos: THREE.Vector3;
    age: number;
    alive: boolean;
  };
  const puffs = useRef<Puff[]>(
    Array.from({ length: MAX_PUFFS }, () => ({
      pos: new THREE.Vector3(0, -10, 0), // hidden offscreen until used
      age: 0,
      alive: false,
    })),
  );
  const meshRefs = useRef<(THREE.Mesh | null)[]>(Array(MAX_PUFFS).fill(null));
  const lastEmitPos = useRef(new THREE.Vector3(0, 0, 8));
  const stepInterval = useRef(STEP_INTERVAL);

  useFrame((_, delta) => {
    const player = positionRef.current;
    const dist = player.distanceTo(lastEmitPos.current);

    // Throttle: emit a puff when we've moved at least STEP_INTERVAL units
    // since the last one. Sprinting shrinks the interval so puffs come
    // faster — matches the faster cadence.
    stepInterval.current = sprinting ? STEP_INTERVAL * 0.7 : STEP_INTERVAL;

    if (dist >= stepInterval.current) {
      // Find an unused slot
      const slot = puffs.current.findIndex((p) => !p.alive);
      const target = slot === -1 ? puffs.current[0] : puffs.current[slot];
      target.pos.set(player.x, 0.02, player.z);
      target.age = 0;
      target.alive = true;
      lastEmitPos.current.copy(player);
    }

    // Tick all puffs (age + fade + scale)
    for (let i = 0; i < MAX_PUFFS; i++) {
      const puff = puffs.current[i];
      const mesh = meshRefs.current[i];
      if (!mesh) continue;
      if (!puff.alive) {
        // Hide offscreen when dead
        mesh.visible = false;
        continue;
      }
      puff.age += delta;
      const t = puff.age / PUFF_LIFE;
      if (t >= 1) {
        puff.alive = false;
        mesh.visible = false;
        continue;
      }
      mesh.visible = true;
      mesh.position.copy(puff.pos);
      const r = PUFF_RADIUS + PUFF_GROW * t;
      mesh.scale.set(r, r, 1);
      const mat = mesh.material as THREE.MeshBasicMaterial | undefined;
      if (mat) {
        // Fade from 0.55 → 0 over PUFF_LIFE.
        mat.opacity = (1 - t) * 0.55;
      }
    }
  });

  return (
    <group>
      {Array.from({ length: MAX_PUFFS }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -10, 0]}
          visible={false}
        >
          <circleGeometry args={[1, 12]} />
          <meshBasicMaterial
            color="#D7C8A8"
            transparent
            opacity={0.55}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
