
import { useEffect, useState } from 'react';
import { PLATE_CONFIG } from '../../constants/plateConfig';

interface SprayParticle {
  id: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
}

export const Mist: React.FC<{ isReducedMotion: boolean }> = ({ isReducedMotion }) => {
  const [particles, setParticles] = useState<SprayParticle[]>([]);
  const [cloudOffset, setCloudOffset] = useState(0);
  const [mistOffset, setMistOffset] = useState(0);

  useEffect(() => {
    // Initialize bow spray particles near prow
    const initialParticles: SprayParticle[] = Array.from({ length: PLATE_CONFIG.atmosphere.sprayParticleCount }, (_, i) => ({
      id: i,
      baseX: 34 + Math.random() * 5, // percentage near bow wave
      baseY: 78 + Math.random() * 8,
      vx: -(0.8 + Math.random() * 1.4), // drifting left with wind
      vy: -(0.5 + Math.random() * 0.9), // drifting upward
      life: Math.random(),
      size: 14 + Math.random() * 24,
    }));
    setParticles(initialParticles);

    if (isReducedMotion) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTime) * 0.001;
      lastTime = now;

      setCloudOffset((prev) => (prev + dt * 0.6) % 100);
      setMistOffset((prev) => (prev + dt * 1.2) % 100);

      setParticles((prev) =>
        prev.map((p) => {
          let newLife = p.life + dt * 0.45;
          if (newLife >= 1.0) {
            return {
              ...p,
              baseX: 34 + Math.random() * 5,
              baseY: 78 + Math.random() * 8,
              life: 0,
            };
          }
          return {
            ...p,
            life: newLife,
          };
        })
      );

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isReducedMotion]);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-hidden">
      {/* 1. Slow Drifting Top Cloud Bands (drifting left to right) */}
      <div
        className="absolute top-0 left-[-50%] w-[200%] h-[18%] opacity-20 pointer-events-none"
        style={{
          transform: `translateX(${cloudOffset * 0.5}%)`,
          background: 'linear-gradient(90deg, transparent 0%, rgba(140, 170, 210, 0.25) 25%, rgba(90, 120, 180, 0.15) 50%, rgba(140, 170, 210, 0.25) 75%, transparent 100%)',
          filter: 'blur(30px)',
        }}
      />

      {/* 2. Low Surface Sea Mist / Haze */}
      <div
        className="absolute bottom-0 left-[-40%] w-[180%] h-[55%] opacity-[0.06] pointer-events-none"
        style={{
          transform: `translateX(${mistOffset * 0.3}%)`,
          background: 'radial-gradient(ellipse at 50% 100%, rgba(180, 220, 255, 0.4) 0%, transparent 70%)',
          filter: 'blur(45px)',
        }}
      />

      {/* 3. Bow Wave Spray Particles */}
      {!isReducedMotion &&
        particles.map((p) => {
          const x = p.baseX + p.vx * p.life * 6;
          const y = p.baseY + p.vy * p.life * 5;
          const alpha = Math.sin(p.life * Math.PI) * 0.35;

          return (
            <div
              key={p.id}
              className="absolute rounded-full pointer-events-none bg-white/40"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                transform: 'translate(-50%, -50%)',
                opacity: alpha,
                filter: 'blur(8px)',
              }}
            />
          );
        })}
    </div>
  );
};
