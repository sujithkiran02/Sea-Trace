import { useState, useEffect, useRef } from 'react';
import { WaterShader } from './WaterShader';
import { LightGlow } from './LightGlow';
import { Mist } from './Mist';
import { PLATE_CONFIG } from '../../constants/plateConfig';

interface BackgroundPlateProps {
  isReducedMotion: boolean;
  theme?: 'dark' | 'light';
}

export const BackgroundPlate: React.FC<BackgroundPlateProps> = ({ isReducedMotion, theme = 'dark' }) => {
  // Mouse Parallax (max +/-10px)
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const mouseTargetRef = useRef({ x: 0, y: 0 });
  const mouseCurrentRef = useRef({ x: 0, y: 0 });

  // Ship Sailing Buoyancy (6s cycle)
  const [shipTransform, setShipTransform] = useState({
    heavePx: 0,
    angleRad: 0,
  });

  const webGLFailed = false;


  // Mouse move listener for subtle parallax
  useEffect(() => {
    if (isReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = (e.clientY / window.innerHeight) * 2 - 1;
      mouseTargetRef.current = {
        x: normX * PLATE_CONFIG.camera.parallaxMaxPx,
        y: normY * PLATE_CONFIG.camera.parallaxMaxPx,
      };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isReducedMotion]);

  // Main Buoyancy and Parallax Physics Loop
  useEffect(() => {
    if (isReducedMotion) return;

    let animId: number;
    let startTime = performance.now();

    const loop = (now: number) => {
      const elapsed = (now - startTime) * 0.001;

      // Smooth mouse parallax damping
      const smooth = PLATE_CONFIG.camera.parallaxSmoothness;
      mouseCurrentRef.current.x += (mouseTargetRef.current.x - mouseCurrentRef.current.x) * smooth;
      mouseCurrentRef.current.y += (mouseTargetRef.current.y - mouseCurrentRef.current.y) * smooth;
      setParallax({ x: mouseCurrentRef.current.x, y: mouseCurrentRef.current.y });

      // Calculate gentle ship pitch & heave on 6s cycle
      const cycle = (2 * Math.PI) / PLATE_CONFIG.ship.cycleDurationSec;
      const heave = Math.sin(elapsed * cycle) * PLATE_CONFIG.ship.heavePixels;
      const angleDeg = Math.cos(elapsed * cycle) * PLATE_CONFIG.ship.swayAngleDeg;
      const angleRad = (angleDeg * Math.PI) / 180;

      setShipTransform({
        heavePx: heave,
        angleRad: angleRad,
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isReducedMotion]);

  const isLight = theme === 'light';

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-[#050A1E] z-0 pointer-events-none">
      {/* Ken Burns Scale Wrapper + Mouse Parallax */}
      <div
        className="absolute inset-[-4%] w-[108%] h-[108%] transition-transform ease-out"
        style={{
          transform: isReducedMotion
            ? 'none'
            : `translate3d(${parallax.x}px, ${parallax.y}px, 0)`,
          animation: isReducedMotion
            ? 'none'
            : `kenBurnsDrift ${PLATE_CONFIG.camera.kenBurnsDurationSec}s ease-in-out infinite alternate`,
        }}
      >
        {/* Layer 1: WebGL Water Displacement & Ship Shader */}
        {!webGLFailed ? (
          <WaterShader
            shipTransform={shipTransform}
            isReducedMotion={isReducedMotion}
            theme={theme}
          />
        ) : (
          /* Fallback static image */
          <img
            src={PLATE_CONFIG.imageSrc}
            alt="Ocean Freight Vessel"
            className="w-full h-full object-cover object-[65%_center] sm:object-center"
          />
        )}

        {/* Layer 2: Warm Deck Lights & Bridge Windows Additive Glow */}
        <div style={{ opacity: isLight ? 0.75 : 1.0, transition: 'opacity 0.6s ease' }}>
          <LightGlow
            shipTransform={shipTransform}
            isReducedMotion={isReducedMotion}
          />
        </div>

        {/* Layer 3: Atmospheric Mist, Top Clouds & Bow Wave Spray */}
        <Mist isReducedMotion={isReducedMotion} />
      </div>

      {/* Layer 4: Top Gradient Overlay (for UI contrast while keeping ship brightly visible) */}
      <div
        className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-700 bg-gradient-to-b from-[#050A1E]/40 via-transparent to-[#050A1E]/50"
      />

      {/* Layer 5: Vignette & Soft Rim Darkening */}
      <div
        className="absolute inset-0 pointer-events-none z-10 transition-all duration-700"
        style={{
          background: 'radial-gradient(circle at 65% 50%, transparent 45%, rgba(5, 10, 30, 0.45) 90%, rgba(5, 10, 30, 0.8) 100%)',
        }}
      />
    </div>
  );
};
