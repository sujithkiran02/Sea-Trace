/**
 * TWEAKABLE CONSTANTS & CONFIGURATION
 * Tune all motion, shader amplitudes, sway cycles, and glassmorphism styling here.
 */

export const PLATE_CONFIG = {
  // Image assets
  imageSrc: '/ocean-ship.jpg',
  imageMobileSrc: '/ocean-ship-mobile.jpg',
  waterMaskSrc: '/water-mask.png',


  // Motion: Ocean Water WebGL Shader
  water: {
    waveAmplitude: 3.2, // UV displacement in pixels (2-4px recommended)
    waveSpeed: 0.85,    // Propagation speed
    waveFrequency: 24.0, // Spatial frequency of water ripples
    foamPulseSpeed: 1.4, // Speed of white foam brightness breathing
    foamBrightnessMult: 1.35, // Boost factor for whitecaps & wake
    sparkleCount: 35,   // Twinkling highlights in lower-right orange reflection
    sparkleSpeed: 2.2,  // Twinkle frequency
    // Fallback procedural horizon & ship hull mask parameters
    horizonHeightRatio: 0.165, // Horizon line at top ~16.5% height
    hullPolygonFeather: 0.02,  // Softness of the hull boundary mask
  },

  // Motion: Ship Sailing Dynamics
  ship: {
    swayAngleDeg: 0.35,     // Gentle pitch/roll (+/-0.35 deg)
    heavePixels: 3.0,       // Vertical heave translation (+/-3px)
    cycleDurationSec: 6.0,  // Natural period of ocean swell (6s sine cycle)
    pivotNormalized: { x: 0.58, y: 0.52 }, // Center of vessel buoyancy
  },

  // Motion: Atmosphere, Lights & Breeze
  atmosphere: {
    mistDriftSpeed: 0.015,  // Slow horizontal haze drift
    cloudDriftSpeed: 0.008, // Slow top cloud pan
    lightFlickerSpeed: 3.5, // Warm deck lights breathing frequency
    lightMinOpacity: 0.88,  // Minimum light breathing brightness
    lightMaxOpacity: 1.0,   // Maximum light breathing brightness
    sprayParticleCount: 18, // Bow wave spray particles
  },

  // Camera & Background Ken Burns Drift
  camera: {
    kenBurnsScaleMin: 1.03, // Initial scale
    kenBurnsScaleMax: 1.075,// Target scale
    kenBurnsDurationSec: 30,// Slow 30s alternate loop
    parallaxMaxPx: 10.0,    // Maximum mouse parallax translation in pixels
    parallaxSmoothness: 0.08, // Parallax lerp damping
  },

  // Colors & Glassmorphism Design Tokens
  theme: {
    accentOrange: '#FF8A3D',     // Warm orange matching deck lights
    accentCyan: '#6FD3FF',       // Crisp cyan matching sea foam
    darkNavy: '#050A1E',         // Deep midnight base
    glassBackground: 'rgba(255, 255, 255, 0.08)',
    glassBorder: 'rgba(255, 255, 255, 0.18)',
    glassBlur: '18px',
  },
};
