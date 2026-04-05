"use client";

import { useEffect, useRef } from "react";

export function InteractiveMesh() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -9999, y: -9999, tx: -9999, ty: -9999 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let running = true;
    let lowPower = false;
    let startTime = performance.now();

    // Hex tile dimensions (matched to landing page SVG proportions)
    const hexW = 50;
    const hexH = 50;
    const xStep = hexW;
    const yStep = hexH * 0.75;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      lowPower = width < 768;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    };

    const onMove = (e: MouseEvent) => {
      mouseRef.current.tx = e.clientX;
      mouseRef.current.ty = e.clientY;
    };

    const drawHex = (cx: number, cy: number) => {
      ctx.beginPath();
      ctx.moveTo(cx,       cy - 25);
      ctx.lineTo(cx + 25,  cy - 12.5);
      ctx.lineTo(cx + 25,  cy + 12.5);
      ctx.lineTo(cx,       cy + 25);
      ctx.lineTo(cx - 25,  cy + 12.5);
      ctx.lineTo(cx - 25,  cy - 12.5);
      ctx.closePath();
    };

    const draw = (now: number) => {
      // Direct, instant mouse follow as requested (no delay)
      mouseRef.current.x = mouseRef.current.tx;
      mouseRef.current.y = mouseRef.current.ty;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const cols = Math.ceil(width / xStep) + 2;
      const rows = Math.ceil(height / yStep) + 2;

      // Dual-radius constants (tuned for instant response)
      const innerR = 80;   
      const outerR = 180;  

      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const cx = col * xStep + (row % 2 ? xStep / 2 : 0);
          const cy = row * yStep;

          const dist = Math.sqrt((cx - mx) ** 2 + (cy - my) ** 2);

          // Fixed subtle ambient base opacity (no breathing pulse for "mouse only" focus)
          const ambientOpacity = 0.012; 

          // Inner core: sharp, bold black
          const innerActive = Math.pow(Math.max(0, 1 - dist / innerR), 2.5);

          // Outer halo: wide, feather-soft
          const outerActive = Math.pow(Math.max(0, 1 - dist / outerR), 3);

          const strokeOpacity = ambientOpacity + outerActive * 0.18 + innerActive * 0.75;
          const fillOpacity   = outerActive * 0.018 + innerActive * 0.025;

          // 1. Draw Outer Hexagon
          drawHex(cx, cy);

          if (fillOpacity > 0.002) {
            ctx.fillStyle = `rgba(15, 23, 42, ${fillOpacity.toFixed(4)})`;
            ctx.fill();
          }

          const baseDarkness = Math.min(strokeOpacity, 0.92);
          ctx.strokeStyle = `rgba(15, 23, 42, ${baseDarkness.toFixed(4)})`;
          ctx.lineWidth = 0.5 + innerActive * 0.7 + outerActive * 0.2;
          ctx.stroke();

          // 2. Draw Internal "Cube" Lines (Ultra-Subtle shapes)
          ctx.beginPath();
          ctx.moveTo(cx, cy); // Center
          ctx.lineTo(cx, cy + 25); // Bottom
          
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx - 25, cy - 12.5); // Top Left
          
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + 25, cy - 12.5); // Top Right
          
          // Internal lines are much lighter (approx 30% of base darkness)
          ctx.strokeStyle = `rgba(15, 23, 42, ${(baseDarkness * 0.35).toFixed(4)})`;
          ctx.lineWidth = 0.4 + innerActive * 0.3;
          ctx.stroke();
        }
      }

      ctx.restore();
    };

    const render = (now: number) => {
      draw(now);
      if (!lowPower && running) {
        rafRef.current = requestAnimationFrame(render);
      }
    };

    const onVisibility = () => {
      running = !document.hidden;
      if (running && !lowPower && !rafRef.current) {
        startTime = performance.now(); // re-sync breathing after tab switch
        rafRef.current = requestAnimationFrame(render);
      }
    };

    window.addEventListener("resize", resize);
    window.addEventListener("visibilitychange", onVisibility);
    resize();
    startTime = performance.now();

    if (lowPower) {
      // Static draw — no animation on mobile
      const fakeNow = performance.now();
      draw(fakeNow);
    } else {
      window.addEventListener("mousemove", onMove);
      rafRef.current = requestAnimationFrame(render);
    }

    return () => {
      running = false;
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("visibilitychange", onVisibility);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#f7faff]">
      <canvas ref={canvasRef} className="h-full w-full" />
      {/* Very gentle vignette so edges don't feel sharp */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(240,245,255,0.55)_100%)] pointer-events-none" />
    </div>
  );
}
