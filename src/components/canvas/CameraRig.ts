import * as THREE from 'three';

export interface CameraWaypoint {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
}

export const CAMERA_SHOTS: CameraWaypoint[] = [
  // 0. Hero Establishing Shot - Low 3/4 bow angle looking across the vessel towards sunset
  {
    position: new THREE.Vector3(64, 16, 88),
    target: new THREE.Vector3(-4, 7, 10),
    fov: 46,
  },
  // 1. Services Section - Side profile cruising shot showing cargo stacks and hull length
  {
    position: new THREE.Vector3(98, 14, -8),
    target: new THREE.Vector3(-2, 9, -15),
    fov: 44,
  },
  // 2. Global Routes - Low waterline bow-forward angle showing ship cutting through waves
  {
    position: new THREE.Vector3(12, 3.8, 92),
    target: new THREE.Vector3(0, 12, 35),
    fov: 50,
  },
  // 3. Fleet Showcase - High aerial drone shot looking down across container deck & bridge
  {
    position: new THREE.Vector3(-52, 62, -18),
    target: new THREE.Vector3(0, 8, -12),
    fov: 42,
  },
  // 4. Contact / Footer - Majestic stern departure view into the sunset
  {
    position: new THREE.Vector3(46, 20, -94),
    target: new THREE.Vector3(0, 11, -35),
    fov: 45,
  },
];

export class CameraRig {
  public camera: THREE.PerspectiveCamera;
  public currentPosition = new THREE.Vector3();
  public currentTarget = new THREE.Vector3();
  private targetPosition = new THREE.Vector3();
  private targetLookAt = new THREE.Vector3();

  // Mouse Parallax
  private mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  public isOrbitMode = false;
  private orbitAngles = { phi: 0.3, theta: 0.7, distance: 110 };
  private isPointerDown = false;
  private previousMousePosition = { x: 0, y: 0 };

  // Scroll Progress (0.0 to 1.0)
  public scrollProgress = 0;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.5, 4000);

    // Initial position for intro dolly-in (starts further back & lower, then glides in)
    this.currentPosition.set(85, 22, 120);
    this.currentTarget.set(0, 6, 20);
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentTarget);

    this.bindEvents();
  }

  private bindEvents() {
    window.addEventListener('mousemove', (e) => {
      // Normalized mouse (-1 to +1)
      this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;

      if (this.isOrbitMode && this.isPointerDown) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;

        this.orbitAngles.theta -= deltaX * 0.006;
        this.orbitAngles.phi = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, this.orbitAngles.phi + deltaY * 0.006));

        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener('mousedown', (e) => {
      if (this.isOrbitMode) {
        this.isPointerDown = true;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener('mouseup', () => {
      this.isPointerDown = false;
    });

    window.addEventListener('wheel', (e) => {
      if (this.isOrbitMode) {
        this.orbitAngles.distance = Math.max(30, Math.min(220, this.orbitAngles.distance + e.deltaY * 0.05));
      }
    }, { passive: true });
  }

  public setScrollProgress(progress: number) {
    this.scrollProgress = Math.max(0, Math.min(1, progress));
  }

  public setShot(shotIndex: number) {
    const idx = Math.max(0, Math.min(CAMERA_SHOTS.length - 1, shotIndex));
    this.scrollProgress = idx / (CAMERA_SHOTS.length - 1);
  }

  public toggleOrbitMode(enable?: boolean) {
    this.isOrbitMode = enable !== undefined ? enable : !this.isOrbitMode;
    return this.isOrbitMode;
  }

  public update(_delta: number, introProgress = 1.0) {
    // Smooth mouse parallax interpolation
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    if (this.isOrbitMode) {
      // Orbit camera mode around ship center
      const sinPhiRadius = this.orbitAngles.distance * Math.cos(this.orbitAngles.phi);
      this.targetPosition.set(
        sinPhiRadius * Math.sin(this.orbitAngles.theta),
        this.orbitAngles.distance * Math.sin(this.orbitAngles.phi),
        sinPhiRadius * Math.cos(this.orbitAngles.theta)
      );
      this.targetLookAt.set(0, 8, 0);
    } else {
      // Scripted ScrollTrigger interpolation between the 5 camera shots
      const totalIntervals = CAMERA_SHOTS.length - 1;
      const scaledProgress = this.scrollProgress * totalIntervals;
      const index = Math.floor(scaledProgress);
      const nextIndex = Math.min(index + 1, totalIntervals);
      const fraction = scaledProgress - index;

      // Smooth ease for shot transition
      const ease = fraction * fraction * (3 - 2 * fraction);

      const shotA = CAMERA_SHOTS[index];
      const shotB = CAMERA_SHOTS[nextIndex];

      this.targetPosition.lerpVectors(shotA.position, shotB.position, ease);
      this.targetLookAt.lerpVectors(shotA.target, shotB.target, ease);

      // Interpolate Field of View
      const targetFov = shotA.fov + (shotB.fov - shotA.fov) * ease;
      this.camera.fov += (targetFov - this.camera.fov) * 0.08;
      this.camera.updateProjectionMatrix();

      // Intro cinematic dolly-in modulation
      if (introProgress < 1.0) {
        const introOffset = (1.0 - introProgress) * 35;
        this.targetPosition.z += introOffset;
        this.targetPosition.x += introOffset * 0.5;
        this.targetPosition.y += introOffset * 0.25;
      }

      // Add subtle organic mouse parallax
      this.targetPosition.x += this.mouse.x * 3.5;
      this.targetPosition.y += this.mouse.y * 2.2;
      this.targetLookAt.x += this.mouse.x * 1.5;
      this.targetLookAt.y += this.mouse.y * 1.0;
    }

    // High precision damping for cinematic feel
    const dampSpeed = this.isOrbitMode ? 0.12 : 0.045;
    this.currentPosition.lerp(this.targetPosition, dampSpeed);
    this.currentTarget.lerp(this.targetLookAt, dampSpeed);

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentTarget);
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
