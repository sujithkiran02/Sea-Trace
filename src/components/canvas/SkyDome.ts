import * as THREE from 'three';
import { SCENE_CONFIG } from '../../constants/sceneConfig';

export class SkyDome {
  public mesh: THREE.Mesh;
  public sunMesh: THREE.Mesh;
  public directionalLight: THREE.DirectionalLight;
  public ambientLight: THREE.AmbientLight;
  public hemisphereLight: THREE.HemisphereLight;
  private material: THREE.ShaderMaterial;
  private sunMaterial: THREE.ShaderMaterial;
  public sunPosition: THREE.Vector3;

  constructor() {
    this.sunPosition = new THREE.Vector3();
    this.updateSunDirection(SCENE_CONFIG.lighting.sunAltitude, SCENE_CONFIG.lighting.sunAzimuth);

    // Sky Dome Geometry (Inverted Sphere)
    const skyGeo = new THREE.SphereGeometry(1800, 48, 32);
    skyGeo.scale(-1, 1, 1);

    const vertexShader = `
      varying vec3 vWorldPosition;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      uniform vec3 uSunPosition;
      uniform float uDuskProgress;
      uniform vec3 uZenithColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uDuskColor;
      uniform vec3 uSunColor;

      varying vec3 vWorldPosition;
      varying vec2 vUv;

      // 2D Simplex-like noise for layered sunset clouds
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                           -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
          + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec3 ray = normalize(vWorldPosition);
        float elevation = clamp(ray.y, 0.0, 1.0);

        // Sky gradient transitions
        // Zenith (deep navy) -> Dusk (magenta/purple) -> Horizon (golden orange)
        vec3 horizonMix = mix(uHorizonColor, vec3(0.95, 0.45, 0.15), uDuskProgress * 0.4);
        vec3 duskMix = mix(uDuskColor, vec3(0.25, 0.08, 0.35), uDuskProgress * 0.6);
        vec3 zenithMix = mix(uZenithColor, vec3(0.02, 0.04, 0.09), uDuskProgress * 0.7);

        // 3-stop vertical gradient
        vec3 skyColor = mix(horizonMix, duskMix, smoothstep(0.0, 0.28, elevation));
        skyColor = mix(skyColor, zenithMix, smoothstep(0.22, 0.95, elevation));

        // Sun disc and luminous glow
        vec3 sunDir = normalize(uSunPosition);
        float cosTheta = dot(ray, sunDir);

        // Sun aureole/glow
        float sunGlow = pow(max(0.0, cosTheta), 32.0) * 1.5;
        float broadHalo = pow(max(0.0, cosTheta), 4.0) * 0.45;
        vec3 sunEffect = (uSunColor * sunGlow * 1.8) + (vec3(1.0, 0.75, 0.4) * broadHalo);

        // Horizon golden haze mist
        float horizonMist = exp(-elevation * 12.0) * 0.45;
        skyColor += vec3(1.0, 0.62, 0.25) * horizonMist;

        // Thin drifting stratocumulus clouds
        if (elevation > 0.01 && elevation < 0.45) {
          vec2 cloudUv = vec2(ray.x / (ray.y + 0.15), ray.z / (ray.y + 0.15)) * 0.7;
          cloudUv.x += uTime * 0.008; // slow drift
          
          float n = snoise(cloudUv * 1.8) * 0.5 + 0.5;
          n += snoise(cloudUv * 4.2) * 0.25;
          
          // Layered cloud density
          float cloudMask = smoothstep(0.52, 0.78, n) * smoothstep(0.02, 0.14, elevation) * smoothstep(0.42, 0.25, elevation);
          
          // Sunlight catching clouds from low below
          vec3 cloudSunLit = vec3(1.0, 0.55, 0.28) * 2.2;
          vec3 cloudShadow = vec3(0.35, 0.18, 0.32);
          vec3 cloudColor = mix(cloudShadow, cloudSunLit, smoothstep(0.2, 0.8, cosTheta * 0.5 + 0.5));
          
          skyColor = mix(skyColor, cloudColor, cloudMask * 0.82);
        }

        skyColor += sunEffect;
        gl_FragColor = vec4(skyColor, 1.0);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uSunPosition: { value: this.sunPosition },
        uDuskProgress: { value: 0 },
        uZenithColor: { value: new THREE.Color(SCENE_CONFIG.lighting.skyZenithColor) },
        uHorizonColor: { value: new THREE.Color(SCENE_CONFIG.lighting.skyHorizonColor) },
        uDuskColor: { value: new THREE.Color(SCENE_CONFIG.lighting.skyDuskColor) },
        uSunColor: { value: new THREE.Color(SCENE_CONFIG.lighting.sunColor) },
      },
      side: THREE.BackSide,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(skyGeo, this.material);

    // Glowing Sun Disc Mesh (positioned near horizon with soft bloom corona)
    const sunGeo = new THREE.PlaneGeometry(160, 160);
    const sunVertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    const sunFragmentShader = `
      varying vec2 vUv;
      uniform vec3 uSunColor;
      void main() {
        vec2 uv = vUv * 2.0 - 1.0;
        float d = length(uv);
        if (d > 1.0) discard;

        // Hot glowing core
        float core = smoothstep(0.65, 0.0, d);
        // Soft corona halo
        float halo = pow(1.0 - d, 2.5) * 1.8;

        vec3 color = mix(uSunColor, vec3(1.0, 0.98, 0.85), core);
        float alpha = clamp(core * 1.2 + halo * 0.9, 0.0, 1.0);

        gl_FragColor = vec4(color * (1.5 + core * 2.0), alpha);
      }
    `;

    this.sunMaterial = new THREE.ShaderMaterial({
      vertexShader: sunVertexShader,
      fragmentShader: sunFragmentShader,
      uniforms: {
        uSunColor: { value: new THREE.Color(SCENE_CONFIG.lighting.sunColor) },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.sunMesh = new THREE.Mesh(sunGeo, this.sunMaterial);
    this.updateSunPositionMesh();

    // Sunlight (Directional)
    this.directionalLight = new THREE.DirectionalLight(
      new THREE.Color(SCENE_CONFIG.lighting.sunColor),
      SCENE_CONFIG.lighting.sunIntensity
    );
    this.directionalLight.position.copy(this.sunPosition);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 10;
    this.directionalLight.shadow.camera.far = 1600;
    const shadowD = 120;
    this.directionalLight.shadow.camera.left = -shadowD;
    this.directionalLight.shadow.camera.right = shadowD;
    this.directionalLight.shadow.camera.top = shadowD;
    this.directionalLight.shadow.camera.bottom = -shadowD;
    this.directionalLight.shadow.bias = -0.0004;

    // Ambient & Sky Bounce Lighting
    this.ambientLight = new THREE.AmbientLight(
      new THREE.Color(SCENE_CONFIG.lighting.ambientColor),
      SCENE_CONFIG.lighting.ambientIntensity
    );

    this.hemisphereLight = new THREE.HemisphereLight(
      new THREE.Color(SCENE_CONFIG.lighting.skyHorizonColor),
      new THREE.Color(SCENE_CONFIG.ocean.waterColor),
      0.85
    );
  }

  public updateSunDirection(altitudeDeg: number, azimuthDeg: number) {
    const phi = THREE.MathUtils.degToRad(90 - altitudeDeg);
    const theta = THREE.MathUtils.degToRad(azimuthDeg);

    const radius = 1200;
    this.sunPosition.set(
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.cos(theta)
    );
  }

  public updateSunPositionMesh() {
    this.sunMesh.position.copy(this.sunPosition);
    this.sunMesh.lookAt(0, 0, 0);
  }

  public update(time: number, duskProgress = 0, cameraPos?: THREE.Vector3) {
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uDuskProgress.value = duskProgress;

    // Keep sky dome centered on camera to eliminate clipping
    if (cameraPos) {
      this.mesh.position.copy(cameraPos);
    }

    // Orient sun billboard facing camera
    if (cameraPos) {
      this.sunMesh.lookAt(cameraPos);
    }
  }

  public setSunAltitude(altitudeDeg: number) {
    this.updateSunDirection(altitudeDeg, SCENE_CONFIG.lighting.sunAzimuth);
    this.material.uniforms.uSunPosition.value.copy(this.sunPosition);
    this.updateSunPositionMesh();
    this.directionalLight.position.copy(this.sunPosition);
  }
}
