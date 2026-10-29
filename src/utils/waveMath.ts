/**
 * Synchronized Wave Mathematics for both CPU (Ship buoyancy) & GPU (Water GLSL Shader).
 * Uses a 4-octave directional wave system to produce authentic deep-water swells with chop.
 */

export interface WaveComponent {
  direction: [number, number]; // Normalized [x, z]
  steepness: number;           // Gerstner steepness (0 to 1)
  wavelength: number;          // Peak-to-peak distance
  speed: number;               // Propagation velocity
}

export const WAVE_COMPONENTS: WaveComponent[] = [
  { direction: [0.707, 0.707], steepness: 0.35, wavelength: 75.0, speed: 1.1 },
  { direction: [-0.5, 0.866],  steepness: 0.25, wavelength: 42.0, speed: 1.3 },
  { direction: [0.92, -0.38],  steepness: 0.18, wavelength: 22.0, speed: 1.6 },
  { direction: [-0.38, -0.92], steepness: 0.12, wavelength: 12.0, speed: 2.0 },
];

/**
 * Computes exact water surface height at world coordinates (x, z) at time t.
 * Matches GPU GLSL vertex calculation.
 */
export function getWaterHeight(
  x: number,
  z: number,
  time: number,
  waveHeightMultiplier = 1.0,
  waveSpeedMultiplier = 1.0
): number {
  let height = 0;
  const gravity = 9.81;

  for (let i = 0; i < WAVE_COMPONENTS.length; i++) {
    const wave = WAVE_COMPONENTS[i];
    const k = (2.0 * Math.PI) / wave.wavelength;
    const c = Math.sqrt(gravity / k) * wave.speed * waveSpeedMultiplier;
    const a = (wave.steepness / k) * waveHeightMultiplier;
    const d = wave.direction;

    const phase = k * (d[0] * x + d[1] * z) - c * time * 0.45;
    height += a * Math.sin(phase);
  }

  return height;
}

/**
 * Computes surface normal at (x, z) for ship pitch & roll orientation.
 */
export function getWaterNormal(
  x: number,
  z: number,
  time: number,
  waveHeightMultiplier = 1.0,
  waveSpeedMultiplier = 1.0
): [number, number, number] {
  const delta = 1.0;
  const hL = getWaterHeight(x - delta, z, time, waveHeightMultiplier, waveSpeedMultiplier);
  const hR = getWaterHeight(x + delta, z, time, waveHeightMultiplier, waveSpeedMultiplier);
  const hD = getWaterHeight(x, z - delta, time, waveHeightMultiplier, waveSpeedMultiplier);
  const hU = getWaterHeight(x, z + delta, time, waveHeightMultiplier, waveSpeedMultiplier);

  const nx = (hL - hR) / (2.0 * delta);
  const nz = (hD - hU) / (2.0 * delta);
  const ny = 1.0;

  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  return [nx / len, ny / len, nz / len];
}

/**
 * GLSL snippet used inside custom Ocean Shader.
 */
export const GLSL_GERSTNER_SHADER_SNIPPET = `
struct Wave {
  vec2 direction;
  float steepness;
  float wavelength;
  float speed;
};

#define NUM_WAVES 4

const Wave waves[NUM_WAVES] = Wave[NUM_WAVES](
  Wave(vec2(0.707, 0.707), 0.35, 75.0, 1.1),
  Wave(vec2(-0.5, 0.866),  0.25, 42.0, 1.3),
  Wave(vec2(0.92, -0.38),  0.18, 22.0, 1.6),
  Wave(vec2(-0.38, -0.92), 0.12, 12.0, 2.0)
);

vec3 calculateGerstnerWave(vec3 position, float time, float heightMult, float speedMult, out vec3 normal) {
  vec3 displaced = position;
  vec3 n = vec3(0.0, 1.0, 0.0);
  float g = 9.81;

  for (int i = 0; i < NUM_WAVES; i++) {
    Wave w = waves[i];
    float k = 6.2831853 / w.wavelength;
    float c = sqrt(g / k) * w.speed * speedMult;
    float a = (w.steepness / k) * heightMult;
    vec2 d = normalize(w.direction);

    float phase = k * dot(d, position.xz) - c * time * 0.45;
    float cosP = cos(phase);
    float sinP = sin(phase);

    // Gerstner horizontal displacement
    float q = w.steepness / (k * a * float(NUM_WAVES));
    displaced.x += d.x * (a * cosP);
    displaced.z += d.y * (a * cosP);
    displaced.y += a * sinP;

    // Normal derivatives
    float wa = k * a;
    n.x -= d.x * wa * cosP;
    n.z -= d.y * wa * cosP;
    n.y -= q * wa * sinP;
  }

  normal = normalize(n);
  return displaced;
}
`;
