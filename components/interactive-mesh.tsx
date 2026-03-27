"use client";

import { useEffect, useRef } from "react";

export function InteractiveMesh() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let size = 11;
    let lowPower = false;
    let running = true;
    let lastPaint = 0;

    // Cache Path2D for hexagon to avoid recalculating vertices
    const hexPath = new Path2D();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = 11 * Math.cos(angle);
      const y = 11 * Math.sin(angle);
      if (i === 0) hexPath.moveTo(x, y);
      else hexPath.lineTo(x, y);
    }
    hexPath.closePath();

    const resize = () => {
      // Cap DPR at 1.25 for mesh background to save fill rate
      dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      width = window.innerWidth;
      height = window.innerHeight;
      lowPower = width < 768 || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      size = width < 640 ? 10 : 12;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    };

    const onMove = (e: MouseEvent) => {
      mouseRef.current.tx = e.clientX;
      mouseRef.current.ty = e.clientY;
    };

    const draw = () => {
      ctx.save();
      ctx.scale(dpr, dpr);

      // Smooth mouse easing
      mouseRef.current.x += (mouseRef.current.tx - mouseRef.current.x) * 0.15;
      mouseRef.current.y += (mouseRef.current.ty - mouseRef.current.y) * 0.15;

      const mx = mouseRef.current.x || width * 0.5;
      const my = mouseRef.current.y || height * 0.5;

      ctx.clearRect(0, 0, width, height);

      const dxShift = (mx - width * 0.5) * 0.001;
      const dyShift = (my - height * 0.5) * 0.001;

      const xStep = Math.sqrt(3) * size;
      const yStep = 1.5 * size;
      const cols = Math.ceil(width / xStep) + 2;
      const rows = Math.ceil(height / yStep) + 2;

      const glowRadius = 50;

      // OPTIMIZATION: Use a single stroke/fill call per style group
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = "rgba(148, 163, 184, 0.06)";

      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const cx = col * xStep + (row % 2 ? xStep / 2 : 0) + dxShift;
          const cy = row * yStep + dyShift;

          const distSq = (cx - mx) ** 2 + (cy - my) ** 2;

          if (distSq < 10000) { // Catch the 60px radius (~100px buffer)
            const dist = Math.sqrt(distSq);
            const active = Math.max(0, 1 - dist / glowRadius);

            ctx.save();
            ctx.translate(cx, cy);

            // Highlight (Lighter Blue)
            if (active > 0.1) {
              ctx.fillStyle = `rgba(59, 130, 246, ${(active * 0.04).toFixed(3)})`;
              ctx.fill(hexPath);

              // Vibrant Electric Blue Stroke
              ctx.strokeStyle = `rgba(59, 130, 246, ${(active * 0.6).toFixed(3)})`;
              ctx.lineWidth = 1.2;
            } else {
              ctx.strokeStyle = "rgba(148, 163, 184, 0.06)";
            }

            ctx.stroke(hexPath);
            ctx.restore();
          } else {
            // Static distant hex
            ctx.save();
            ctx.translate(cx, cy);
            ctx.stroke(hexPath);
            ctx.restore();
          }
        }
      }

      ctx.restore();
    };

    const render = (time: number) => {
      // Limit to ~30fps to leave CPU for UI thread
      if (time - lastPaint >= 32) {
        lastPaint = time;
        draw();
      }

      if (!lowPower && running) {
        rafRef.current = requestAnimationFrame(render);
      }
    };

    const onVisibility = () => {
      running = !document.hidden;
      if (running && !lowPower && !rafRef.current) {
        rafRef.current = requestAnimationFrame(render);
      }
    };

    window.addEventListener("resize", resize);
    window.addEventListener("visibilitychange", onVisibility);
    resize();

    mouseRef.current.tx = width * 0.5;
    mouseRef.current.ty = height * 0.5;

    if (lowPower) {
      draw();
    } else {
      window.addEventListener("mousemove", onMove);
      rafRef.current = requestAnimationFrame(render);
    }

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("visibilitychange", onVisibility);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ willChange: "transform" }}>
      <canvas ref={canvasRef} className="h-full w-full opacity-60" />
    </div>
  );
}

