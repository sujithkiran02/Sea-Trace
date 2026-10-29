/**
 * OCEAN FREIGHT - Cinematic 3D Scene Configuration & Tweakable Constants
 * All physical dimensions, lighting parameters, and wave mechanics exposed here.
 */

export interface SceneConfigType {
  // Wave & Ocean Dynamics
  ocean: {
    size: number;
    subdivisions: number;
    waveHeight: number;
    waveSpeed: number;
    waveFrequency: number;
    waterColor: string; // deep ocean trough
    waterHighlight: string; // crest / shallow
    sunGlitterColor: string;
    foamColor: string;
    foamThreshold: number;
    roughness: number;
    metalness: number;
  };
  // Ship Mechanics & Dimensions
  ship: {
    length: number;
    beam: number; // width
    hullHeight: number;
    draft: number; // submerged depth
    speed: number;
    pitchMultiplier: number;
    rollMultiplier: number;
    heaveMultiplier: number;
    upperHullColor: string;
    lowerHullColor: string;
    waterlineStripeColor: string;
    deckColor: string;
    superstructureColor: string;
    funnelColor: string;
  };
  // Containers Layout & Colors
  containers: {
    bays: number; // rows along the ship length
    rowsAcross: number; // across the beam
    maxTiers: number; // vertical height stack
    containerLength: number;
    containerWidth: number;
    containerHeight: number;
    palette: string[];
  };
  // Celestial & Atmospheric Lighting
  lighting: {
    sunAltitude: number; // angle in degrees above horizon
    sunAzimuth: number; // angle around ship
    sunColor: string;
    sunIntensity: number;
    skyZenithColor: string;
    skyHorizonColor: string;
    skyDuskColor: string;
    ambientColor: string;
    ambientIntensity: number;
    fogDensity: number;
    exposure: number;
    bloomStrength: number;
    bloomRadius: number;
    bloomThreshold: number;
  };
  // Effects
  effects: {
    wakeFoamIntensity: number;
    smokeDriftSpeed: number;
    seagullsCount: number;
    enableParticles: boolean;
  };
}

export const SCENE_CONFIG: SceneConfigType = {
  ocean: {
    size: 2400,
    subdivisions: 180,
    waveHeight: 1.15,
    waveSpeed: 0.9,
    waveFrequency: 0.045,
    waterColor: '#071827', // Deep abyssal navy
    waterHighlight: '#165766', // Turquoise crest
    sunGlitterColor: '#FFAE53', // Golden sheen
    foamColor: '#E2F1F8',
    foamThreshold: 0.65,
    roughness: 0.12,
    metalness: 0.88,
  },
  ship: {
    length: 120, // Procedural scale units (~400m real vessel)
    beam: 19,
    hullHeight: 13,
    draft: 3.8,
    speed: 3.2,
    pitchMultiplier: 0.035,
    rollMultiplier: 0.045,
    heaveMultiplier: 0.65,
    upperHullColor: '#121720', // Dark charcoal navy
    lowerHullColor: '#8C1E1B', // Anti-fouling red oxide
    waterlineStripeColor: '#F0EFEA', // Crisp white separation line
    deckColor: '#1e2430',
    superstructureColor: '#ECEFF4', // Marine white
    funnelColor: '#FF6B2B', // Vibrant safety orange brand funnel
  },
  containers: {
    bays: 14,
    rowsAcross: 6,
    maxTiers: 6,
    containerLength: 6.0,
    containerWidth: 2.4,
    containerHeight: 2.6,
    palette: [
      '#C82A2A', // Maersk Red
      '#1B4F72', // Deep Ocean Blue
      '#FF7A2F', // Sunset Orange
      '#1B7B68', // Evergreen Teal
      '#E09F3E', // Mustard Gold
      '#34495E', // Slate Industrial
      '#273746', // Midnight Navy
      '#D5D8DC', // Cool White/Grey
      '#B03A2E', // Terracotta
      '#16A085', // Mint Jade
    ],
  },
  lighting: {
    sunAltitude: 4.8, // Low setting sun at golden hour horizon
    sunAzimuth: 145, // Dramatic rim backlighting / side rake
    sunColor: '#FF8833',
    sunIntensity: 3.8,
    skyZenithColor: '#070D1F', // Deep twilight indigo
    skyHorizonColor: '#FFA742', // Glowing orange gold
    skyDuskColor: '#8E2856', // Magenta purple transition
    ambientColor: '#1A2942',
    ambientIntensity: 0.9,
    fogDensity: 0.0016,
    exposure: 1.1,
    bloomStrength: 0.85,
    bloomRadius: 0.55,
    bloomThreshold: 0.82,
  },
  effects: {
    wakeFoamIntensity: 1.2,
    smokeDriftSpeed: 1.4,
    seagullsCount: 12,
    enableParticles: true,
  },
};
