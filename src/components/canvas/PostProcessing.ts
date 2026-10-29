import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { SCENE_CONFIG } from '../../constants/sceneConfig';

export class PostProcessingManager {
  public composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private vignettePass: ShaderPass;
  public enabled = true;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      colorSpace: THREE.SRGBColorSpace,
      samples: 2,
    });

    this.composer = new EffectComposer(renderer, renderTarget);

    // 1. Base Scene Render Pass
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    // 2. Cinematic Unreal Bloom Pass
    const { bloomStrength, bloomRadius, bloomThreshold } = SCENE_CONFIG.lighting;
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      bloomStrength,
      bloomRadius,
      bloomThreshold
    );
    this.composer.addPass(this.bloomPass);

    // 3. Subtle Lens Vignette & Warm Tint Shader Pass
    const VignetteShader = {
      uniforms: {
        tDiffuse: { value: null },
        offset: { value: 1.05 },
        darkness: { value: 1.15 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float offset;
        uniform float darkness;
        varying vec2 vUv;
        void main() {
          vec4 texel = texture2D(tDiffuse, vUv);
          vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
          float dist = dot(uv, uv);
          float vignette = clamp(1.0 - dist * darkness, 0.0, 1.0);
          
          // Subtle warm color grading
          vec3 warmGrading = mix(texel.rgb, texel.rgb * vec3(1.04, 0.98, 0.95), 0.35);
          gl_FragColor = vec4(warmGrading * vignette, texel.a);
        }
      `,
    };

    this.vignettePass = new ShaderPass(VignetteShader);
    this.composer.addPass(this.vignettePass);

    // 4. Output Pass with Tone Mapping and Color Space conversion
    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  public setBloomStrength(val: number) {
    this.bloomPass.strength = val;
  }

  public resize(width: number, height: number) {
    this.composer.setSize(width, height);
    this.bloomPass.resolution.set(width, height);
  }

  public render() {
    this.composer.render();
  }
}
