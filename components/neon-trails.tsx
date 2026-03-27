"use client";

import { useEffect, useRef } from "react";

type Point = {
  x: number;
  y: number;
  age: number;
};

export function NeonTrails() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointsRef = useRef<Point[]>([]);
  const mouseRef = useRef({ x: -100, y: -100, tx: -100, ty: -100 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    };

    const onMove = (e: MouseEvent) => {
      mouseRef.current.tx = e.clientX;
      mouseRef.current.ty = e.clientY;
    };

    const draw = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      // Smooth mouse movement (Lerp) for a "fluid" feel
      const mouse = mouseRef.current;
      mouse.x += (mouse.tx - mouse.x) * 0.25;
      mouse.y += (mouse.ty - mouse.y) * 0.25;

      // Add point if mouse is moving
      if (Math.abs(mouse.x - (pointsRef.current[pointsRef.current.length - 1]?.x || 0)) > 1 ||
          Math.abs(mouse.y - (pointsRef.current[pointsRef.current.length - 1]?.y || 0)) > 1) {
        pointsRef.current.push({ x: mouse.x, y: mouse.y, age: 0 });
      }

      const points = pointsRef.current;
      if (points.length < 3) {
        ctx.restore();
        return;
      }

      // Draw Phase 1: The Ambient Neon Glow
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      for (let i = 1; i < points.length; i++) {
        const p1 = points[i - 1];
        const p2 = points[i];
        const ageNorm = 1 - (p2.age / 50); // Lifespan of 50
        if (ageNorm <= 0) continue;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        
        const opacity = ageNorm * 0.6;
        ctx.lineWidth = 1 + (4.5 * ageNorm);
        ctx.strokeStyle = `rgba(56, 189, 248, ${opacity})`;
        ctx.shadowBlur = 15 * ageNorm;
        ctx.shadowColor = `rgba(56, 189, 248, ${opacity})`;
        ctx.stroke();
      }

      // Draw Phase 2: The "Hot" Electric Core (White-Blue)
      ctx.shadowBlur = 0; // Disable shadow for the sharp core
      for (let i = 1; i < points.length; i++) {
        const p1 = points[i - 1];
        const p2 = points[i];
        const ageNorm = 1 - (p2.age / 50);
        if (ageNorm <= 0) continue;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        
        ctx.lineWidth = 0.5 + (1.5 * ageNorm);
        ctx.strokeStyle = `rgba(255, 255, 255, ${ageNorm * 0.9})`;
        ctx.stroke();
      }

      // Maintenance: aging points
      for (let i = points.length - 1; i >= 0; i--) {
        points[i].age += 1;
        if (points[i].age > 50) {
          points.splice(i, 1);
        }
      }

      ctx.restore();
    };

    let rafId: number;
    const render = () => {
      draw();
      rafId = requestAnimationFrame(render);
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    resize();
    render();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[100000] opacity-80">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
