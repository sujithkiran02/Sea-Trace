import React, { useRef, useEffect } from 'react';
import type { DriftRun } from '../../types/seatrace';

interface DriftEnsembleSnapshotProps {
  driftRun: DriftRun | null;
  timeScrubber: number;
  isLightMode?: boolean;
}

export const DriftEnsembleSnapshot: React.FC<DriftEnsembleSnapshotProps> = ({
  driftRun,
  timeScrubber,
  isLightMode = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 340;
    const height = rect.height || 160;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // 1. Dark marine ocean background
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#04091A');
    bgGradient.addColorStop(0.5, '#07132B');
    bgGradient.addColorStop(1, '#020614');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle bathymetry depth grid lines
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 20; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 20; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. High-density probability heat cloud (matching Image Reference)
    const focalX = width * 0.76;
    const focalY = height * 0.62;

    const heatGrad = ctx.createRadialGradient(focalX, focalY, 2, focalX - 35, focalY - 15, width * 0.55);
    heatGrad.addColorStop(0, 'rgba(239, 68, 68, 0.95)');    // Red core
    heatGrad.addColorStop(0.12, 'rgba(249, 115, 22, 0.88)'); // Orange
    heatGrad.addColorStop(0.25, 'rgba(250, 204, 21, 0.75)'); // Yellow
    heatGrad.addColorStop(0.42, 'rgba(34, 197, 94, 0.55)');  // Green
    heatGrad.addColorStop(0.65, 'rgba(6, 182, 212, 0.35)');  // Cyan
    heatGrad.addColorStop(0.85, 'rgba(37, 99, 235, 0.18)');  // Blue
    heatGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');           // Fade

    ctx.fillStyle = heatGrad;
    ctx.beginPath();
    ctx.ellipse(focalX - 40, focalY - 10, width * 0.42, height * 0.48, -0.22, 0, 2 * Math.PI);
    ctx.fill();

    // 3. Dense ensemble particle streamline filaments fanning backward
    ctx.lineWidth = 1.2;
    const streamlineCount = 38;

    for (let i = 0; i < streamlineCount; i++) {
      const spreadRatio = (i / (streamlineCount - 1)) - 0.5; // -0.5 to 0.5
      const startX = focalX + (Math.sin(i * 1.5) * 6);
      const startY = focalY + (Math.cos(i * 1.3) * 6);

      // Arc curvature toward top-left (WSW seaway backtrack)
      const ctrl1X = focalX - width * 0.25 + (spreadRatio * 25);
      const ctrl1Y = focalY - height * 0.35 + (spreadRatio * 40);
      const ctrl2X = focalX - width * 0.48 + (spreadRatio * 55);
      const ctrl2Y = focalY - height * 0.30 + (spreadRatio * 65);
      const endX = width * 0.08 + (spreadRatio * 40);
      const endY = height * 0.28 + (spreadRatio * 85);

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.bezierCurveTo(ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, endX, endY);

      // Gradient color along stream: red/yellow near focus, cyan/white along plume
      const lineAlpha = 0.35 + Math.abs(spreadRatio) * 0.35;
      if (Math.abs(spreadRatio) < 0.15) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha * 0.9})`;
      } else if (spreadRatio < 0) {
        ctx.strokeStyle = `rgba(56, 189, 248, ${lineAlpha * 0.8})`;
      } else {
        ctx.strokeStyle = `rgba(125, 211, 252, ${lineAlpha * 0.75})`;
      }
      ctx.stroke();
    }

    // 4. Red dashed ellipse for Estimated Origin Zone (95% CI)
    ctx.save();
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.ellipse(focalX, focalY, 32, 22, -0.28, 0, 2 * Math.PI);
    ctx.stroke();

    // Inner center point
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(focalX, focalY, 3.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    // 5. Interactive Time Scrubber Indicator bead along trajectory
    if (typeof timeScrubber === 'number' && timeScrubber !== 0) {
      // Progress from 0 (at focal) to -24 (at end)
      const fraction = Math.min(1, Math.max(0, Math.abs(timeScrubber) / 24));
      const beadX = focalX - (focalX - width * 0.15) * fraction;
      const beadY = focalY - (focalY - height * 0.35) * Math.sin(fraction * Math.PI * 0.5);

      // Glowing yellow/gold bead
      ctx.save();
      ctx.fillStyle = '#F59E0B';
      ctx.shadowColor = '#FBBF24';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(beadX, beadY, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Outer ring
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(beadX, beadY, 7, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
    }
  }, [driftRun, timeScrubber]);

  return (
    <div className={`relative w-full rounded-xl overflow-hidden border shadow-inner ${
      isLightMode ? 'border-slate-300 bg-[#061224]' : 'border-slate-700/60 bg-[#04091A]'
    }`}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '145px', display: 'block' }}
      />
    </div>
  );
};
