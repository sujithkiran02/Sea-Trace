import * as THREE from 'three';
import { SCENE_CONFIG } from '../../constants/sceneConfig';
import { GLSL_GERSTNER_SHADER_SNIPPET } from '../../utils/waveMath';

export class Ocean {
  public mesh: THREE.Mesh;
  public material: THREE.ShaderMaterial;
  private geometry: THREE.PlaneGeometry;

  constructor() {
    const { size, subdivisions } = SCENE_CONFIG.ocean;

    // Subdivided plane rotated horizontally
    this.geometry = new THREE.PlaneGeometry(size, size, subdivisions, subdivisions);
    this.geometry.rotateX(-Math.PI / 2);

    const vertexShader = `
      uniform float uTime;
      uniform float uWaveHeight;
      uniform float uWaveSpeed;

      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vWaveCrest;

      ${GLSL_GERSTNER_SHADER_SNIPPET}

      void main() {
        vUv = uv;
        vec3 pos = position;
        vec3 calculatedNormal;

        // Displace position using shared Gerstner wave mathematics
        vec3 displaced = calculateGerstnerWave(pos, uTime, uWaveHeight, uWaveSpeed, calculatedNormal);

        vWaveCrest = displaced.y;
        vNormal = normalize(normalMatrix * calculatedNormal);

        vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
        vWorldPosition = worldPos.xyz;

        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      uniform vec3 uSunPosition;
      uniform vec3 uWaterColor;
      uniform vec3 uWaterHighlight;
      uniform vec3 uSunGlitterColor;
      uniform vec3 uFoamColor;
      uniform vec3 uSkyZenith;
      uniform vec3 uSkyHorizon;
      uniform float uRoughness;
      uniform float uMetalness;
      uniform vec3 uShipPosition;

      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vWaveCrest;

      // Noise for micro-surface ripple & foam detail
      float hash(vec2 p) {
        p = 50.0 * fract(p * 0.3183099 + vec2(0.71, 0.113));
        return -1.0 + 2.0 * fract(16.0 * fract(p.x * p.y * (p.x + p.y)));
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                   mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
      }

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec3 normal = normalize(vNormal);

        // Add micro-surface normal perturbation for water ripples
        vec2 microUv = vWorldPosition.xz * 0.15 + vec2(uTime * 0.05, uTime * 0.03);
        float microNoise1 = noise(microUv * 4.0);
        float microNoise2 = noise(microUv * 8.0 + 1.7);
        vec3 perturbedNormal = normalize(normal + vec3(microNoise1 * 0.08, 0.0, microNoise2 * 0.08));

        // Fresnel approximation (Schlick's formula)
        float NdotV = max(0.0, dot(perturbedNormal, viewDir));
        float f0 = 0.04; // standard water reflectance at normal incidence
        float fresnel = f0 + (1.0 - f0) * pow(1.0 - NdotV, 5.0);

        // Sun light direction
        vec3 sunDir = normalize(uSunPosition - vWorldPosition);

        // Sun Specular Reflection (Sun-path streak on the water)
        vec3 halfDir = normalize(sunDir + viewDir);
        float NdotH = max(0.0, dot(perturbedNormal, halfDir));
        
        // Elongated anisotropic-style golden sun streak on ocean
        float specSharp = pow(NdotH, 256.0) * 4.5;
        float specBroad = pow(NdotH, 32.0) * 1.8;
        vec3 sunGlitter = uSunGlitterColor * (specSharp + specBroad);

        // Reflected Sky Color
        vec3 reflectedRay = reflect(-viewDir, perturbedNormal);
        float reflElev = clamp(reflectedRay.y, 0.0, 1.0);
        vec3 skyReflection = mix(uSkyHorizon, uSkyZenith, smoothstep(0.0, 0.7, reflElev));

        // Subsurface Water Body (Abyssal navy trough vs illuminated teal crest)
        float crestFactor = smoothstep(-1.2, 2.0, vWaveCrest);
        vec3 waterBody = mix(uWaterColor, uWaterHighlight, crestFactor * 0.65);

        // Surface foam on peak crests
        float foamNoise = noise(vWorldPosition.xz * 0.4 + uTime * 0.2);
        float foamFactor = smoothstep(1.3, 2.2, vWaveCrest + foamNoise * 0.4);
        vec3 surfaceFoam = uFoamColor * foamFactor * 0.9;

        // Wake interaction around ship hull
        // Hull stretches ~120m along Z axis around uShipPosition
        vec2 shipRel = vWorldPosition.xz - uShipPosition.xz;
        float distToCenter = length(vec2(shipRel.x * 2.5, shipRel.y * 0.15));
        float hullWake = smoothstep(18.0, 2.0, distToCenter);
        float sternChurn = smoothstep(45.0, 0.0, -shipRel.z) * smoothstep(16.0, 0.0, abs(shipRel.x)) * 0.8;
        float bowWave = smoothstep(15.0, 0.0, abs(shipRel.x) - (shipRel.z - 50.0) * 0.45) * smoothstep(65.0, 45.0, shipRel.z);
        
        float totalWake = clamp(hullWake * 0.35 + sternChurn + bowWave, 0.0, 1.0);
        float wakeBubbles = noise(vWorldPosition.xz * 1.2 - vec2(0.0, uTime * 1.5)) * 0.5 + 0.5;
        vec3 wakeColor = uFoamColor * totalWake * wakeBubbles;

        // Combine lighting components
        vec3 finalColor = mix(waterBody, skyReflection, fresnel * 0.75);
        finalColor += sunGlitter;
        finalColor = mix(finalColor, uFoamColor, clamp(foamFactor + totalWake * wakeBubbles, 0.0, 0.95));

        // Atmospheric Distance Fog
        float dist = length(cameraPosition - vWorldPosition);
        float fogFactor = 1.0 - exp(-dist * 0.00085);
        finalColor = mix(finalColor, uSkyHorizon, fogFactor * 0.75);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uWaveHeight: { value: SCENE_CONFIG.ocean.waveHeight },
        uWaveSpeed: { value: SCENE_CONFIG.ocean.waveSpeed },
        uSunPosition: { value: new THREE.Vector3() },
        uWaterColor: { value: new THREE.Color(SCENE_CONFIG.ocean.waterColor) },
        uWaterHighlight: { value: new THREE.Color(SCENE_CONFIG.ocean.waterHighlight) },
        uSunGlitterColor: { value: new THREE.Color(SCENE_CONFIG.ocean.sunGlitterColor) },
        uFoamColor: { value: new THREE.Color(SCENE_CONFIG.ocean.foamColor) },
        uSkyZenith: { value: new THREE.Color(SCENE_CONFIG.lighting.skyZenithColor) },
        uSkyHorizon: { value: new THREE.Color(SCENE_CONFIG.lighting.skyHorizonColor) },
        uRoughness: { value: SCENE_CONFIG.ocean.roughness },
        uMetalness: { value: SCENE_CONFIG.ocean.metalness },
        uShipPosition: { value: new THREE.Vector3() },
      },
      wireframe: false,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.receiveShadow = true;
  }

  public update(time: number, sunPos: THREE.Vector3, shipPos: THREE.Vector3, waveHeightMult = 1.0) {
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uSunPosition.value.copy(sunPos);
    this.material.uniforms.uShipPosition.value.copy(shipPos);
    this.material.uniforms.uWaveHeight.value = SCENE_CONFIG.ocean.waveHeight * waveHeightMult;
  }

  public setWaveHeight(height: number) {
    this.material.uniforms.uWaveHeight.value = height;
  }
}
