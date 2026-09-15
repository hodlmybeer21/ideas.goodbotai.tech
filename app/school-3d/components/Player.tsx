'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Humanoid from './Humanoid';

const SPEED = 6;
const BOUNDS = 28;
const YAW_RATE = 2.4; // radians/sec when joystick fully deflected

type Props = {
  color: string;
  joystick: { x: number; z: number };
  cameraJoystick: number;        // -1..1 horizontal (right = rotate right)
  yawRef: React.MutableRefObject<number>;
  positionRef: React.MutableRefObject<THREE.Vector3>;
};

/**
 * Player — drives the humanoid character based on keyboard + joystick input.
 * Movement is CAMERA-RELATIVE: W always moves "away from the camera" regardless
 * of which way the camera is facing. The camera yaw is in `yawRef` and is
 * owned by page.tsx so mouse-drag and the camera joystick can both write it.
 */
export default function Player({ color, joystick, cameraJoystick, yawRef, positionRef }: Props) {
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
    const dn = (e: KeyboardEvent) => {
      // Stop arrow keys from scrolling the page when the canvas has focus
      if (e.code.startsWith('Arrow')) e.preventDefault();
      map(e.code, true);
    };
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

    // Camera joystick continuously rotates the camera yaw while held.
    // (Mouse drag on the canvas also writes yawRef — handled in page.tsx.)
    if (Math.abs(cameraJoystick) > 0.05) {
      yawRef.current -= cameraJoystick * YAW_RATE * delta;
    }

    // 1. Gather camera-space input vector
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

    // 2. Rotate camera-space input by yaw to get WORLD-space input
    // Standard Y-axis rotation: X' = X*cos + Z*sin,  Z' = -X*sin + Z*cos
    const yaw = yawRef.current;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const wx = ix * cosY + iz * sinY;
    const wz = -ix * sinY + iz * cosY;

    // 3. Move in world space
    positionRef.current.x += wx * SPEED * delta;
    positionRef.current.z += wz * SPEED * delta;
    positionRef.current.x = Math.max(-BOUNDS, Math.min(BOUNDS, positionRef.current.x));
    positionRef.current.z = Math.max(-BOUNDS, Math.min(BOUNDS, positionRef.current.z));

    movingRef.current = len > 0;
    if (movingRef.current) {
      facingRef.current = Math.atan2(wx, wz);
    }

    // 4. Camera follows at the current yaw angle (orbiting the player)
    const cam = state.camera;
    const camDist = 13;
    const camHeight = 9;
    const desired = new THREE.Vector3(
      positionRef.current.x + Math.sin(yaw) * camDist,
      positionRef.current.y + camHeight,
      positionRef.current.z + Math.cos(yaw) * camDist
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
