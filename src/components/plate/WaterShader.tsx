import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PLATE_CONFIG } from '../../constants/plateConfig';

interface WaterShaderProps {
  shipTransform: {
    heavePx: number;
    angleRad: number;
  };
  isReducedMotion: boolean;
  theme?: 'dark' | 'light';
}

export const WaterShader: React.FC<WaterShaderProps> = ({ shipTransform, isReducedMotion, theme = 'dark' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // 1. Scene, Camera & Fullscreen Quad
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);

    // 2. High-Performance Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 3. Load Plate Image & Water Mask Textures
    const textureLoader = new THREE.TextureLoader();
    const plateTexture = textureLoader.load(PLATE_CONFIG.imageSrc, () => {
      plateTexture.colorSpace = THREE.SRGBColorSpace;
      plateTexture.minFilter = THREE.LinearFilter;
      plateTexture.magFilter = THREE.LinearFilter;
    });

    const maskTexture = textureLoader.load(
      PLATE_CONFIG.waterMaskSrc,
      () => {
        if (materialRef.current) {
          materialRef.current.uniforms.uHasMask.value = 1.0;
        }
      },
      undefined,
      () => {
        // Fallback to procedural shader polygon mask if file fails
        if (materialRef.current) {
          materialRef.current.uniforms.uHasMask.value = 0.0;
        }
      }
    );

    // 4. Custom Water & Ship Motion Fragment Shader
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform sampler2D uTexture;
      uniform sampler2D uMask;
      uniform float uHasMask;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uImageResolution;
      uniform float uWaveAmplitude;
      uniform float uWaveSpeed;
      uniform float uFoamPulseSpeed;
      uniform float uShipHeave;
      uniform float uShipAngle;
      uniform vec2 uShipPivot;
      uniform float uReducedMotion;
      uniform float uIsLight;

      varying vec2 vUv;

      // Object-fit: cover coordinate mapper
      vec2 getCoverUv(vec2 uv, vec2 screenRes, vec2 imgRes) {
        float screenAspect = screenRes.x / screenRes.y;
        float imgAspect = imgRes.x / imgRes.y;
        vec2 newUv = uv;
        if (screenAspect > imgAspect) {
          float scale = imgAspect / screenAspect;
          newUv.y = (uv.y - 0.5) * scale + 0.5;
        } else {
          float scale = screenAspect / imgAspect;
          newUv.x = (uv.x - 0.5) * scale + 0.5;
        }
        return newUv;
      }

      // Procedural fallback mask for ship & horizon
      float getProceduralWaterMask(vec2 uv) {
        // Sky is above y > 0.835 (in bottom-left 0..1 UV coordinate space)
        float horizon = smoothstep(0.85, 0.82, uv.y);

        // Approximate ship hull polygon bounding box
        vec2 shipCenter = vec2(0.58, 0.52);
        vec2 d = uv - shipCenter;
        
        // Diagonal rotation aligned with ship axis (~28 deg)
        float c = cos(-0.48);
        float s = sin(-0.48);
        vec2 rotatedD = vec2(d.x * c - d.y * s, d.x * s + d.y * c);

        float insideShip = smoothstep(0.24, 0.18, abs(rotatedD.x * 2.8)) *
                           smoothstep(0.38, 0.32, abs(rotatedD.y));
        
        float shipMask = 1.0 - insideShip;
        return horizon * shipMask;
      }

      // Noise generator for micro-sparkles
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      void main() {
        vec2 coverUv = getCoverUv(vUv, uResolution, uImageResolution);

        // If UV is outside bounds
        if (coverUv.x < 0.0 || coverUv.x > 1.0 || coverUv.y < 0.0 || coverUv.y > 1.0) {
          gl_FragColor = vec4(0.02, 0.04, 0.12, 1.0);
          return;
        }

        // Determine water vs ship/sky mask
        // Mask image: white (1.0) = water, black (0.0) = ship & sky
        float waterMaskVal = 1.0;
        if (uHasMask > 0.5) {
          waterMaskVal = texture2D(uMask, coverUv).r;
        } else {
          waterMaskVal = getProceduralWaterMask(coverUv);
        }

        vec2 finalUv = coverUv;

        if (uReducedMotion < 0.5) {
          // --- WATER MOTION (UV Displacement) ---
          if (waterMaskVal > 0.02) {
            // Directional waves moving towards camera and slightly left
            vec2 waveDir1 = normalize(vec2(-0.35, -0.92));
            vec2 waveDir2 = normalize(vec2(-0.20, -0.75));
            vec2 waveDir3 = normalize(vec2(0.45, -0.85));

            float t = uTime * uWaveSpeed;

            // Multi-octave wave coordinates
            float w1 = sin(dot(coverUv * 28.0, waveDir1) + t * 2.2);
            float w2 = cos(dot(coverUv * 48.0, waveDir2) + t * 3.4);
            float w3 = sin(dot(coverUv * 92.0, waveDir3) + t * 4.8);

            vec2 totalWaveOffset = waveDir1 * (w1 * 0.55) +
                                   waveDir2 * (w2 * 0.30) +
                                   waveDir3 * (w3 * 0.15);

            vec2 pxOffset = (totalWaveOffset * uWaveAmplitude) / uResolution;
            finalUv += pxOffset * waterMaskVal;
          }

          // --- SHIP MOTION (Gentle Heave & Pitch on the Vessel) ---
          float shipInfluence = 1.0 - waterMaskVal;
          if (shipInfluence > 0.02) {
            // Pivot rotation and heave
            vec2 p = finalUv - uShipPivot;
            float cosA = cos(uShipAngle * shipInfluence);
            float sinA = sin(uShipAngle * shipInfluence);
            vec2 rotated = vec2(p.x * cosA - p.y * sinA, p.x * sinA + p.y * cosA);

            finalUv = uShipPivot + rotated;
            finalUv.y += (uShipHeave / uResolution.y) * shipInfluence;
          }
        }

        // Sample base photo plate
        vec4 color = texture2D(uTexture, finalUv);

        // --- FOAM PULSING & BRIGHTNESS ANIMATION ---
        if (uReducedMotion < 0.5 && waterMaskVal > 0.1) {
          float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
          // Isolate white foam areas (bow wave, stern wake)
          float foamMask = smoothstep(0.68, 0.95, luma) * waterMaskVal;
          
          float pulse = (sin(uTime * uFoamPulseSpeed + finalUv.x * 12.0) * 0.5 + 0.5) * 0.25;
          color.rgb += color.rgb * (foamMask * pulse * 0.85);

          // --- ORANGE WATER REFLECTION SPARKLES (Bottom-Right) ---
          // Delicate twinkling pin-point glints on the amber reflection
          if (coverUv.x > 0.65 && coverUv.y < 0.48 && coverUv.y > 0.08) {
            vec2 cellUv = fract(finalUv * 240.0) - 0.5;
            float dist = length(cellUv);
            vec2 grid = floor(finalUv * 240.0);
            float sparkleRand = hash(grid);
            if (sparkleRand > 0.95 && dist < 0.28) {
              float sparkleFreq = sparkleRand * 18.0;
              float twinkle = pow(sin(uTime * 3.5 + sparkleFreq) * 0.5 + 0.5, 6.0);
              float falloff = smoothstep(0.28, 0.0, dist);
              vec3 sparkleColor = mix(vec3(1.0, 0.78, 0.38) * 1.6, vec3(1.0, 0.98, 0.92) * 2.2, uIsLight);
              color.rgb += sparkleColor * (twinkle * falloff * waterMaskVal * 0.65);
            }
          }
        }

        gl_FragColor = color;
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: plateTexture },
        uMask: { value: maskTexture },
        uHasMask: { value: 1.0 },
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uImageResolution: { value: new THREE.Vector2(1024, 576) },
        uWaveAmplitude: { value: PLATE_CONFIG.water.waveAmplitude },
        uWaveSpeed: { value: PLATE_CONFIG.water.waveSpeed },
        uFoamPulseSpeed: { value: PLATE_CONFIG.water.foamPulseSpeed },
        uShipHeave: { value: 0 },
        uShipAngle: { value: 0 },
        uShipPivot: { value: new THREE.Vector2(PLATE_CONFIG.ship.pivotNormalized.x, PLATE_CONFIG.ship.pivotNormalized.y) },
        uReducedMotion: { value: isReducedMotion ? 1.0 : 0.0 },
        uIsLight: { value: theme === 'light' ? 1.0 : 0.0 },
      },
    });
    materialRef.current = material;

    const quad = new THREE.Mesh(geometry, material);
    scene.add(quad);

    // 5. Render Loop with Visibility & Reduced-Motion Handlers
    let animationFrameId: number;
    let isTabVisible = true;
    const clock = new THREE.Clock();

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isTabVisible) return;

      clock.getDelta();

      const elapsed = clock.getElapsedTime();

      if (materialRef.current) {
        materialRef.current.uniforms.uTime.value = elapsed;
        materialRef.current.uniforms.uShipHeave.value = shipTransform.heavePx;
        materialRef.current.uniforms.uShipAngle.value = shipTransform.angleRad;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 6. Resize Handler
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      if (materialRef.current) {
        materialRef.current.uniforms.uResolution.value.set(width, height);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      plateTexture.dispose();
      maskTexture.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update dynamic transforms & reduced motion flag & theme
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uShipHeave.value = shipTransform.heavePx;
      materialRef.current.uniforms.uShipAngle.value = shipTransform.angleRad;
      materialRef.current.uniforms.uReducedMotion.value = isReducedMotion ? 1.0 : 0.0;
      materialRef.current.uniforms.uIsLight.value = theme === 'light' ? 1.0 : 0.0;
    }
  }, [shipTransform, isReducedMotion, theme]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};
