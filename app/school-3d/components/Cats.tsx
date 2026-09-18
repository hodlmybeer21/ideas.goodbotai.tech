'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Cats — three procedural cats wandering the plaza.
 *
 * Each cat has its own wander state machine:
 *   walking → arrive at waypoint → sitting for a few seconds → walking
 *
 * Geometry per cat: stretched body + head + 2 cone ears + curved tail
 * + 4 short cylinder legs. When sitting, the body lowers and the tail
 * curls. Ghibli-orange, smoky-gray, and cream-white coat variants.
 *
 * Stays inside the central courtyard area (radius ~9) so cats don't
 * interfere with gameplay near the buildings.
 */

type CatState = 'walking' | 'sitting';

type CatData = {
  position: THREE.Vector3;
  target: THREE.Vector3;
  facing: number;
  state: CatState;
  sitTimer: number;
  walkTimer: number;
  palette: { body: string; belly: string; ears: string };
  scale: number;
};

const PLAZA_RADIUS = 9;
const CAT_COUNT = 3;
const WALK_SPEED = 1.4;

function randomPlazaPoint(rng: () => number): THREE.Vector3 {
  const r = Math.sqrt(rng()) * PLAZA_RADIUS;
  const a = rng() * Math.PI * 2;
  return new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
}

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

export default function Cats() {
  const catsRef = useRef<CatData[]>([]);

  // Initialize once with stable seeded RNG so the cats are the same on
  // every reload (no shuffle).
  if (catsRef.current.length === 0) {
    const rng = mulberry32(0x42cafe);
    const palettes = [
      { body: '#D8945C', belly: '#F5E0BE', ears: '#8B5A3C' }, // orange tabby
      { body: '#888B8E', belly: '#B0B4B8', ears: '#4A4D50' }, // smoky gray
      { body: '#F0E6D2', belly: '#FFFFFF', ears: '#C9A982' }, // cream
    ];
    catsRef.current = Array.from({ length: CAT_COUNT }).map((_, i) => {
      const start = randomPlazaPoint(rng);
      return {
        position: start.clone(),
        target: start.clone(),
        facing: rng() * Math.PI * 2,
        state: 'sitting',
        sitTimer: 1 + rng() * 3,
        walkTimer: 0,
        palette: palettes[i % palettes.length],
        scale: 0.9 + rng() * 0.25,
      };
    });
  }

  const cats = catsRef.current;

  useFrame((_, delta) => {
    for (const c of cats) {
      if (c.state === 'sitting') {
        c.sitTimer -= delta;
        if (c.sitTimer <= 0) {
          c.state = 'walking';
          // Pick a new waypoint
          const rng = Math.random;
          const r = Math.sqrt(rng()) * PLAZA_RADIUS;
          const a = rng() * Math.PI * 2;
          c.target.set(Math.cos(a) * r, 0, Math.sin(a) * r);
          c.walkTimer = 4 + rng() * 5;
        }
      } else {
        // Walking toward target
        const dx = c.target.x - c.position.x;
        const dz = c.target.z - c.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 0.15) {
          c.state = 'sitting';
          c.sitTimer = 3 + Math.random() * 5;
        } else {
          const step = Math.min(WALK_SPEED * delta, dist);
          c.position.x += (dx / dist) * step;
          c.position.z += (dz / dist) * step;
          c.facing = Math.atan2(dx, dz);
          c.walkTimer -= delta;
          if (c.walkTimer <= 0) {
            // Mid-walk rest — sometimes cats just sit where they are
            c.state = 'sitting';
            c.sitTimer = 2 + Math.random() * 4;
          }
        }
      }
    }
  });

  return (
    <group>
      {cats.map((c, i) => (
        <Cat key={i} data={c} />
      ))}
    </group>
  );
}

function Cat({ data }: { data: CatData }) {
  const root  = useRef<THREE.Group>(null);
  const body  = useRef<THREE.Group>(null);
  const tail  = useRef<THREE.Mesh>(null);

  // Pre-compute a stable walk-cycle phase per cat
  const walkPhase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state, delta) => {
    if (!root.current) return;
    root.current.position.copy(data.position);
    root.current.rotation.y = data.facing;

    const isWalking = data.state === 'walking';
    const isSitting = data.state === 'sitting';

    // Sit: lower the body, bring tail curled around
    if (body.current) {
      const targetY = isSitting ? 0.25 : 0.4;
      body.current.position.y += (targetY - body.current.position.y) * Math.min(1, delta * 6);
    }

    // Tail wiggle — gentle wave when sitting, sharper swish when walking
    if (tail.current) {
      const speed = isWalking ? 6 : 1.8;
      tail.current.rotation.z = Math.sin(state.clock.elapsedTime * speed + walkPhase) * (isWalking ? 0.35 : 0.18);
    }
  });

  const s = data.scale;
  return (
    <group ref={root}>
      <group ref={body}>
        {/* Body — squished sphere */}
        <mesh castShadow position={[0, 0.3 * s, 0]} scale={[1, 0.85, 1.3]}>
          <sphereGeometry args={[0.32 * s, 12, 10]} />
          <meshStandardMaterial color={data.palette.body} roughness={0.95} />
        </mesh>
        {/* Belly stripe — slightly lighter underside */}
        <mesh position={[0, 0.22 * s, 0.08 * s]} scale={[0.8, 0.5, 0.9]}>
          <sphereGeometry args={[0.28 * s, 10, 8]} />
          <meshStandardMaterial color={data.palette.belly} roughness={0.95} />
        </mesh>

        {/* Head */}
        <mesh castShadow position={[0, 0.5 * s, 0.32 * s]}>
          <sphereGeometry args={[0.22 * s, 12, 12]} />
          <meshStandardMaterial color={data.palette.body} roughness={0.95} />
        </mesh>
        {/* Cheek/muzzle patch */}
        <mesh position={[0, 0.43 * s, 0.5 * s]} scale={[1, 0.85, 0.7]}>
          <sphereGeometry args={[0.13 * s, 10, 10]} />
          <meshStandardMaterial color={data.palette.belly} roughness={0.95} />
        </mesh>
        {/* Nose */}
        <mesh position={[0, 0.46 * s, 0.58 * s]}>
          <sphereGeometry args={[0.035 * s, 8, 8]} />
          <meshStandardMaterial color="#C99B96" roughness={0.7} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.08 * s, 0.55 * s, 0.5 * s]}>
          <sphereGeometry args={[0.025 * s, 8, 8]} />
          <meshStandardMaterial color="#1A0F08" />
        </mesh>
        <mesh position={[ 0.08 * s, 0.55 * s, 0.5 * s]}>
          <sphereGeometry args={[0.025 * s, 8, 8]} />
          <meshStandardMaterial color="#1A0F08" />
        </mesh>
        {/* Ears */}
        <mesh castShadow position={[-0.12 * s, 0.72 * s, 0.28 * s]} rotation={[0, 0, -0.2]}>
          <coneGeometry args={[0.08 * s, 0.16 * s, 5]} />
          <meshStandardMaterial color={data.palette.ears} roughness={0.95} />
        </mesh>
        <mesh castShadow position={[ 0.12 * s, 0.72 * s, 0.28 * s]} rotation={[0, 0, 0.2]}>
          <coneGeometry args={[0.08 * s, 0.16 * s, 5]} />
          <meshStandardMaterial color={data.palette.ears} roughness={0.95} />
        </mesh>

        {/* Tail — bent upward and swinging */}
        <group ref={tail} position={[0, 0.42 * s, -0.4 * s]}>
          <mesh castShadow position={[0, 0.18 * s, -0.06 * s]} rotation={[0.5, 0, 0]}>
            <cylinderGeometry args={[0.04 * s, 0.06 * s, 0.45 * s, 6]} />
            <meshStandardMaterial color={data.palette.body} roughness={0.95} />
          </mesh>
        </group>

        {/* Legs — 4 short cylinders; tucked slightly under the body */}
        {([
          [-0.14 * s, 0.12 * s,  0.18 * s],
          [ 0.14 * s, 0.12 * s,  0.18 * s],
          [-0.14 * s, 0.12 * s, -0.18 * s],
          [ 0.14 * s, 0.12 * s, -0.18 * s],
        ] as Array<[number, number, number]>).map((p, i) => (
          <mesh key={i} castShadow position={p}>
            <cylinderGeometry args={[0.055 * s, 0.05 * s, 0.22 * s, 6]} />
            <meshStandardMaterial color={data.palette.body} roughness={0.95} />
          </mesh>
        ))}
      </group>

      {/* Soft drop shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[0.45 * s, 12]} />
        <meshBasicMaterial color="#3E2723" transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  );
}
