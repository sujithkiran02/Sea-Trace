import { useEffect, useRef } from 'react';

import * as THREE from 'three';
import { SkyDome } from './SkyDome';
import { Ocean } from './Ocean';
import { ProceduralShip } from './ProceduralShip';
import { WakeParticles } from './WakeParticles';
import { SmokeSystem } from './SmokeSystem';
import { SeagullFlock } from './SeagullFlock';
import { CameraRig } from './CameraRig';
import { PostProcessingManager } from './PostProcessing';
import { SCENE_CONFIG } from '../../constants/sceneConfig';

export interface SceneTweaks {
  waveHeight: number;
  shipSpeed: number;
  sunAltitude: number;
  bloomStrength: number;
  isOrbitMode: boolean;
}

interface SceneCanvasProps {
  scrollProgress: number;
  introProgress: number;
  tweaks: SceneTweaks;
  onCameraRigReady?: (rig: CameraRig) => void;
}

export const SceneCanvas: React.FC<SceneCanvasProps> = ({
  scrollProgress,
  introProgress,
  tweaks,
  onCameraRigReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRigRef = useRef<CameraRig | null>(null);
  const skyDomeRef = useRef<SkyDome | null>(null);
  const oceanRef = useRef<Ocean | null>(null);
  const shipRef = useRef<ProceduralShip | null>(null);
  const postProcessingRef = useRef<PostProcessingManager | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // 1. Initialize Three.js Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(
      new THREE.Color(SCENE_CONFIG.lighting.skyHorizonColor),
      SCENE_CONFIG.lighting.fogDensity
    );

    // 2. Initialize Camera Rig
    const cameraRig = new CameraRig();
    cameraRigRef.current = cameraRig;
    if (onCameraRigReady) {
      onCameraRigReady(cameraRig);
    }

    // 3. Initialize High-Performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
      stencil: false,
      depth: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = SCENE_CONFIG.lighting.exposure;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 4. Initialize Scene Subsystems
    const skyDome = new SkyDome();
    skyDomeRef.current = skyDome;
    scene.add(skyDome.mesh);
    scene.add(skyDome.sunMesh);
    scene.add(skyDome.directionalLight);
    scene.add(skyDome.ambientLight);
    scene.add(skyDome.hemisphereLight);

    const ocean = new Ocean();
    oceanRef.current = ocean;
    scene.add(ocean.mesh);

    const ship = new ProceduralShip();
    shipRef.current = ship;
    scene.add(ship.group);

    const wakeParticles = new WakeParticles();
    scene.add(wakeParticles.group);

    const smokeSystem = new SmokeSystem();
    scene.add(smokeSystem.group);

    const seagullFlock = new SeagullFlock(SCENE_CONFIG.effects.seagullsCount);
    scene.add(seagullFlock.group);

    // 5. Initialize Post-Processing Composer
    let postProcessing: PostProcessingManager | null = null;
    try {
      postProcessing = new PostProcessingManager(renderer, scene, cameraRig.camera);
      postProcessingRef.current = postProcessing;
    } catch (err) {
      console.warn('Post-processing fallback to standard WebGL renderer', err);
    }

    // 6. Animation Loop (60 FPS)
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();

      // Update Ship Buoyancy & Physics
      ship.update(elapsedTime, ocean.material.uniforms.uWaveHeight.value / SCENE_CONFIG.ocean.waveHeight);

      // Update Wake & Bow Wave Particles
      wakeParticles.update(delta, elapsedTime, ship.group.position.y);

      // Update Funnel Smoke Particles
      smokeSystem.update(delta, ship.funnelPosition);

      // Update Seagulls
      seagullFlock.update(elapsedTime);

      // Update Sky & Ocean Lighting
      const duskProgress = cameraRig.scrollProgress; // As user scrolls down, golden hour deepens into dusk
      skyDome.update(elapsedTime, duskProgress, cameraRig.camera.position);
      ocean.update(elapsedTime, skyDome.sunPosition, ship.group.position);

      // Update Camera Choreography & Mouse Parallax
      cameraRig.update(delta, introProgress);

      // Render through Composer
      if (postProcessing && postProcessing.enabled) {
        postProcessing.render();
      } else {
        renderer.render(scene, cameraRig.camera);
      }
    };

    animate();

    // 7. Handle Window Resize
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      cameraRig.resize(width, height);
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      if (postProcessing) {
        postProcessing.resize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update dynamic scroll progress from GSAP
  useEffect(() => {
    if (cameraRigRef.current) {
      cameraRigRef.current.setScrollProgress(scrollProgress);
    }
  }, [scrollProgress]);

  // Update real-time scene tweaks
  useEffect(() => {
    if (oceanRef.current) {
      oceanRef.current.setWaveHeight(tweaks.waveHeight);
    }
    if (skyDomeRef.current) {
      skyDomeRef.current.setSunAltitude(tweaks.sunAltitude);
    }
    if (postProcessingRef.current) {
      postProcessingRef.current.setBloomStrength(tweaks.bloomStrength);
    }
    if (cameraRigRef.current) {
      cameraRigRef.current.toggleOrbitMode(tweaks.isOrbitMode);
    }
  }, [tweaks]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-auto"
      style={{ cursor: tweaks.isOrbitMode ? 'grab' : 'default' }}
    />
  );
};
