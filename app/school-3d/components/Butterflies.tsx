'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Butterflies — six small butterflies fluttering near the four flower
 * beds. Each butterfly traces a slow Lissajous around a fixed anchor
 * point and flaps its wings (alternate wing plane opacity) ~12 Hz.
 *
 * Pure procedural — no GLB. Uses double-sided planes for the wings so
 * they're visible from any camera angle.
 */

type ButterflyData = {
  anchor: THREE.Vector3;
  phase: number;
  speed: number;
  flapOffset: number;
  color: string;
  wingScale: number;
};

// World positions match the four flower beds in CampusGround
const ANCHORS: Array<[number, number]> = [
  [ 4,  4],
  [-4,  4],
  [ 4, -4],
  [-4, -4],
];

const COLORS = ['#E8B4A0', '#E8C788', '#C9A6B0', '#A8C9D8', '#D8B26E', '#E8B4A0'];

export default function Butterflies() {
  const butterflies = useMemo<ButterflyData[]>(() => {
    const arr: ButterflyData[] = [];
    // Two butterflies near each of the four flower beds
    for (let i = 0; i < 8; i++) {
      const anchor = ANCHORS[i % ANCHORS.length];
      arr.push({
        anchor: new THREE.Vector3(anchor[0], 0.35, anchor[1]),
        phase: (i / 8) * Math.PI * 2,
        speed: 0.7 + (i % 3) * 0.2,
        flapOffset: (i % 2) * Math.PI,
        color: COLORS[i % COLORS.length],
        wingScale: 0.16 + (i % 3) * 0.02,
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {butterflies.map((b, i) => (
        <Butterfly key={i} data={b} />
      ))}
    </group>
  );
}

function Butterfly({ data }: { data: ButterflyData }) {
  const groupRef = useRef<THREE.Group>(null);
  const leftWing  = useRef<THREE.Mesh>(null);
  const rightWing = useRef<THREE.Mesh>(null);
  const bodyMat   = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#2D1B00', roughness: 0.8 }),
    []
  );
  const wingMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: data.color, roughness: 0.85, side: THREE.DoubleSide,
      transparent: true, opacity: 0.95,
    }),
    [data.color]
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      const px = data.anchor.x + Math.sin(t * data.speed + data.phase) * 0.9;
      const py = data.anchor.y + Math.sin(t * 1.6 + data.phase) * 0.18;
      const pz = data.anchor.z + Math.cos(t * data.speed * 0.85 + data.phase) * 0.9;
      groupRef.current.position.set(px, py, pz);
      groupRef.current.rotation.y = Math.atan2(
        Math.cos(t * data.speed + data.phase) * 0.9 * data.speed,
        -Math.sin(t * data.speed * 0.85 + data.phase) * 0.9 * data.speed * 0.85
      );
      groupRef.current.rotation.z = Math.sin(t * 1.2 + data.phase) * 0.15;
    }
    // Flap: alternating scale of left and right wing planes
    const flap = Math.sin(t * 22 + data.flapOffset) * 0.7 + 0.9;
    if (leftWing.current) {
      leftWing.current.scale.x = flap;
    }
    if (rightWing.current) {
      rightWing.current.scale.x = flap;
    }
  });

  // Wing shape: a flat triangle (use planeGeometry + slight scale to suggest wing)
  const ws = data.wingScale;
  return (
    <group ref={groupRef}>
      {/* Body — thin cylinder */}
      <mesh material={bodyMat}>
        <cylinderGeometry args={[0.012, 0.012, 0.18, 6]} />
      </mesh>
      {/* Left wing */}
      <mesh ref={leftWing} material={wingMat} position={[-0.09, 0.02, 0]}>
        <planeGeometry args={[ws, ws * 0.85]} />
      </mesh>
      {/* Right wing */}
      <mesh ref={rightWing} material={wingMat} position={[0.09, 0.02, 0]}>
        <planeGeometry args={[ws, ws * 0.85]} />
      </mesh>
    </group>
  );
}
