'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { BUILDINGS, COURTYARD_CENTER } from '../buildings.config';
import { makeGrassTexture, makeDirtTexture, makeWoodTexture, makeHillTexture } from '../textures';
import { useDayNight } from '../lib/dayNightContext';

/**
 * CampusGround — Ghibli pastoral campus ground.
 *
 * Day/night reactivity: lamps (and the dusk-tinted central fountain)
 * subscribe to useDayNight() so bulb emissive intensity + halo opacity
 * ramp up after sunset and back down at dawn.
 */
export default function CampusGround() {
  const grassTex   = useMemo(() => makeGrassTexture(),  []);
  const dirtTex    = useMemo(() => makeDirtTexture(),   []);
  const woodTex    = useMemo(() => makeWoodTexture(),   []);
  const hillTex    = useMemo(() => makeHillTexture(),   []);

  const grassMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#7A9B6E', roughness: 0.95, metalness: 0 });
    if (grassTex) { m.map = grassTex; m.needsUpdate = true; }
    return m;
  }, [grassTex]);

  const pathMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#A88E70', roughness: 0.9, metalness: 0 });
    if (dirtTex) { m.map = dirtTex; m.needsUpdate = true; }
    return m;
  }, [dirtTex]);

  const woodMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#7A5235', roughness: 0.85, metalness: 0 });
    if (woodTex) { m.map = woodTex; m.needsUpdate = true; }
    return m;
  }, [woodTex]);

  const plazaMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#C9A982', roughness: 0.85 }),
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
      const stopDist = dist - Math.max(b.size[0], b.size[1]) / 2 - 0.6;
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
          <primitive object={grassMat} attach="material" />
        </mesh>
      ))}

      {/* Central plaza — packed earth circle */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[4.5, 32]} />
        <primitive object={plazaMat} attach="material" />
      </mesh>
      {/* Plaza inner ring — darker dirt */}
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

      <Trees />
      <Bushes />
      <Benches />
      <Lamps />
      <Flagpole />
      <PlaygroundEquipment woodMat={woodMat} />
      <EntranceMarker woodMat={woodMat} />
      <PerimeterStakes />

      {/* Ghibli-pastel flower beds */}
      <FlowerBed position={[ 4,  4]} colors={['#E8B4A0', '#E8C788', '#C9A6B0']} />
      <FlowerBed position={[-4,  4]} colors={['#A8C9D8', '#A4B58A', '#D9B082']} />
      <FlowerBed position={[ 4, -4]} colors={['#C9A6B0', '#E8B4A0', '#E8C788']} />
      <FlowerBed position={[-4, -4]} colors={['#E8C788', '#E8B4A0', '#A8C9D8']} />

      <Fountain woodMat={woodMat} />

      {/* Distant rolling hills — billboarded silhouettes on 4 sides */}
      <DistantHills hillTex={hillTex} />
    </group>
  );
}

function Trees() {
  const trees = [
    { x: -28, z: -22 }, { x: -18, z: -25 }, { x: -8, z: -24 }, { x:  6, z: -25 }, { x: 16, z: -23 }, { x: 26, z: -22 },
    { x: -28, z: 22 },  { x: -20, z: 26 }, { x: -10, z: 28 }, { x:  0, z: 29 }, { x: 10, z: 27 }, { x: 22, z: 25 }, { x: 28, z: 22 },
    { x: 28, z: -10 }, { x: 30, z: 0 }, { x: 29, z: 8 },
    { x: -30, z: -10 }, { x: -32, z: 0 }, { x: -29, z: 8 },
    { x: -14, z: -14 }, { x: 14, z: -14 }, { x: -14, z: 8 }, { x: 14, z: 8 },
  ];
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
          <meshStandardMaterial color="#5E7A4D" roughness={0.95} />
        </mesh>
        <mesh castShadow position={[0, 2.7, 0]}>
          <coneGeometry args={[0.72, 1.2, 8]} />
          <meshStandardMaterial color="#6E8A5C" roughness={0.95} />
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
          <meshStandardMaterial color="#6E8A5C" roughness={0.95} />
        </mesh>
        <mesh castShadow position={[-0.4, 2.4, 0.2]}>
          <sphereGeometry args={[0.7, 10, 8]} />
          <meshStandardMaterial color="#7A9B6E" roughness={0.95} />
        </mesh>
        <mesh castShadow position={[0.5, 2.2, -0.3]}>
          <sphereGeometry args={[0.6, 10, 8]} />
          <meshStandardMaterial color="#8FB07F" roughness={0.95} />
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
        <meshStandardMaterial color="#6E8A5C" roughness={0.95} />
      </mesh>
      <mesh castShadow position={[-0.4, 1.3, 0.1]}>
        <sphereGeometry args={[0.45, 10, 8]} />
        <meshStandardMaterial color="#7A9B6E" roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0.4, 1.4, -0.2]}>
        <sphereGeometry args={[0.4, 10, 8]} />
        <meshStandardMaterial color="#8FB07F" roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0, 1.7, 0.3]}>
        <sphereGeometry args={[0.35, 10, 8]} />
        <meshStandardMaterial color="#5E7A4D" roughness={0.95} />
      </mesh>
    </>
  );
}

function Bushes() {
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
            <meshStandardMaterial color={i % 2 === 0 ? '#6E8A5C' : '#7A9B6E'} roughness={0.95} />
          </mesh>
        );
      })}
    </group>
  );
}

function Benches() {
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
          <mesh castShadow position={[0, 0.45, 0]}>
            <boxGeometry args={[1.8, 0.12, 0.6]} />
            <meshStandardMaterial color="#7A5235" roughness={0.75} />
          </mesh>
          <mesh castShadow position={[-0.7, 0.7, -0.25]}>
            <boxGeometry args={[0.1, 0.7, 0.1]} />
            <meshStandardMaterial color="#5C4128" />
          </mesh>
          <mesh castShadow position={[0.7, 0.7, -0.25]}>
            <boxGeometry args={[0.1, 0.7, 0.1]} />
            <meshStandardMaterial color="#5C4128" />
          </mesh>
          <mesh castShadow position={[0, 1.0, -0.25]}>
            <boxGeometry args={[1.6, 0.12, 0.08]} />
            <meshStandardMaterial color="#7A5235" roughness={0.75} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Lamps — 4 lamp posts at the cardinal points around the plaza.
 *
 * Day/night reactive: bulb emissive intensity + halo opacity ramp up
 * after sunset and back down at dawn. Daytime is barely visible;
 * nighttime the courtyard glows warm amber.
 */
function Lamps() {
  const lamps = [
    { x:  4.5, z:  0 },
    { x: -4.5, z:  0 },
    { x:  0, z:  4.5 },
    { x:  0, z: -4.5 },
  ];
  const bulbRefs = useRef<THREE.Mesh[]>([]);
  const haloRefs = useRef<THREE.Mesh[]>([]);
  const { nightFactor } = useDayNight();

  useFrame(() => {
    const nf = nightFactor.current;
    // Day: ~0.75 emissive, ~0.22 halo. Night: ~2.5x emissive, ~0.77 halo.
    const bulbBoost = 0.75 + nf * 1.75;
    const haloOpacity = 0.22 + nf * 0.55;
    bulbRefs.current.forEach((mesh) => {
      if (mesh) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = bulbBoost;
      }
    });
    haloRefs.current.forEach((mesh) => {
      if (mesh) {
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = haloOpacity;
      }
    });
  });

  return (
    <group>
      {lamps.map((l, i) => (
        <group key={i} position={[l.x, 0, l.z]}>
          <mesh castShadow position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.18, 0.22, 0.2, 8]} />
            <meshStandardMaterial color="#3E2723" />
          </mesh>
          <mesh castShadow position={[0, 1.0, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 1.8, 8]} />
            <meshStandardMaterial color="#212121" />
          </mesh>
          <mesh castShadow position={[0, 1.85, 0]}>
            <boxGeometry args={[0.4, 0.06, 0.06]} />
            <meshStandardMaterial color="#212121" />
          </mesh>
          {/* warm amber bulb */}
          <mesh
            ref={(m) => { if (m) bulbRefs.current[i] = m; }}
            position={[0.2, 1.7, 0]}
          >
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshStandardMaterial color="#FFD89B" emissive="#FFCB85" emissiveIntensity={0.75} />
          </mesh>
          {/* warm halo */}
          <mesh
            ref={(m) => { if (m) haloRefs.current[i] = m; }}
            position={[0.2, 1.7, 0]}
          >
            <sphereGeometry args={[0.4, 12, 12]} />
            <meshBasicMaterial color="#FFE0B0" transparent opacity={0.22} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function PlaygroundEquipment({ woodMat }: { woodMat: THREE.Material }) {
  return (
    <group position={[18, 0, 12]}>
      {/* Swings — A-frame + 2 chains + 2 seats */}
      <group position={[-2.4, 0, 0]}>
        <mesh castShadow position={[-0.05, 1.5, -0.8]} rotation={[0, 0, -0.15]}>
          <cylinderGeometry args={[0.07, 0.07, 3, 8]} />
          <primitive object={woodMat} attach="material" />
        </mesh>
        <mesh castShadow position={[0.05, 1.5, -0.8]} rotation={[0, 0, 0.15]}>
          <cylinderGeometry args={[0.07, 0.07, 3, 8]} />
          <primitive object={woodMat} attach="material" />
        </mesh>
        <mesh castShadow position={[0, 3, -0.8]}>
          <cylinderGeometry args={[0.08, 0.08, 2.2, 8]} />
          <primitive object={woodMat} attach="material" />
        </mesh>
        <mesh position={[-0.7, 2.2, -0.8]}>
          <cylinderGeometry args={[0.02, 0.02, 1.4, 4]} />
          <meshStandardMaterial color="#424242" />
        </mesh>
        <mesh position={[0.7, 2.2, -0.8]}>
          <cylinderGeometry args={[0.02, 0.02, 1.4, 4]} />
          <meshStandardMaterial color="#424242" />
        </mesh>
        <mesh castShadow position={[-0.7, 1.5, -0.8]}>
          <boxGeometry args={[0.5, 0.06, 0.3]} />
          <meshStandardMaterial color="#C99B96" />
        </mesh>
        <mesh castShadow position={[0.7, 1.5, -0.8]}>
          <boxGeometry args={[0.5, 0.06, 0.3]} />
          <meshStandardMaterial color="#D8B26E" />
        </mesh>
      </group>

      {/* Slide */}
      <group position={[0, 0, 0.5]}>
        <mesh castShadow position={[-0.8, 0.9, -0.6]} rotation={[Math.PI / 8, 0, 0]}>
          <boxGeometry args={[0.5, 0.05, 1.6]} />
          <primitive object={woodMat} attach="material" />
        </mesh>
        {[0, 0.3, 0.6, 0.9].map((y, i) => (
          <mesh key={i} castShadow position={[-0.8, 0.3 + y, -0.5 + y * 0.18]}>
            <boxGeometry args={[0.5, 0.05, 0.05]} />
            <primitive object={woodMat} attach="material" />
          </mesh>
        ))}
        <mesh castShadow position={[-0.8, 1.4, -0.4]}>
          <boxGeometry args={[0.8, 0.08, 0.8]} />
          <primitive object={woodMat} attach="material" />
        </mesh>
        <mesh castShadow position={[0.1, 0.7, 0.3]} rotation={[-0.45, 0, 0]}>
          <boxGeometry args={[0.5, 0.04, 1.8]} />
          <meshStandardMaterial color="#D8B26E" />
        </mesh>
        <mesh position={[-0.18, 0.85, 0.3]} rotation={[-0.45, 0, 0]}>
          <boxGeometry args={[0.04, 0.18, 1.8]} />
          <meshStandardMaterial color="#C99B96" />
        </mesh>
        <mesh position={[0.38, 0.85, 0.3]} rotation={[-0.45, 0, 0]}>
          <boxGeometry args={[0.04, 0.18, 1.8]} />
          <meshStandardMaterial color="#C99B96" />
        </mesh>
      </group>

      {/* Seesaw */}
      <group position={[2.4, 0, 0]}>
        <mesh castShadow position={[0, 0.4, 0]}>
          <boxGeometry args={[0.3, 0.8, 0.5]} />
          <primitive object={woodMat} attach="material" />
        </mesh>
        <mesh castShadow position={[0, 0.9, 0]} rotation={[0.08, 0, 0]}>
          <boxGeometry args={[2.2, 0.08, 0.3]} />
          <meshStandardMaterial color="#C99B96" />
        </mesh>
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
  const flagRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (flagRef.current) {
      flagRef.current.rotation.y = Math.sin(clock.elapsedTime * 2) * 0.18;
    }
  });
  return (
    <group position={[0, 0, 0]}>
      <mesh castShadow position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 0.3, 8]} />
        <meshStandardMaterial color="#7A5235" />
      </mesh>
      <mesh castShadow position={[0, 4.5, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 8.5, 8]} />
        <meshStandardMaterial color="#BDBDBD" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[0, 9, 0]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color="#E8C788" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh ref={flagRef} position={[0.45, 7.5, 0]}>
        <planeGeometry args={[1.2, 0.8]} />
        <meshStandardMaterial color="#C99B96" side={2} />
      </mesh>
    </group>
  );
}

function EntranceMarker({ woodMat }: { woodMat: THREE.Material }) {
  return (
    <group position={[0, 0, 9]}>
      <mesh castShadow position={[-0.7, 1.2, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 2.4, 8]} />
        <primitive object={woodMat} attach="material" />
      </mesh>
      <mesh castShadow position={[0.7, 1.2, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 2.4, 8]} />
        <primitive object={woodMat} attach="material" />
      </mesh>
      <mesh castShadow position={[0, 2.45, 0]}>
        <boxGeometry args={[2.2, 0.3, 0.3]} />
        <meshStandardMaterial color="#5C4128" />
      </mesh>
      <mesh castShadow position={[0, 1.9, 0]}>
        <boxGeometry args={[1.4, 0.7, 0.08]} />
        <primitive object={woodMat} attach="material" />
      </mesh>
      <mesh castShadow position={[0, 1.9, 0.05]}>
        <boxGeometry args={[1.2, 0.5, 0.02]} />
        <meshStandardMaterial color="#EFE3D0" />
      </mesh>
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

function PerimeterStakes() {
  const stakes = useMemo(() => {
    const arr: Array<[number, number]> = [];
    for (let x = -32; x <= 32; x += 4) {
      arr.push([x, -32]);
      arr.push([x,  32]);
    }
    for (let z = -28; z <= 28; z += 4) {
      arr.push([-32, z]);
      arr.push([ 32, z]);
    }
    return arr;
  }, []);
  return (
    <group>
      {stakes.map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, 0.4, z]}>
          <cylinderGeometry args={[0.07, 0.1, 0.8, 6]} />
          <meshStandardMaterial color="#5C4128" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function FlowerBed({ position, colors }: { position: [number, number]; colors: string[] }) {
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[0.7, 16]} />
        <meshStandardMaterial color="#6B4631" roughness={0.9} />
      </mesh>
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

function Fountain({ woodMat }: { woodMat: THREE.Material }) {
  return (
    <group position={[0, 0, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
        <cylinderGeometry args={[1.2, 1.4, 0.5, 16]} />
        <meshStandardMaterial color="#A89878" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 0.1, 16]} />
        <meshStandardMaterial color="#A8C9D8" transparent opacity={0.7} metalness={0.2} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.8, 8]} />
        <primitive object={woodMat} attach="material" />
      </mesh>
      <mesh castShadow position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color="#E8C788" roughness={0.4} metalness={0.3} />
      </mesh>
    </group>
  );
}

function DistantHills({ hillTex }: { hillTex: THREE.CanvasTexture | null }) {
  if (!hillTex) return null;
  const ranges = [
    { pos: [0,  8, -55] as [number, number, number], w: 130, h: 35 },
    { pos: [0,  8,  55] as [number, number, number], w: 130, h: 35 },
    { pos: [-55, 8, 0]  as [number, number, number], w: 130, h: 35, ry: Math.PI / 2 },
    { pos: [ 55, 8, 0]  as [number, number, number], w: 130, h: 35, ry: Math.PI / 2 },
  ];
  return (
    <group>
      {ranges.map((r, i) => (
        <Billboard key={i} position={r.pos} follow={false}>
          <mesh rotation={[0, r.ry ?? 0, 0]}>
            <planeGeometry args={[r.w, r.h]} />
            <meshBasicMaterial map={hillTex} transparent depthWrite={false} fog={true} toneMapped={false} />
          </mesh>
        </Billboard>
      ))}
    </group>
  );
}
