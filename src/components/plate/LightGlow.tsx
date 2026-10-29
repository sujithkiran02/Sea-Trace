import { useEffect, useState } from 'react';
import { PLATE_CONFIG } from '../../constants/plateConfig';

interface LightSprite {
  id: string;
  xPct: number; // percentage of image width
  yPct: number; // percentage of image height
  radiusPx: number;
  color: string;
  phase: number;
  speed: number;
  blurPx: number;
}

const LIGHTS: LightSprite[] = [
  // Foremast light
  { id: 'mast-1', xPct: 39.5, yPct: 48.5, radiusPx: 14, color: '#FFE4A0', phase: 0.2, speed: 2.8, blurPx: 8 },
  // Bow rail lights
  { id: 'bow-1', xPct: 36.0, yPct: 59.8, radiusPx: 12, color: '#FFA542', phase: 1.1, speed: 3.2, blurPx: 6 },
  { id: 'bow-2', xPct: 41.5, yPct: 62.0, radiusPx: 12, color: '#FFA542', phase: 2.3, speed: 3.0, blurPx: 6 },
  // Starboard walkway rail lamps
  { id: 'rail-1', xPct: 47.0, yPct: 58.8, radiusPx: 10, color: '#FF9430', phase: 0.8, speed: 3.4, blurPx: 5 },
  { id: 'rail-2', xPct: 53.0, yPct: 55.0, radiusPx: 10, color: '#FF9430', phase: 1.9, speed: 2.9, blurPx: 5 },
  { id: 'rail-3', xPct: 60.5, yPct: 51.5, radiusPx: 11, color: '#FF9430', phase: 2.7, speed: 3.1, blurPx: 5 },
  { id: 'rail-4', xPct: 66.8, yPct: 47.5, radiusPx: 12, color: '#FF9430', phase: 0.4, speed: 3.6, blurPx: 6 },
  { id: 'rail-5', xPct: 72.5, yPct: 43.8, radiusPx: 13, color: '#FFA038', phase: 1.6, speed: 2.7, blurPx: 6 },
  // Bridge Accommodation Windows Cluster
  { id: 'bridge-core', xPct: 73.5, yPct: 24.5, radiusPx: 38, color: '#FFE6A0', phase: 0.5, speed: 1.8, blurPx: 18 },
  { id: 'bridge-wing-l', xPct: 67.5, yPct: 23.0, radiusPx: 14, color: '#FFB850', phase: 1.2, speed: 3.1, blurPx: 8 },
  { id: 'bridge-wing-r', xPct: 79.0, yPct: 22.0, radiusPx: 14, color: '#FFB850', phase: 2.4, speed: 3.3, blurPx: 8 },
  // Bridge Radar Mast Beacon
  { id: 'mast-top', xPct: 75.0, yPct: 16.5, radiusPx: 16, color: '#FFF2C5', phase: 0.9, speed: 4.2, blurPx: 9 },
];

interface LightGlowProps {
  shipTransform: {
    heavePx: number;
    angleRad: number;
  };
  isReducedMotion: boolean;
}

export const LightGlow: React.FC<LightGlowProps> = ({ shipTransform, isReducedMotion }) => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (isReducedMotion) return;

    let animId: number;
    let startTime = performance.now();

    const loop = (now: number) => {
      setTime((now - startTime) * 0.001);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isReducedMotion]);

  const deg = (shipTransform.angleRad * 180) / Math.PI;

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-hidden mix-blend-screen"
      style={{
        transform: isReducedMotion
          ? 'none'
          : `translateY(${shipTransform.heavePx}px) rotate(${deg}deg)`,
        transformOrigin: `${PLATE_CONFIG.ship.pivotNormalized.x * 100}% ${PLATE_CONFIG.ship.pivotNormalized.y * 100}%`,
        transition: 'transform 0.05s linear',
      }}
    >
      {LIGHTS.map((light) => {
        const breathing = isReducedMotion
          ? 0.95
          : PLATE_CONFIG.atmosphere.lightMinOpacity +
            (PLATE_CONFIG.atmosphere.lightMaxOpacity - PLATE_CONFIG.atmosphere.lightMinOpacity) *
              (Math.sin(time * light.speed + light.phase) * 0.5 + 0.5);

        return (
          <div
            key={light.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${light.xPct}%`,
              top: `${light.yPct}%`,
              width: `${light.radiusPx * 2}px`,
              height: `${light.radiusPx * 2}px`,
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, ${light.color} 0%, rgba(255, 140, 50, 0.4) 40%, transparent 75%)`,
              opacity: breathing,
              filter: `blur(${light.blurPx}px)`,
            }}
          />
        );
      })}
    </div>
  );
};
