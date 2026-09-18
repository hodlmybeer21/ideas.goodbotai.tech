'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Humanoid from './Humanoid';
import { armFirstGesture, playFootstep } from '../lib/audio';
import { type Customization } from '../lib/customization';

const SPEED = 6;
const BOUNDS = 28;
const FOOTSTEP_INTERVAL = 0.36;

type Props = {
  color: string;
  joystick: { x: number; z: number };
  positionRef: React.MutableRefObject<THREE.Vector3>;
  customization: Customization;
};

/**
 * Player — drives the humanoid character based on keyboard + joystick input.
 * Owns position/facing, writes them to the shared positionRef each frame.
 *
 * Renders optional accessories (hat/backpack) as siblings of the Humanoid.
 * The accessory group rotates with the player's facing so the backpack
 * follows the player's back.
 *
 * Audio: arms a one-time first-gesture handler for the shared AudioContext,
 * triggers a procedural footstep every FOOTSTEP_INTERVAL while moving.
 */
export default function Player({ color, joystick, positionRef, customization }: Props) {
  const keysRef = useRef({
    w: false, a: false, s: false, d: false,
    up: false, down: false, left: false, right: false,
  });
  const facingRef = useRef(0);
  const movingRef = useRef(false);
  const stepAccumulator = useRef(0);
  const accGroupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    armFirstGesture();
  }, []);

  useEffect(() => {
    const map = (code: string, down: boolean) => {
      switch (code) {
        case 'KeyW': case 'ArrowUp':    keysRef.current.w = down; keysRef.current.up = down; break;
        case 'KeyS': case 'ArrowDown':  keysRef.current.s = down; keysRef.current.down = down; break;
        case 'KeyA': case 'ArrowLeft':  keysRef.current.a = down; keysRef.current.left = down; break;
        case 'KeyD': case 'ArrowRight': keysRef.current.d = down; keysRef.current.right = down; break;
      }
    };
    const dn = (e: KeyboardEvent) => map(e.code, true);
    const up = (e: KeyboardEvent) => map(e.code, false);
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', dn);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const cameraTarget = useRef(new THREE.Vector3(0, 8, 22));

  useFrame((state, delta) => {
    const keys = keysRef.current;
    let ix = 0, iz = 0;
    if (keys.a || keys.left)  ix -= 1;
    if (keys.d || keys.right) ix += 1;
    if (keys.w || keys.up)    iz -= 1;
    if (keys.s || keys.down)  iz += 1;

    if (Math.abs(joystick.x) > 0.05 || Math.abs(joystick.z) > 0.05) {
      ix += joystick.x;
      iz += joystick.z;
    }

    const len = Math.sqrt(ix * ix + iz * iz);
    if (len > 0) {
      ix /= len;
      iz /= len;
    }

    positionRef.current.x += ix * SPEED * delta;
    positionRef.current.z += iz * SPEED * delta;
    positionRef.current.x = Math.max(-BOUNDS, Math.min(BOUNDS, positionRef.current.x));
    positionRef.current.z = Math.max(-BOUNDS, Math.min(BOUNDS, positionRef.current.z));

    movingRef.current = len > 0;

    if (movingRef.current) {
      facingRef.current = Math.atan2(ix, iz);
      stepAccumulator.current += delta;
      if (stepAccumulator.current >= FOOTSTEP_INTERVAL) {
        stepAccumulator.current = 0;
        playFootstep();
      }
    } else {
      stepAccumulator.current = FOOTSTEP_INTERVAL * 0.5;
    }

    // Sync accessory group rotation with player facing
    if (accGroupRef.current) {
      accGroupRef.current.rotation.y = facingRef.current;
    }

    // Camera follow — third-person from behind+above
    const cam = state.camera;
    const desired = new THREE.Vector3(
      positionRef.current.x,
      positionRef.current.y + 9,
      positionRef.current.z + 13
    );
    cameraTarget.current.lerp(desired, Math.min(1, delta * 4));
    cam.position.copy(cameraTarget.current);
    cam.lookAt(positionRef.current.x, positionRef.current.y + 1, positionRef.current.z);
  });

  return (
    <group position={[0, 0, 8]}>
      <Humanoid
        color={color}
        height={1.0}
        moving={movingRef.current}
        facing={facingRef.current}
      />
      <group ref={accGroupRef}>
        {customization.hat === 'hat-party'  && <PartyHat />}
        {customization.hat === 'hat-wizard' && <WizardHat />}
        {customization.hat === 'hat-straw'  && <StrawHat />}
        {customization.backpack === 'bp-school' && <SchoolBag />}
      </group>
    </group>
  );
}

// ── Accessories ────────────────────────────────────────────
// All accessories sit in the player's local space at the same y as
// the chibi head top (~1.6). Hats are slightly above; backpack sits
// behind the torso, rotated with the player's facing (handled by the
// parent accGroupRef).

function PartyHat() {
  return (
    <group position={[0, 1.70, 0]}>
      <mesh castShadow position={[0, 0.18, 0]}>
        <coneGeometry args={[0.18, 0.36, 12]} />
        <meshStandardMaterial color="#E8B4A0" roughness={0.85} />
      </mesh>
      {/* Gold pom on top */}
      <mesh position={[0, 0.38, 0]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color="#FFD93D" roughness={0.6} />
      </mesh>
    </group>
  );
}

function WizardHat() {
  return (
    <group position={[0, 1.70, 0]} rotation={[0, 0, 0.08]}>
      {/* Brim */}
      <mesh castShadow position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.05, 16]} />
        <meshStandardMaterial color="#5C4128" roughness={0.85} />
      </mesh>
      {/* Tall pointy cone */}
      <mesh castShadow position={[0, 0.30, 0]}>
        <coneGeometry args={[0.18, 0.5, 12]} />
        <meshStandardMaterial color="#5C4128" roughness={0.85} />
      </mesh>
      {/* Glowing star at the tip */}
      <mesh position={[0, 0.55, 0.15]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#FFD93D" toneMapped={false} />
      </mesh>
    </group>
  );
}

function StrawHat() {
  return (
    <group position={[0, 1.72, 0]}>
      {/* Brim */}
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.30, 0.30, 0.04, 16]} />
        <meshStandardMaterial color="#C99B66" roughness={0.9} />
      </mesh>
      {/* Crown */}
      <mesh castShadow position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.18, 0.20, 0.08, 12]} />
        <meshStandardMaterial color="#D8B26E" roughness={0.9} />
      </mesh>
      {/* Decorative band */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.195, 0.195, 0.04, 12]} />
        <meshStandardMaterial color="#A04F3F" roughness={0.85} />
      </mesh>
    </group>
  );
}

function SchoolBag() {
  return (
    <group position={[0, 1.0, -0.32]}>
      {/* Bag body */}
      <mesh castShadow>
        <boxGeometry args={[0.36, 0.42, 0.18]} />
        <meshStandardMaterial color="#A04F3F" roughness={0.85} />
      </mesh>
      {/* Flap */}
      <mesh position={[0, 0.21, 0.04]} castShadow>
        <boxGeometry args={[0.36, 0.08, 0.20]} />
        <meshStandardMaterial color="#7A3E2A" roughness={0.85} />
      </mesh>
      {/* Strap loops */}
      <mesh position={[-0.11, 0.18, 0.10]}>
        <torusGeometry args={[0.06, 0.012, 6, 12, Math.PI]} />
        <meshStandardMaterial color="#5C4128" roughness={0.85} />
      </mesh>
      <mesh position={[0.11, 0.18, 0.10]}>
        <torusGeometry args={[0.06, 0.012, 6, 12, Math.PI]} />
        <meshStandardMaterial color="#5C4128" roughness={0.85} />
      </mesh>
      {/* Buckle */}
      <mesh position={[0, 0.21, 0.14]}>
        <boxGeometry args={[0.06, 0.04, 0.02]} />
        <meshStandardMaterial color="#E8C788" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}
