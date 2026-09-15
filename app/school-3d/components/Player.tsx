'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Humanoid from './Humanoid';

const SPEED = 6;
const BOUNDS = 28;

type Props = {
  color: string;
  joystick: { x: number; z: number };
  positionRef: React.MutableRefObject<THREE.Vector3>;
};

/**
 * Player — drives the humanoid character based on keyboard + joystick input.
 * Owns position/facing, writes them to the shared positionRef each frame.
 */
export default function Player({ color, joystick, positionRef }: Props) {
  const keysRef = useRef({
    w: false, a: false, s: false, d: false,
    up: false, down: false, left: false, right: false,
  });
  const facingRef = useRef(0);
  const movingRef = useRef(false);

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
    </group>
  );
}
