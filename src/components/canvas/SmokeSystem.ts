import * as THREE from 'three';

export class SmokeSystem {
  public group: THREE.Group;
  private points: THREE.Points;
  private positions: Float32Array;
  private lifetimes: Float32Array;
  private velocities: Float32Array;
  private scales: Float32Array;

  private particleCount = 140;

  constructor() {
    this.group = new THREE.Group();

    const geo = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.particleCount * 3);
    this.lifetimes = new Float32Array(this.particleCount);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.scales = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      this.resetParticle(i, Math.random());
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute('aLifetime', new THREE.BufferAttribute(this.lifetimes, 1));
    geo.setAttribute('aScale', new THREE.BufferAttribute(this.scales, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float aLifetime;
        attribute float aScale;
        varying float vAlpha;
        void main() {
          vAlpha = smoothstep(0.0, 0.2, aLifetime) * smoothstep(1.0, 0.45, aLifetime);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = (aScale * 35.0 * (1.0 + aLifetime * 3.5)) / -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;
          // Soft puff density
          float puff = smoothstep(0.5, 0.0, dist);
          // Sunset-lit warm smoke tint
          vec3 smokeColor = mix(vec3(0.35, 0.38, 0.45), vec3(0.85, 0.65, 0.55), 0.3);
          gl_FragColor = vec4(smokeColor, vAlpha * puff * 0.28);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    this.points = new THREE.Points(geo, mat);
    this.group.add(this.points);
  }

  private resetParticle(i: number, progress = 0) {
    const i3 = i * 3;
    // Base funnel exhaust location
    const baseZ = -43.0;
    const baseY = 24.5;

    this.positions[i3] = (Math.random() - 0.5) * 1.2;
    this.positions[i3 + 1] = baseY + progress * 8.0;
    this.positions[i3 + 2] = baseZ - progress * 55.0;

    // Drifting velocity: back with vessel apparent wind (-Z), slight upward thermal (+Y), subtle lateral turbulence (X)
    this.velocities[i3] = (Math.random() - 0.5) * 1.5;
    this.velocities[i3 + 1] = 1.6 + Math.random() * 1.2;
    this.velocities[i3 + 2] = -14.0 - Math.random() * 3.0;

    this.scales[i] = 0.8 + Math.random() * 0.5;
    this.lifetimes[i] = progress;
  }

  public update(delta: number, funnelWorldPos: THREE.Vector3) {
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      this.lifetimes[i] += delta * 0.28;

      if (this.lifetimes[i] >= 1.0) {
        // Respawn at current funnel world position
        this.positions[i3] = funnelWorldPos.x + (Math.random() - 0.5) * 1.0;
        this.positions[i3 + 1] = funnelWorldPos.y;
        this.positions[i3 + 2] = funnelWorldPos.z;
        this.lifetimes[i] = 0;
      } else {
        this.positions[i3] += this.velocities[i3] * delta;
        this.positions[i3 + 1] += this.velocities[i3 + 1] * delta;
        this.positions[i3 + 2] += this.velocities[i3 + 2] * delta;
      }
    }

    this.points.geometry.attributes.position.needsUpdate = true;
    (this.points.geometry.attributes.aLifetime as THREE.BufferAttribute).needsUpdate = true;
  }
}
