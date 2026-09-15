'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { BUILDINGS, COURTYARD_CENTER } from '../buildings.config';

/**
 * CampusGround — grass + central plaza + spoke paths to each building + decoration.
 * Computes paths programmatically from the BUILDINGS config so adding a new
 * building automatically gets a stone path leading to it.
 */
export default function CampusGround() {
  // Procedural grass texture — green base + scattered specks for variation.
  // Wrapped in typeof document guard so it can never run during SSR.
  const grassTex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d')!;
    g.fillStyle = '#7CB342';
    g.fillRect(0, 0, 256, 256);
    // Darker green specks
    for (let i = 0; i < 600; i++) {
      g.fillStyle = Math.random() > 0.5 ? '#689F38' : '#8BC34A';
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const w = 1 + Math.random() * 2;
      g.fillRect(x, y, w, w);
    }
    // Lighter highlights
    for (let i = 0; i < 200; i++) {
      g.fillStyle = 'rgba(174, 213, 129, 0.6)';
      g.fillRect(Math.random() * 256, Math.random() * 256, 1, 1);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(20, 20);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  // Procedural cobblestone texture — rounded shapes with darker outlines + highlights.
  const cobbleTex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d')!;
    g.fillStyle = '#C8B89A';
    g.fillRect(0, 0, 256, 256);
    // Cobblestone pattern: rounded shapes with darker outlines + highlights
    const cobbles: Array<[number, number, number]> = [
      [40, 40, 30], [110, 35, 35], [180, 50, 28],
      [60, 100, 32], [140, 110, 30], [200, 100, 28],
      [30, 170, 28], [100, 180, 30], [170, 170, 32],
      [210, 200, 26], [70, 230, 24], [150, 230, 28],
    ];
    for (const [x, y, r] of cobbles) {
      // Darker outline (groove between cobbles)
      g.fillStyle = '#8B7355';
      g.beginPath();
      g.ellipse(x, y, r + 2, r * 0.9 + 2, 0, 0, Math.PI * 2);
      g.fill();
      // Main cobble face
      g.fillStyle = '#D4C4A8';
      g.beginPath();
      g.ellipse(x, y, r, r * 0.9, 0, 0, Math.PI * 2);
      g.fill();
      // Highlight
      g.fillStyle = '#E8DBBE';
      g.beginPath();
      g.ellipse(x - r * 0.3, y - r * 0.3, r * 0.4, r * 0.3, 0, 0, Math.PI * 2);
      g.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(4, 4);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  // Procedural grass alt texture — slightly different pattern for patches
  const grassAltTex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    g.fillStyle = '#689F38';
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 300; i++) {
      g.fillStyle = Math.random() > 0.5 ? '#7CB342' : '#558B2F';
      g.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(8, 8);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  const grassMat = useMemo(
    () => {
      const m = new THREE.MeshStandardMaterial({ color: '#7CB342', roughness: 0.95, metalness: 0 });
      if (grassTex) { m.map = grassTex; m.needsUpdate = true; }
      return m;
    },
    [grassTex]
  );
  const grassAltMat = useMemo(
    () => {
      const m = new THREE.MeshStandardMaterial({ color: '#689F38', roughness: 0.95 });
      if (grassAltTex) { m.map = grassAltTex; m.needsUpdate = true; }
      return m;
    },
    [grassAltTex]
  );
  const pathMat = useMemo(
    () => {
      const m = new THREE.MeshStandardMaterial({ color: '#D4C4A8', roughness: 0.85 });
      if (cobbleTex) { m.map = cobbleTex; m.needsUpdate = true; }
      return m;
    },
    [cobbleTex]
  );
  const plazaMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#E0CDA8', roughness: 0.85 }),
    []
  );

  // Spoke paths from courtyard center to each building's door
  const spokes = useMemo(() => {
    return BUILDINGS.map((b) => {
      const cx = COURTYARD_CENTER[0];
      const cz = COURTYARD_CENTER[2];
      const dx = b.position[0] - cx;
      const dz = b.position[2] - cz;
      const dist = Math.sqrt(dx * dx + dz * dz);
      // Stop path short of the building footprint (so it doesn't intersect)
      const stopDist = dist - Math.max(b.size[0], b.size[1]) / 2 - 0.6;
      // Start past the plaza edge
      const startDist = 4.5;
      const len = Math.max(0.5, stopDist - startDist);
      const midX = cx + (dx / dist) * (startDist + len / 2);
      const midZ = cz + (dz / dist) * (startDist + len / 2);
      const angle = Math.atan2(dx, dz);
      return { position: [midX, 0.005, midZ] as [number, number, number], rotation: angle, length: len };
    });
  }, []);

  // Decorative grass patches scattered around
  const grassPatches = useMemo(() => {
    const seeds = [
      [-14,  -8], [ 14,  -8], [-16,   6], [ 16,   6],
      [-10,  18], [  8,  18], [-18,  22], [ 10,  22],
      [-26,  -2], [ 26,  -2], [-26,  16], [ 26,  16],
    ];
    return seeds.map(([x, z]) => ({ position: [x, 0.005, z] as [number, number, number], radius: 2 + Math.random() * 1.6 }));
  }, []);

  return (
    <group>
      {/* Main grass plane */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[80, 80]} />
        <primitive object={grassMat} attach="material" />
      </mesh>

      {/* Decorative grass patches */}
      {grassPatches.map((p, i) => (
        <mesh key={i} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={p.position}>
          <circleGeometry args={[p.radius, 16]} />
          <primitive object={grassAltMat} attach="material" />
        </mesh>
      ))}

      {/* Central plaza — circle of stone */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[4.5, 32]} />
        <primitive object={plazaMat} attach="material" />
      </mesh>
      {/* Plaza inner ring */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <ringGeometry args={[3.6, 3.9, 32]} />
        <primitive object={pathMat} attach="material" />
      </mesh>

      {/* Spoke paths from plaza to each building */}
      {spokes.map((s, i) => (
        <mesh
          key={i}
          receiveShadow
          rotation={[-Math.PI / 2, 0, -s.rotation]}
          position={s.position}
        >
          <planeGeometry args={[2.4, s.length]} />
          <primitive object={pathMat} attach="material" />
        </mesh>
      ))}

      {/* Trees — scattered along the perimeter */}
      <Trees />

      {/* Bushes — small round shrubs around plaza edges */}
      <Bushes />

      {/* Benches — wooden seats facing the plaza */}
      <Benches />

      {/* Lamp posts on the plaza */}
      <Lamps />

      {/* School entrance marker (south entry) */}
      <EntranceMarker />

      {/* Flower beds near plaza */}
      <FlowerBed position={[ 4,  4]} colors={['#FF6B9D', '#FFD93D', '#C084FC']} />
      <FlowerBed position={[-4,  4]} colors={['#6BCBFF', '#6BCB77', '#FF9F43']} />
      <FlowerBed position={[ 4, -4]} colors={['#C084FC', '#FF6B9D', '#FFD93D']} />
      <FlowerBed position={[-4, -4]} colors={['#FFD93D', '#FF6B9D', '#6BCBFF']} />

      {/* Central feature: fountain / sundial */}
      <Fountain />
    </group>
  );
}

function Trees() {
  // Hand-placed trees for visual variety. Three types: pine (tall cones),
  // oak (round foliage), bushy (cluster of spheres). Stable seeded RNG so
  // tree types don't shuffle between renders.
  const trees = [
    // North perimeter
    { x: -28, z: -22 }, { x: -18, z: -25 }, { x: -8, z: -24 }, { x:  6, z: -25 }, { x: 16, z: -23 }, { x: 26, z: -22 },
    // South perimeter
    { x: -28, z: 22 },  { x: -20, z: 26 }, { x: -10, z: 28 }, { x:  0, z: 29 }, { x: 10, z: 27 }, { x: 22, z: 25 }, { x: 28, z: 22 },
    // East
    { x: 28, z: -10 }, { x: 30, z: 0 }, { x: 29, z: 8 },
    // West
    { x: -30, z: -10 }, { x: -32, z: 0 }, { x: -29, z: 8 },
    // Inner scatter
    { x: -14, z: -14 }, { x: 14, z: -14 }, { x: -14, z: 8 }, { x: 14, z: 8 },
  ];
  // Stable seeded assignment (Mulberry32) so tree types don't shuffle between renders.
  const rng = (() => {
    let s = 0x9e3779b9;
    return () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  })();
  return (
    <group>
      {trees.map((t, i) => {
        const type = rng() < 0.45 ? 'pine' : rng() < 0.65 ? 'oak' : 'bushy';
        return (
          <group key={i} position={[t.x, 0, t.z]}>
            <Tree type={type} />
          </group>
        );
      })}
    </group>
  );
}

function Tree({ type }: { type: 'pine' | 'oak' | 'bushy' }) {
  if (type === 'pine') {
    return (
      <>
        <mesh castShadow position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.18, 0.22, 1.4, 8]} />
          <meshStandardMaterial color="#6D4C41" />
        </mesh>
        <mesh castShadow position={[0, 1.9, 0]}>
          <coneGeometry args={[1.0, 1.6, 8]} />
          <meshStandardMaterial color="#2E7D32" />
        </mesh>
        <mesh castShadow position={[0, 2.7, 0]}>
          <coneGeometry args={[0.72, 1.2, 8]} />
          <meshStandardMaterial color="#43A047" />
        </mesh>
      </>
    );
  }
  if (type === 'oak') {
    return (
      <>
        <mesh castShadow position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.22, 0.28, 1.4, 8]} />
          <meshStandardMaterial color="#5D4037" />
        </mesh>
        <mesh castShadow position={[0, 1.9, 0]}>
          <sphereGeometry args={[1.0, 10, 8]} />
          <meshStandardMaterial color="#558B2F" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[-0.4, 2.4, 0.2]}>
          <sphereGeometry args={[0.7, 10, 8]} />
          <meshStandardMaterial color="#689F38" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0.5, 2.2, -0.3]}>
          <sphereGeometry args={[0.6, 10, 8]} />
          <meshStandardMaterial color="#7CB342" roughness={0.9} />
        </mesh>
      </>
    );
  }
  // bushy
  return (
    <>
      <mesh castShadow position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.14, 0.18, 0.8, 8]} />
        <meshStandardMaterial color="#6D4C41" />
      </mesh>
      <mesh castShadow position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.7, 10, 8]} />
        <meshStandardMaterial color="#558B2F" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[-0.4, 1.3, 0.1]}>
        <sphereGeometry args={[0.45, 10, 8]} />
        <meshStandardMaterial color="#689F38" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.4, 1.4, -0.2]}>
        <sphereGeometry args={[0.4, 10, 8]} />
        <meshStandardMaterial color="#7CB342" roughness={0.9} />
        </mesh>
      <mesh castShadow position={[0, 1.7, 0.3]}>
        <sphereGeometry args={[0.35, 10, 8]} />
        <meshStandardMaterial color="#43A047" roughness={0.9} />
      </mesh>
    </>
  );
}

function Bushes() {
  // Small round bushes scattered around the plaza and path edges.
  const positions: Array<[number, number]> = [
    [-7, 7], [7, 7], [-7, -7], [7, -7],
    [-11, 3], [11, 3], [-3, 11], [3, 11],
    [-9, -3], [9, -3], [-3, -11], [3, -11],
    [-15, -11], [15, -11], [-15, 11], [15, 11],
  ];
  return (
    <group>
      {positions.map(([x, z], i) => {
        const r = 0.45 + (i % 3) * 0.1;
        return (
          <mesh key={i} castShadow position={[x, r * 0.6, z]}>
            <sphereGeometry args={[r, 10, 8]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#558B2F' : '#689F38'} roughness={0.95} />
          </mesh>
        );
      })}
    </group>
  );
}

function Benches() {
  // Simple wooden benches near the plaza — seat + 2 back posts.
  const benches = [
    { x:  6, z: -5, rot:  0 },
    { x: -6, z: -5, rot:  0 },
    { x:  6, z:  5, rot: Math.PI },
    { x: -6, z:  5, rot: Math.PI },
  ];
  return (
    <group>
      {benches.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]} rotation={[0, b.rot, 0]}>
          {/* seat */}
          <mesh castShadow position={[0, 0.45, 0]}>
            <boxGeometry args={[1.8, 0.12, 0.6]} />
            <meshStandardMaterial color="#5D4037" roughness={0.7} />
          </mesh>
          {/* left back post */}
          <mesh castShadow position={[-0.7, 0.7, -0.25]}>
            <boxGeometry args={[0.1, 0.7, 0.1]} />
            <meshStandardMaterial color="#3E2723" />
          </mesh>
          {/* right back post */}
          <mesh castShadow position={[0.7, 0.7, -0.25]}>
            <boxGeometry args={[0.1, 0.7, 0.1]} />
            <meshStandardMaterial color="#3E2723" />
          </mesh>
          {/* back rail */}
          <mesh castShadow position={[0, 1.0, -0.25]}>
            <boxGeometry args={[1.6, 0.12, 0.08]} />
            <meshStandardMaterial color="#5D4037" roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Lamps() {
  // Lamp posts at 4 compass points around the plaza. Post + glowing
  // bulb + warm halo so the courtyard feels lived-in.
  const lamps = [
    { x:  4.5, z:  0 },
    { x: -4.5, z:  0 },
    { x:  0, z:  4.5 },
    { x:  0, z: -4.5 },
  ];
  return (
    <group>
      {lamps.map((l, i) => (
        <group key={i} position={[l.x, 0, l.z]}>
          {/* base */}
          <mesh castShadow position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.18, 0.22, 0.2, 8]} />
            <meshStandardMaterial color="#3E2723" />
          </mesh>
          {/* post */}
          <mesh castShadow position={[0, 1.0, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 1.8, 8]} />
            <meshStandardMaterial color="#212121" />
          </mesh>
          {/* arm */}
          <mesh castShadow position={[0, 1.85, 0]}>
            <boxGeometry args={[0.4, 0.06, 0.06]} />
            <meshStandardMaterial color="#212121" />
          </mesh>
          {/* bulb */}
          <mesh position={[0.2, 1.7, 0]}>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshStandardMaterial color="#FFD54F" emissive="#FFD54F" emissiveIntensity={0.7} />
          </mesh>
          {/* halo */}
          <mesh position={[0.2, 1.7, 0]}>
            <sphereGeometry args={[0.4, 12, 12]} />
            <meshBasicMaterial color="#FFE680" transparent opacity={0.25} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function EntranceMarker() {
  // Wooden signpost at the south entry path, greeting visitors.
  return (
    <group position={[0, 0, 9]}>
      {/* two posts */}
      <mesh castShadow position={[-0.7, 1.2, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 2.4, 8]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
      <mesh castShadow position={[0.7, 1.2, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 2.4, 8]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
      {/* horizontal beam (top) */}
      <mesh castShadow position={[0, 2.45, 0]}>
        <boxGeometry args={[2.2, 0.3, 0.3]} />
        <meshStandardMaterial color="#3E2723" />
      </mesh>
      {/* hanging sign */}
      <mesh castShadow position={[0, 1.9, 0]}>
        <boxGeometry args={[1.4, 0.7, 0.08]} />
        <meshStandardMaterial color="#FF6B9D" />
      </mesh>
      <mesh castShadow position={[0, 1.9, 0.05]}>
        <boxGeometry args={[1.2, 0.5, 0.02]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* chains */}
      <mesh position={[-0.55, 2.15, 0.04]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 4]} />
        <meshStandardMaterial color="#212121" />
      </mesh>
      <mesh position={[0.55, 2.15, 0.04]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 4]} />
        <meshStandardMaterial color="#212121" />
      </mesh>
    </group>
  );
}

function FlowerBed({ position, colors }: { position: [number, number]; colors: string[] }) {
  return (
    <group position={[position[0], 0, position[1]]}>
      {/* soil */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[0.7, 16]} />
        <meshStandardMaterial color="#5D4037" roughness={0.9} />
      </mesh>
      {/* flowers */}
      {colors.map((c, i) => {
        const ang = (i / colors.length) * Math.PI * 2;
        const r = 0.45;
        return (
          <mesh key={i} castShadow position={[Math.cos(ang) * r, 0.12, Math.sin(ang) * r]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial color={c} />
          </mesh>
        );
      })}
    </group>
  );
}

function Fountain() {
  return (
    <group position={[0, 0, 0]}>
      {/* base */}
      <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
        <cylinderGeometry args={[1.2, 1.4, 0.5, 16]} />
        <meshStandardMaterial color="#9E9E9E" roughness={0.7} />
      </mesh>
      {/* water */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 0.1, 16]} />
        <meshStandardMaterial color="#4FC3F7" transparent opacity={0.7} metalness={0.2} roughness={0.3} />
      </mesh>
      {/* center column */}
      <mesh castShadow position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.8, 8]} />
        <meshStandardMaterial color="#9E9E9E" roughness={0.7} />
      </mesh>
      {/* top ball */}
      <mesh castShadow position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color="#B3E5FC" roughness={0.4} metalness={0.3} />
      </mesh>
    </group>
  );
}
