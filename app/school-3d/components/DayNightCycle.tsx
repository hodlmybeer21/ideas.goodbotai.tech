'use client';

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import {
  CYCLE_DURATION, PHASE_COLORS, getCurrentPhase,
  lerpColor, lerpNumber,
} from '../lib/time';
import { useDayNight } from '../lib/dayNightContext';
import Stars from './Stars';
import Moon from './Moon';

/**
 * DayNightCycle — drives the entire campus's lighting / sky / fog
 * system from one place. Writes to module-level day/night refs every
 * frame; SkyExtras, Lamps, etc. read those refs to fade in/out.
 *
 * Per frame:
 *   1. compute current cycle fraction t ∈ [0, 1)
 *   2. find adjacent phases + lerp parameter
 *   3. interpolate sun position + colors and apply to:
 *        - drei <Sky> shader uniforms (sunPosition)
 *        - ambient + hemisphere + directional lights
 *        - scene.fog color/near/far
 *        - scene.background color
 *   4. compute nightFactor for downstream consumers
 *
 * Cycle: 4 minutes (240s). Starts mid-day on each page load so kids
 * see the Ghibli-pastoral golden-hour palette first.
 */
export default function DayNightCycle() {
  const { scene } = useThree();

  // drei <Sky> exposes its internal SkyImpl instance — typed as any here
  // since the exact class is internal to three-stdlib.
  const skyRef        = useRef<any>(null);
  const ambientRef    = useRef<THREE.AmbientLight>(null);
  const hemiRef       = useRef<THREE.HemisphereLight>(null);
  const dirRef        = useRef<THREE.DirectionalLight>(null);

  const refs = useDayNight();

  // Performance.now() anchored start time so each session sees a unique
  // starting phase.
  const cycleStartRef = useRef<number>(0);
  if (cycleStartRef.current === 0) cycleStartRef.current = performance.now() / 1000;

  // Reusable scratch objects — avoid GC churn at 60fps
  const tmpColor = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const now = performance.now() / 1000;
    const elapsed = now - cycleStartRef.current;
    const t = (elapsed % CYCLE_DURATION) / CYCLE_DURATION;
    refs.timeRef.current = t;

    const phase = getCurrentPhase(t);
    const fromCol = PHASE_COLORS[phase.from];
    const toCol   = PHASE_COLORS[phase.to];
    const lt = phase.localT;

    // Sun position + color
    const sunX = lerpNumber(fromCol.sun.position[0], toCol.sun.position[0], lt);
    const sunY = lerpNumber(fromCol.sun.position[1], toCol.sun.position[1], lt);
    const sunZ = lerpNumber(fromCol.sun.position[2], toCol.sun.position[2], lt);
    const sunColor = lerpColor(fromCol.sun.color, toCol.sun.color, lt);

    // drei Sky shader uniform — cast because base Material doesn't expose uniforms.
    // The Three.js uniform shape is { value: Vector3 }.
    const skyMat = skyRef.current?.material as
      | (THREE.Material & { uniforms?: { sunPosition?: { value: THREE.Vector3 } } })
      | undefined;
    if (skyMat?.uniforms?.sunPosition) {
      skyMat.uniforms.sunPosition.value.set(sunX, sunY, sunZ);
    }

    // Ambient
    if (ambientRef.current) {
      tmpColor.set(lerpColor(fromCol.ambient.color, toCol.ambient.color, lt));
      ambientRef.current.color.copy(tmpColor);
      ambientRef.current.intensity = lerpNumber(
        fromCol.ambient.intensity, toCol.ambient.intensity, lt,
      );
    }

    // Hemisphere
    if (hemiRef.current) {
      tmpColor.set(lerpColor(fromCol.hemisphere.sky, toCol.hemisphere.sky, lt));
      hemiRef.current.color.copy(tmpColor);
      tmpColor.set(lerpColor(fromCol.hemisphere.ground, toCol.hemisphere.ground, lt));
      hemiRef.current.groundColor.copy(tmpColor);
      hemiRef.current.intensity = lerpNumber(
        fromCol.hemisphere.intensity, toCol.hemisphere.intensity, lt,
      );
    }

    // Directional (sun)
    if (dirRef.current) {
      tmpColor.set(sunColor);
      dirRef.current.color.copy(tmpColor);
      dirRef.current.position.set(sunX, sunY, sunZ);
    }

    // Fog + scene background
    if (scene.fog && (scene.fog as THREE.Fog).isFog) {
      const fog = scene.fog as THREE.Fog;
      tmpColor.set(lerpColor(fromCol.fog.color, toCol.fog.color, lt));
      fog.color.copy(tmpColor);
      fog.near = lerpNumber(fromCol.fog.near, toCol.fog.near, lt);
      fog.far  = lerpNumber(fromCol.fog.far,  toCol.fog.far,  lt);
    }
    if (scene.background && (scene.background as THREE.Color).isColor) {
      tmpColor.set(lerpColor(fromCol.bg, toCol.bg, lt));
      (scene.background as THREE.Color).copy(tmpColor);
    }

    // Night factor — drives stars/moon opacity and lamp emissive boost
    let nf = 0;
    if (t >= 0.65 && t < 0.80) nf = (t - 0.65) / 0.15;
    else if (t >= 0.80 && t < 0.95) nf = 1;
    else if (t >= 0.95) nf = Math.max(0, 1 - (t - 0.95) / 0.05);
    refs.nightFactor.current = nf;
    refs.starOpacity.current = nf;
    refs.moonOpacity.current = nf;
  });

  return (
    <>
      <Sky
        ref={skyRef}
        distance={450000}
        sunPosition={[60, 18, -25]}
        turbidity={10}
        rayleigh={4}
        mieCoefficient={0.012}
        mieDirectionalG={0.85}
      />
      <ambientLight ref={ambientRef} intensity={0.55} color="#FFE8C9" />
      <hemisphereLight ref={hemiRef} args={['#FFD89B', '#7A9B6E', 0.5]} />
      <directionalLight
        ref={dirRef}
        position={[40, 18, -25]}
        intensity={1.35}
        color="#FFCB85"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-35}
        shadow-camera-right={35}
        shadow-camera-top={35}
        shadow-camera-bottom={-35}
        shadow-camera-near={0.5}
        shadow-camera-far={100}
      />
      <Stars />
      <Moon />
    </>
  );
}
