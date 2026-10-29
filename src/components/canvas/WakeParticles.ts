import * as THREE from 'three';
import { getWaterHeight } from '../../utils/waveMath';

export class WakeParticles {
  public group: THREE.Group;
  private sternPoints: THREE.Points;
  private bowPoints: THREE.Points;
  private sternPositions: Float32Array;
  private sternLifetimes: Float32Array;
  private sternVelocities: Float32Array;
  private bowPositions: Float32Array;
  private bowLifetimes: Float32Array;
  private bowVelocities: Float32Array;

  private sternCount = 500;
  private bowCount = 350;

  constructor() {
    this.group = new THREE.Group();

    // --- Stern Wake Foam Trail ---
    const sternGeo = new THREE.BufferGeometry();
    this.sternPositions = new Float32Array(this.sternCount * 3);
    this.sternLifetimes = new Float32Array(this.sternCount);
    this.sternVelocities = new Float32Array(this.sternCount * 3);

    for (let i = 0; i < this.sternCount; i++) {
      this.resetSternParticle(i, Math.random());
    }

    sternGeo.setAttribute('position', new THREE.BufferAttribute(this.sternPositions, 3));
    sternGeo.setAttribute('aLifetime', new THREE.BufferAttribute(this.sternLifetimes, 1));

    const sternMat = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float aLifetime;
        varying float vAlpha;
        void main() {
          vAlpha = smoothstep(0.0, 0.15, aLifetime) * smoothstep(1.0, 0.5, aLifetime);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = (38.0 * (0.8 + aLifetime * 2.2)) / -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;
          float foamGlow = smoothstep(0.5, 0.05, dist);
          vec3 foamColor = vec3(0.92, 0.96, 1.0);
          gl_FragColor = vec4(foamColor, vAlpha * foamGlow * 0.75);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    this.sternPoints = new THREE.Points(sternGeo, sternMat);
    this.group.add(this.sternPoints);

    // --- Bow Wave V-Shape Spray ---
    const bowGeo = new THREE.BufferGeometry();
    this.bowPositions = new Float32Array(this.bowCount * 3);
    this.bowLifetimes = new Float32Array(this.bowCount);
    this.bowVelocities = new Float32Array(this.bowCount * 3);

    for (let i = 0; i < this.bowCount; i++) {
      this.resetBowParticle(i, Math.random());
    }

    bowGeo.setAttribute('position', new THREE.BufferAttribute(this.bowPositions, 3));
    bowGeo.setAttribute('aLifetime', new THREE.BufferAttribute(this.bowLifetimes, 1));

    const bowMat = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float aLifetime;
        varying float vAlpha;
        void main() {
          vAlpha = smoothstep(0.0, 0.1, aLifetime) * smoothstep(1.0, 0.4, aLifetime);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = (24.0 * (0.5 + aLifetime * 1.8)) / -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;
          float spray = smoothstep(0.5, 0.0, dist);
          vec3 sprayColor = vec3(0.96, 0.98, 1.0);
          gl_FragColor = vec4(sprayColor, vAlpha * spray * 0.85);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.bowPoints = new THREE.Points(bowGeo, bowMat);
    this.group.add(this.bowPoints);
  }

  private resetSternParticle(i: number, progress = 0) {
    const i3 = i * 3;
    // Churning emission right behind transom stern (Z ~ -60)
    const lateralSpread = (Math.random() - 0.5) * 12;
    this.sternPositions[i3] = lateralSpread;
    this.sternPositions[i3 + 1] = 0.3;
    this.sternPositions[i3 + 2] = -60 - progress * 140;

    // Drifts backwards with slight outward churning expansion
    this.sternVelocities[i3] = (Math.random() - 0.5) * 1.5;
    this.sternVelocities[i3 + 1] = 0.05;
    this.sternVelocities[i3 + 2] = -12.0 - Math.random() * 4.0;

    this.sternLifetimes[i] = progress;
  }

  private resetBowParticle(i: number, progress = 0) {
    const i3 = i * 3;
    const side = Math.random() > 0.5 ? 1 : -1;
    // Emit from bow stem (Z ~ 66)
    this.bowPositions[i3] = side * (0.5 + Math.random() * 1.2);
    this.bowPositions[i3 + 1] = 0.8 + Math.random() * 0.5;
    this.bowPositions[i3 + 2] = 66 - progress * 40;

    // V-shape angled velocity: shooting out sideways and back
    this.bowVelocities[i3] = side * (6.0 + Math.random() * 4.0);
    this.bowVelocities[i3 + 1] = 0.4 + Math.random() * 0.6;
    this.bowVelocities[i3 + 2] = -14.0 - Math.random() * 3.0;

    this.bowLifetimes[i] = progress;
  }

  public update(delta: number, time: number, _shipY: number) {
    // 1. Update Stern Wake Foam
    for (let i = 0; i < this.sternCount; i++) {
      const i3 = i * 3;
      this.sternLifetimes[i] += delta * 0.22;

      if (this.sternLifetimes[i] >= 1.0) {
        this.resetSternParticle(i, 0);
      } else {
        // Move with water flow
        this.sternPositions[i3] += this.sternVelocities[i3] * delta;
        this.sternPositions[i3 + 2] += this.sternVelocities[i3 + 2] * delta;

        // Stick to water surface height
        const waterY = getWaterHeight(this.sternPositions[i3], this.sternPositions[i3 + 2], time);
        this.sternPositions[i3 + 1] = waterY + 0.15;
      }
    }
    this.sternPoints.geometry.attributes.position.needsUpdate = true;
    (this.sternPoints.geometry.attributes.aLifetime as THREE.BufferAttribute).needsUpdate = true;

    // 2. Update Bow Wave Spray
    for (let i = 0; i < this.bowCount; i++) {
      const i3 = i * 3;
      this.bowLifetimes[i] += delta * 0.45;

      if (this.bowLifetimes[i] >= 1.0) {
        this.resetBowParticle(i, 0);
      } else {
        this.bowPositions[i3] += this.bowVelocities[i3] * delta;
        this.bowPositions[i3 + 1] += this.bowVelocities[i3 + 1] * delta - 4.5 * delta * delta; // gravity
        this.bowPositions[i3 + 2] += this.bowVelocities[i3 + 2] * delta;

        // Keep above water
        const waterY = getWaterHeight(this.bowPositions[i3], this.bowPositions[i3 + 2], time);
        if (this.bowPositions[i3 + 1] < waterY + 0.1) {
          this.bowPositions[i3 + 1] = waterY + 0.1;
        }
      }
    }
    this.bowPoints.geometry.attributes.position.needsUpdate = true;
    (this.bowPoints.geometry.attributes.aLifetime as THREE.BufferAttribute).needsUpdate = true;
  }
}
