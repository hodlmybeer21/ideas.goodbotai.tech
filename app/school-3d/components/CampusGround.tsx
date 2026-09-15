'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
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

  // Asphalt material for roads (Main St + side streets)
  const asphaltMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#3C3C3C', roughness: 0.75, metalness: 0.05 }),
    []
  );
  // White road-marking material (center dashes + crosswalks)
  const stripeMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      emissive: '#FFFFFF',
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.95,
    }),
    []
  );

  // Paths from the plaza to each building's door.
  //
  // The previous two attempts (12 radial spokes, then 9 cluster-by-angle
  // spokes) both still left the paths looking chaotic because they all radiate
  // from the same center point in different directions.
  //
  // New approach: a proper campus grid.
  //   - 3 main AVENUES running ALONG each building row (between the plaza
  //     and the buildings, parallel to the buildings). These read as "main
  //     streets" that lead somewhere.
  //   - Short perpendicular BRANCHES from each avenue to each building's door.
  //   - Isolated single SPOKES for playground + greenhouse (no cluster).
  //
  // Building rows:
  //   NORTH row  : artroom, library, sciceng, auditorium  (all z=-20)
  //   WEST column: gym, cafetria, nurse                   (all x=-22)
  //   SOUTH row  : office, mathroom, musicrm              (all z=14)
  type PathSeg = { position: [number, number, number]; rotation: number; length: number; width: number };
  const AVENUE_W = 2.0;
  const BRANCH_W = 1.2;
  const SPOKE_W = 1.4;
  const BUILDING_MARGIN = 1.0; // avenue sits this far from the building edge

  const { avenues, branches, spokes } = useMemo(() => {
    const avenues: PathSeg[] = [];
    const branches: PathSeg[] = [];

    // === NORTH row (artroom, library, sciceng, auditorium) — z=-20 ===
    // Door-side edge at z = -20 + 5.5/2 = -17.25 (facing +Z toward plaza).
    // Avenue runs at z=-15 (between plaza edge at z=-4.5 and doors at z=-17.25).
    const northBs = BUILDINGS.filter((b) => Math.abs(b.position[2] - (-20)) < 1);
    if (northBs.length > 0) {
      const aveZ = -15;
      const xMin = Math.min(...northBs.map((b) => b.position[0])) - 5;
      const xMax = Math.max(...northBs.map((b) => b.position[0])) + 5;
      const len = xMax - xMin;
      avenues.push({
        position: [(xMin + xMax) / 2, 0.005, aveZ],
        rotation: 0, // length along X
        length: len,
        width: AVENUE_W,
      });
      for (const b of northBs) {
        const bx = b.position[0];
        const doorZ = b.position[2] + b.size[1] / 2; // facing plaza (+Z)
        branches.push({
          position: [bx, 0.005, (aveZ + doorZ) / 2],
          rotation: 0,
          length: doorZ - aveZ,
          width: BRANCH_W,
        });
      }
    }

    // === WEST column (gym, cafetria, nurse) — x=-22 ===
    // Door-side edge at x = -22 + 7/2 = -18.5 (facing +X toward plaza).
    // Avenue runs at x=-15 (between plaza edge at x=-4.5 and doors at x=-18.5).
    const westBs = BUILDINGS.filter((b) => Math.abs(b.position[0] - (-22)) < 1);
    if (westBs.length > 0) {
      const aveX = -15;
      const zMin = Math.min(...westBs.map((b) => b.position[2])) - 5;
      const zMax = Math.max(...westBs.map((b) => b.position[2])) + 5;
      const len = zMax - zMin;
      avenues.push({
        position: [aveX, 0.005, (zMin + zMax) / 2],
        rotation: Math.PI / 2, // length along Z
        length: len,
        width: AVENUE_W,
      });
      for (const b of westBs) {
        const bz = b.position[2];
        const doorX = b.position[0] + b.size[0] / 2; // facing plaza (+X)
        branches.push({
          position: [(aveX + doorX) / 2, 0.005, bz],
          rotation: Math.PI / 2,
          length: doorX - aveX,
          width: BRANCH_W,
        });
      }
    }

    // === SOUTH row (office, mathroom, musicrm) — z=14 ===
    // Door-side edge at z = 14 - 5/2 = 11.5 (facing -Z toward plaza).
    // Avenue runs at z=10 (between plaza edge at z=4.5 and doors at z=11.5).
    const southBs = BUILDINGS.filter((b) => Math.abs(b.position[2] - 14) < 1);
    if (southBs.length > 0) {
      const aveZ = 10;
      const xMin = Math.min(...southBs.map((b) => b.position[0])) - 5;
      const xMax = Math.max(...southBs.map((b) => b.position[0])) + 5;
      const len = xMax - xMin;
      avenues.push({
        position: [(xMin + xMax) / 2, 0.005, aveZ],
        rotation: 0,
        length: len,
        width: AVENUE_W,
      });
      for (const b of southBs) {
        const bx = b.position[0];
        const doorZ = b.position[2] - b.size[1] / 2; // facing plaza (-Z)
        branches.push({
          position: [bx, 0.005, (aveZ + doorZ) / 2],
          rotation: 0,
          length: aveZ - doorZ,
          width: BRANCH_W,
        });
      }
    }

    // === Isolated spokes for playground + greenhouse (no cluster) ===
    const clusteredIds = new Set([
      ...BUILDINGS.filter((b) => Math.abs(b.position[2] - (-20)) < 1).map((b) => b.id),
      ...BUILDINGS.filter((b) => Math.abs(b.position[0] - (-22)) < 1).map((b) => b.id),
      ...BUILDINGS.filter((b) => Math.abs(b.position[2] - 14) < 1).map((b) => b.id),
    ]);
    const isolated = BUILDINGS.filter((b) => !clusteredIds.has(b.id));
    const spokes: PathSeg[] = [];
    for (const b of isolated) {
      const dx = b.position[0];
      const dz = b.position[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      const dirX = dx / dist;
      const dirZ = dz / dist;
      const startDist = 4.5; // plaza edge
      const stopDist = dist - Math.max(b.size[0], b.size[1]) / 2 - 0.6;
      const len = Math.max(0.5, stopDist - startDist);
      const midR = startDist + len / 2;
      spokes.push({
        position: [dirX * midR, 0.005, dirZ * midR],
        rotation: Math.atan2(dx, dz),
        length: len,
        width: SPOKE_W,
      });
    }

    return { avenues, branches, spokes };
  }, []);

  // Town road grid — asphalt streets + sidewalks + road markings.
  // Modeled on downtown Morgantown near Oglebay Hall: a real paved Main St
  // with cross streets, cobblestone sidewalks on both sides, white center
  // dashes, and crosswalks at intersections. Buildings sit on each side
  // of Main St (existing positions work — they all already face the plaza
  // which is now the Main St × side-streets intersection).
  type RoadSeg = { position: [number, number, number]; rotation: number; length: number; width: number; type: 'road' | 'sidewalk' | 'stripe' | 'crosswalk' };
  const ROAD_W = 4.0;
  const SIDE_W = 3.0;
  const SIDEWALK_W = 1.2;
  const CROSSWALK_W = 1.5;
  const STRIPE_LEN = 0.8;
  const STRIPE_GAP = 0.7;
  const roads = useMemo(() => {
    const out: RoadSeg[] = [];
    // Main St — EW through the plaza
    out.push({ position: [0, 0.005, 0], rotation: 0, length: 60, width: ROAD_W, type: 'road' });
    // West side street (NS at x=-11, between west buildings and Main St)
    out.push({ position: [-11, 0.005, 0], rotation: Math.PI / 2, length: 60, width: SIDE_W, type: 'road' });
    // East side street (NS at x=11)
    out.push({ position: [11, 0.005, 0], rotation: Math.PI / 2, length: 60, width: SIDE_W, type: 'road' });
    // Far south connector (EW at z=22, for greenhouse)
    out.push({ position: [-6, 0.005, 22], rotation: 0, length: 18, width: SIDE_W, type: 'road' });
    // North St (EW at z=-12) — parallels Main St, forms block with north buildings
    out.push({ position: [0, 0.005, -12], rotation: 0, length: 60, width: SIDE_W, type: 'road' });
    // South St (EW at z=+12) — parallels Main St, forms block with south buildings
    out.push({ position: [0, 0.005, 12], rotation: 0, length: 60, width: SIDE_W, type: 'road' });

    // Sidewalks — cobblestone strips parallel to each road
    const mainSideOff = ROAD_W / 2 + SIDEWALK_W / 2;
    out.push({ position: [0, 0.006, -mainSideOff], rotation: 0, length: 60, width: SIDEWALK_W, type: 'sidewalk' });
    out.push({ position: [0, 0.006, +mainSideOff], rotation: 0, length: 60, width: SIDEWALK_W, type: 'sidewalk' });
    const sideSideOff = SIDE_W / 2 + SIDEWALK_W / 2;
    out.push({ position: [-11 - sideSideOff, 0.006, 0], rotation: Math.PI / 2, length: 60, width: SIDEWALK_W, type: 'sidewalk' });
    out.push({ position: [-11 + sideSideOff, 0.006, 0], rotation: Math.PI / 2, length: 60, width: SIDEWALK_W, type: 'sidewalk' });
    out.push({ position: [11 - sideSideOff, 0.006, 0], rotation: Math.PI / 2, length: 60, width: SIDEWALK_W, type: 'sidewalk' });
    out.push({ position: [11 + sideSideOff, 0.006, 0], rotation: Math.PI / 2, length: 60, width: SIDEWALK_W, type: 'sidewalk' });
    // North St sidewalks (offset along Z)
    out.push({ position: [0, 0.006, -12 - sideSideOff], rotation: 0, length: 60, width: SIDEWALK_W, type: 'sidewalk' });
    out.push({ position: [0, 0.006, -12 + sideSideOff], rotation: 0, length: 60, width: SIDEWALK_W, type: 'sidewalk' });
    // South St sidewalks
    out.push({ position: [0, 0.006, 12 - sideSideOff], rotation: 0, length: 60, width: SIDEWALK_W, type: 'sidewalk' });
    out.push({ position: [0, 0.006, 12 + sideSideOff], rotation: 0, length: 60, width: SIDEWALK_W, type: 'sidewalk' });

    // Center stripes (white dashes) along Main St
    for (let x = -29; x <= 29; x += STRIPE_LEN + STRIPE_GAP) {
      out.push({ position: [x + (STRIPE_LEN + STRIPE_GAP) / 2, 0.008, 0], rotation: 0, length: STRIPE_LEN, width: 0.15, type: 'stripe' });
    }
    // Center stripes along side streets
    for (let z = -29; z <= 29; z += STRIPE_LEN + STRIPE_GAP) {
      out.push({ position: [-11, 0.008, z + (STRIPE_LEN + STRIPE_GAP) / 2], rotation: Math.PI / 2, length: STRIPE_LEN, width: 0.15, type: 'stripe' });
      out.push({ position: [11, 0.008, z + (STRIPE_LEN + STRIPE_GAP) / 2], rotation: Math.PI / 2, length: STRIPE_LEN, width: 0.15, type: 'stripe' });
    }
    // Center stripes along North St and South St (along X)
    for (let x = -29; x <= 29; x += STRIPE_LEN + STRIPE_GAP) {
      out.push({ position: [x + (STRIPE_LEN + STRIPE_GAP) / 2, 0.008, -12], rotation: 0, length: STRIPE_LEN, width: 0.15, type: 'stripe' });
      out.push({ position: [x + (STRIPE_LEN + STRIPE_GAP) / 2, 0.008, 12], rotation: 0, length: STRIPE_LEN, width: 0.15, type: 'stripe' });
    }
    // Crosswalks at each intersection
    out.push({ position: [-11, 0.009, 0], rotation: Math.PI / 2, length: SIDE_W + 2.4, width: CROSSWALK_W, type: 'crosswalk' });
    out.push({ position: [11, 0.009, 0], rotation: Math.PI / 2, length: SIDE_W + 2.4, width: CROSSWALK_W, type: 'crosswalk' });
    // North St × West Side St intersection
    out.push({ position: [-11, 0.009, -12], rotation: Math.PI / 2, length: SIDE_W + 2.4, width: CROSSWALK_W, type: 'crosswalk' });
    // North St × East Side St intersection
    out.push({ position: [11, 0.009, -12], rotation: Math.PI / 2, length: SIDE_W + 2.4, width: CROSSWALK_W, type: 'crosswalk' });
    // South St × West Side St intersection
    out.push({ position: [-11, 0.009, 12], rotation: Math.PI / 2, length: SIDE_W + 2.4, width: CROSSWALK_W, type: 'crosswalk' });
    // South St × East Side St intersection
    out.push({ position: [11, 0.009, 12], rotation: Math.PI / 2, length: SIDE_W + 2.4, width: CROSSWALK_W, type: 'crosswalk' });

    return out;
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

      {/* Spoke paths from plaza to each building cluster */}
      {avenues.map((s, i) => (
        <mesh
          key={`avenue-${i}`}
          receiveShadow
          rotation={[-Math.PI / 2, 0, -s.rotation]}
          position={s.position}
        >
          <planeGeometry args={[s.width, s.length]} />
          <primitive object={pathMat} attach="material" />
        </mesh>
      ))}

      {/* Short branch paths from spoke tips to each building's footprint */}
      {branches.map((b, i) => (
        <mesh
          key={`branch-${i}`}
          receiveShadow
          rotation={[-Math.PI / 2, 0, -b.rotation]}
          position={b.position}
        >
          <planeGeometry args={[b.width, b.length]} />
          <primitive object={pathMat} attach="material" />
        </mesh>
      ))}

      {/* Isolated spokes for playground + greenhouse */}
      {spokes.map((s, i) => (
        <mesh
          key={`spoke-${i}`}
          receiveShadow
          rotation={[-Math.PI / 2, 0, -s.rotation]}
          position={s.position}
        >
          <planeGeometry args={[s.width, s.length]} />
          <primitive object={pathMat} attach="material" />
        </mesh>
      ))}

      {/* Town road grid — asphalt Main St + side streets + sidewalks + road markings */}
      {roads.map((r, i) => {
        const mat = r.type === 'road' ? asphaltMat :
                    r.type === 'sidewalk' ? pathMat :
                    stripeMat;
        return (
          <mesh
            key={`road-${i}`}
            receiveShadow
            rotation={[-Math.PI / 2, 0, -r.rotation]}
            position={r.position}
          >
            <planeGeometry args={[r.width, r.length]} />
            <primitive object={mat} attach="material" />
          </mesh>
        );
      })}

      {/* Trees — scattered along the perimeter */}
      <Trees />

      {/* Bushes — small round shrubs around plaza edges */}
      <Bushes />

      {/* Benches — wooden seats facing the plaza */}
      <Benches />

      {/* Lamp posts on the plaza */}
      <Lamps />

      {/* Clock tower — center of the plaza */}
      <ClockTower />

      {/* Playground equipment inside the Playground building */}
      <PlaygroundEquipment />

      {/* Grand entrance arch with "UNIVERSITY" sign (south entry) */}
      <EntranceArch />

      {/* Bus stop near the entrance */}
      <BusStop />

      {/* Lake feature (NW campus) */}
      <Lake />

      {/* Stadium feature (NE campus — grandstands around a sports field) */}
      <Stadium />

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
    // === Street trees — lining the road grid like a downtown ===
    // Along Main St (z=0)
    { x: -26, z: -2 }, { x: -22, z: -2 }, { x: -18, z: -2 }, { x: -14, z: -2 }, { x: -10, z: -2 },
    { x: -6, z: -2 },  { x: -2, z: -2 },  { x:  2, z: -2 },  { x:  6, z: -2 },  { x: 10, z: -2 },
    { x: 14, z: -2 },  { x: 18, z: -2 }, { x: 22, z: -2 }, { x: 26, z: -2 },
    { x: -26, z: 2 },  { x: -22, z: 2 },  { x: -18, z: 2 },  { x: -14, z: 2 },  { x: -10, z: 2 },
    { x: -6, z: 2 },   { x: -2, z: 2 },   { x:  2, z: 2 },  { x:  6, z: 2 },  { x: 10, z: 2 },
    { x: 14, z: 2 },   { x: 18, z: 2 },  { x: 22, z: 2 },  { x: 26, z: 2 },
    // Along West Side St (x=-11)
    { x: -12.5, z: -16 }, { x: -12.5, z: -12 }, { x: -12.5, z: -8 }, { x: -12.5, z: -4 },
    { x: -9.5, z: -16 },  { x: -9.5, z: -12 },  { x: -9.5, z: -8 },  { x: -9.5, z: -4 },
    { x: -12.5, z: 4 },  { x: -12.5, z: 8 },  { x: -12.5, z: 12 }, { x: -12.5, z: 16 },
    { x: -9.5, z: 4 },   { x: -9.5, z: 8 },   { x: -9.5, z: 12 },  { x: -9.5, z: 16 },
    // Along East Side St (x=11)
    { x: 8.5, z: -16 },   { x: 8.5, z: -12 },   { x: 8.5, z: -8 },   { x: 8.5, z: -4 },
    { x: 11.5, z: -16 }, { x: 11.5, z: -12 }, { x: 11.5, z: -8 }, { x: 11.5, z: -4 },
    { x: 8.5, z: 4 },    { x: 8.5, z: 8 },    { x: 8.5, z: 12 },  { x: 8.5, z: 16 },
    { x: 11.5, z: 4 },  { x: 11.5, z: 8 },  { x: 11.5, z: 12 }, { x: 11.5, z: 16 },
    // Around the lake (NW campus)
    { x: -23, z: -28 }, { x: -19, z: -29 }, { x: -16, z: -26 }, { x: -22, z: -24 }, { x: -17, z: -23 },
    // Around the clock tower / plaza
    { x: 5, z: 5 },    { x: -5, z: 5 },  { x: 5, z: -5 },  { x: -5, z: -5 },
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

/**
 * BusStop — small shelter with bench + sign near the south entrance so the
 * downtown block reads as a "real" college campus with public transit.
 */
function BusStop() {
  return (
    <group position={[6, 0, 11]}>
      {/* Back wall */}
      <mesh castShadow position={[0, 0.9, -0.3]}>
        <boxGeometry args={[1.6, 1.8, 0.08]} />
        <meshStandardMaterial color="#5D9CC9" roughness={0.6} />
      </mesh>
      {/* Roof */}
      <mesh castShadow position={[0, 1.9, 0]}>
        <boxGeometry args={[1.8, 0.1, 0.7]} />
        <meshStandardMaterial color="#5D4037" roughness={0.7} />
      </mesh>
      {/* Bench */}
      <mesh castShadow position={[0, 0.25, 0.15]}>
        <boxGeometry args={[1.4, 0.08, 0.3]} />
        <meshStandardMaterial color="#5D4037" roughness={0.7} />
      </mesh>
      {/* Bench legs */}
      <mesh position={[-0.55, 0.1, 0.15]}>
        <cylinderGeometry args={[0.03, 0.03, 0.3, 6]} />
        <meshStandardMaterial color="#424242" />
      </mesh>
      <mesh position={[0.55, 0.1, 0.15]}>
        <cylinderGeometry args={[0.03, 0.03, 0.3, 6]} />
        <meshStandardMaterial color="#424242" />
      </mesh>
      {/* Bus stop sign post + sign */}
      <mesh position={[0.95, 0.3, -0.25]}>
        <cylinderGeometry args={[0.04, 0.04, 1.8, 6]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
      <mesh position={[0.95, 1.1, -0.21]}>
        <boxGeometry args={[0.4, 0.4, 0.05]} />
        <meshStandardMaterial color="#FFD54F" emissive="#FFD54F" emissiveIntensity={0.3} />
      </mesh>
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

function PlaygroundEquipment() {
  // Swings + slide + seesaw, positioned inside the Playground building
  // footprint (centered around world position [18, 0, 12]).
  return (
    <group position={[18, 0, 12]}>
      {/* Swings — A-frame + 2 chains + 2 seats */}
      <group position={[-2.4, 0, 0]}>
        {/* A-frame left leg */}
        <mesh castShadow position={[-0.05, 1.5, -0.8]} rotation={[0, 0, -0.15]}>
          <cylinderGeometry args={[0.07, 0.07, 3, 8]} />
          <meshStandardMaterial color="#5D4037" />
        </mesh>
        {/* A-frame right leg */}
        <mesh castShadow position={[0.05, 1.5, -0.8]} rotation={[0, 0, 0.15]}>
          <cylinderGeometry args={[0.07, 0.07, 3, 8]} />
          <meshStandardMaterial color="#5D4037" />
        </mesh>
        {/* top beam */}
        <mesh castShadow position={[0, 3, -0.8]}>
          <cylinderGeometry args={[0.08, 0.08, 2.2, 8]} />
          <meshStandardMaterial color="#5D4037" />
        </mesh>
        {/* chains */}
        <mesh position={[-0.7, 2.2, -0.8]}>
          <cylinderGeometry args={[0.02, 0.02, 1.4, 4]} />
          <meshStandardMaterial color="#424242" />
        </mesh>
        <mesh position={[0.7, 2.2, -0.8]}>
          <cylinderGeometry args={[0.02, 0.02, 1.4, 4]} />
          <meshStandardMaterial color="#424242" />
        </mesh>
        {/* seats */}
        <mesh castShadow position={[-0.7, 1.5, -0.8]}>
          <boxGeometry args={[0.5, 0.06, 0.3]} />
          <meshStandardMaterial color="#FF6B9D" />
        </mesh>
        <mesh castShadow position={[0.7, 1.5, -0.8]}>
          <boxGeometry args={[0.5, 0.06, 0.3]} />
          <meshStandardMaterial color="#FFD54F" />
        </mesh>
      </group>

      {/* Slide — ladder + slide ramp */}
      <group position={[0, 0, 0.5]}>
        {/* ladder */}
        <mesh castShadow position={[-0.8, 0.9, -0.6]} rotation={[Math.PI / 8, 0, 0]}>
          <boxGeometry args={[0.5, 0.05, 1.6]} />
          <meshStandardMaterial color="#3E2723" />
        </mesh>
        {/* ladder rungs */}
        {[0, 0.3, 0.6, 0.9].map((y, i) => (
          <mesh key={i} castShadow position={[-0.8, 0.3 + y, -0.5 + y * 0.18]}>
            <boxGeometry args={[0.5, 0.05, 0.05]} />
            <meshStandardMaterial color="#3E2723" />
          </mesh>
        ))}
        {/* platform */}
        <mesh castShadow position={[-0.8, 1.4, -0.4]}>
          <boxGeometry args={[0.8, 0.08, 0.8]} />
          <meshStandardMaterial color="#5D4037" />
        </mesh>
        {/* slide ramp */}
        <mesh castShadow position={[0.1, 0.7, 0.3]} rotation={[-0.45, 0, 0]}>
          <boxGeometry args={[0.5, 0.04, 1.8]} />
          <meshStandardMaterial color="#FFD54F" />
        </mesh>
        {/* slide side rails */}
        <mesh position={[-0.18, 0.85, 0.3]} rotation={[-0.45, 0, 0]}>
          <boxGeometry args={[0.04, 0.18, 1.8]} />
          <meshStandardMaterial color="#FF6B9D" />
        </mesh>
        <mesh position={[0.38, 0.85, 0.3]} rotation={[-0.45, 0, 0]}>
          <boxGeometry args={[0.04, 0.18, 1.8]} />
          <meshStandardMaterial color="#FF6B9D" />
        </mesh>
      </group>

      {/* Seesaw */}
      <group position={[2.4, 0, 0]}>
        {/* fulcrum */}
        <mesh castShadow position={[0, 0.4, 0]}>
          <boxGeometry args={[0.3, 0.8, 0.5]} />
          <meshStandardMaterial color="#5D4037" />
        </mesh>
        {/* plank */}
        <mesh castShadow position={[0, 0.9, 0]} rotation={[0.08, 0, 0]}>
          <boxGeometry args={[2.2, 0.08, 0.3]} />
          <meshStandardMaterial color="#FF6B9D" />
        </mesh>
        {/* handles */}
        <mesh position={[-1, 1.2, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
          <meshStandardMaterial color="#3E2723" />
        </mesh>
        <mesh position={[1, 1.2, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
          <meshStandardMaterial color="#3E2723" />
        </mesh>
      </group>
    </group>
  );
}

function Flagpole() {
  // (deprecated — replaced by ClockTower below)
  return null;
}

function ClockTower() {
  // Tall stone clock tower at the center of the plaza.
  // Stone base + lower column with door + clock section (4 faces) + pyramidal roof + spire.
  return (
    <group position={[0, 0, 0]}>
      {/* Wide stone base */}
      <mesh castShadow position={[0, 0.3, 0]}>
        <boxGeometry args={[1.6, 0.6, 1.6]} />
        <meshStandardMaterial color="#8D6E63" roughness={0.7} />
      </mesh>
      {/* Plinth */}
      <mesh castShadow position={[0, 0.75, 0]}>
        <boxGeometry args={[1.2, 0.3, 1.2]} />
        <meshStandardMaterial color="#A1887F" roughness={0.7} />
      </mesh>
      {/* Lower column (square, with door on +Z face) */}
      <mesh castShadow position={[0, 1.8, 0]}>
        <boxGeometry args={[1.0, 1.7, 1.0]} />
        <meshStandardMaterial color="#BCAAA4" roughness={0.7} />
      </mesh>
      {/* Door (south-facing, +Z side) */}
      <mesh castShadow position={[0, 1.3, 0.51]}>
        <boxGeometry args={[0.3, 0.8, 0.02]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
      {/* Clock section (wider) */}
      <mesh castShadow position={[0, 3.0, 0]}>
        <boxGeometry args={[1.3, 0.9, 1.3]} />
        <meshStandardMaterial color="#D7CCC8" roughness={0.7} />
      </mesh>
      {/* Clock faces on 4 sides */}
      <mesh position={[0, 3.0, 0.66]}>
        <cylinderGeometry args={[0.32, 0.32, 0.02, 32]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0.66, 3.0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.02, 32]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0, 3.0, -0.66]} rotation={[0, Math.PI, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.02, 32]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[-0.66, 3.0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.02, 32]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      {/* Clock hands on front (+Z) face */}
      <mesh position={[0, 3.0, 0.67]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.04, 0.22, 0.02]} />
        <meshStandardMaterial color="#2D1B00" />
      </mesh>
      <mesh position={[0.12, 3.0, 0.67]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[0.03, 0.26, 0.02]} />
        <meshStandardMaterial color="#2D1B00" />
      </mesh>
      {/* Pyramidal roof */}
      <mesh castShadow position={[0, 3.9, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.85, 0.9, 4]} />
        <meshStandardMaterial color="#6D4C41" roughness={0.6} />
      </mesh>
      {/* Spire */}
      <mesh castShadow position={[0, 4.85, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
        <meshStandardMaterial color="#BDBDBD" />
      </mesh>
      {/* Gold ball on spire */}
      <mesh position={[0, 5.15, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

function EntranceMarker() {
  // (deprecated — replaced by EntranceArch below)
  return null;
}

function EntranceArch() {
  // Grand brick archway at the south entry with "UNIVERSITY" text on the lintel.
  return (
    <group position={[0, 0, 11]}>
      {/* Left column base */}
      <mesh castShadow position={[-1.4, 0.15, 0]}>
        <boxGeometry args={[0.8, 0.3, 0.8]} />
        <meshStandardMaterial color="#6D4C41" roughness={0.7} />
      </mesh>
      {/* Left column */}
      <mesh castShadow position={[-1.4, 1.65, 0]}>
        <boxGeometry args={[0.6, 3.0, 0.6]} />
        <meshStandardMaterial color="#8D6E63" roughness={0.7} />
      </mesh>
      {/* Left column capital */}
      <mesh castShadow position={[-1.4, 3.2, 0]}>
        <boxGeometry args={[0.8, 0.2, 0.8]} />
        <meshStandardMaterial color="#A1887F" roughness={0.7} />
      </mesh>
      {/* Right column base */}
      <mesh castShadow position={[1.4, 0.15, 0]}>
        <boxGeometry args={[0.8, 0.3, 0.8]} />
        <meshStandardMaterial color="#6D4C41" roughness={0.7} />
      </mesh>
      {/* Right column */}
      <mesh castShadow position={[1.4, 1.65, 0]}>
        <boxGeometry args={[0.6, 3.0, 0.6]} />
        <meshStandardMaterial color="#8D6E63" roughness={0.7} />
      </mesh>
      {/* Right column capital */}
      <mesh castShadow position={[1.4, 3.2, 0]}>
        <boxGeometry args={[0.8, 0.2, 0.8]} />
        <meshStandardMaterial color="#A1887F" roughness={0.7} />
      </mesh>
      {/* Curved arch (half torus) between columns */}
      <mesh castShadow position={[0, 3.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.4, 0.3, 12, 8, Math.PI]} />
        <meshStandardMaterial color="#8D6E63" roughness={0.7} />
      </mesh>
      {/* Top lintel with "UNIVERSITY" text */}
      <mesh castShadow position={[0, 3.75, 0]}>
        <boxGeometry args={[3.6, 0.5, 0.7]} />
        <meshStandardMaterial color="#5D4037" roughness={0.7} />
      </mesh>
      <Billboard position={[0, 3.75, 0.36]}>
        <Text fontSize={0.35} color="#FFD700" anchorX="center" anchorY="middle" outlineWidth={0.025} outlineColor="#2D1B00" fontWeight={700}>
          UNIVERSITY
        </Text>
      </Billboard>
      {/* Lanterns on each column */}
      <mesh position={[-1.4, 2.5, 0.31]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color="#FFD54F" emissive="#FFD54F" emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[1.4, 2.5, 0.31]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color="#FFD54F" emissive="#FFD54F" emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

function Lake() {
  // Lake / water feature in the NW corner of the campus.
  return (
    <group position={[-20, 0, -26]}>
      {/* Lake water surface */}
      <mesh receiveShadow position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.5, 32]} />
        <meshStandardMaterial color="#3B7CB8" roughness={0.3} metalness={0.4} transparent opacity={0.85} />
      </mesh>
      {/* Lake edge — lighter blue ring */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.5, 4.0, 32]} />
        <meshStandardMaterial color="#5D9CC9" roughness={0.4} transparent opacity={0.7} />
      </mesh>
      {/* Small fountain in center */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.5, 8]} />
        <meshStandardMaterial color="#9E9E9E" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color="#B3E5FC" emissive="#B3E5FC" emissiveIntensity={0.4} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

function Stadium() {
  // Stadium feature in the NE corner of campus — green sports field
  // with grandstands on two long sides (matching the downtown college reference).
  return (
    <group position={[18, 0, -24]}>
      {/* Sports field — green rectangle */}
      <mesh receiveShadow position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial color="#66BB6A" roughness={0.85} />
      </mesh>
      {/* Center stripe */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.1, 5]} />
        <meshStandardMaterial color="#FAFAFA" />
      </mesh>
      {/* Center circle */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 0.85, 32]} />
        <meshStandardMaterial color="#FAFAFA" />
      </mesh>
      {/* Grandstand - north side */}
      <mesh castShadow position={[0, 0.8, -3]}>
        <boxGeometry args={[8, 1.6, 1.2]} />
        <meshStandardMaterial color="#A1887F" roughness={0.7} />
      </mesh>
      {/* Grandstand - south side */}
      <mesh castShadow position={[0, 0.8, 3]}>
        <boxGeometry args={[8, 1.6, 1.2]} />
        <meshStandardMaterial color="#A1887F" roughness={0.7} />
      </mesh>
      {/* Stadium lights (small lamp posts at corners) */}
      {[[-4, -3.5], [4, -3.5], [-4, 3.5], [4, 3.5]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.8, z]}>
          <cylinderGeometry args={[0.04, 0.04, 1.2, 6]} />
          <meshStandardMaterial color="#5D4037" />
        </mesh>
      ))}
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
