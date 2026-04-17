"use client";
import { useEffect, useRef } from "react";

const DOT_SPACING = 28;
const DOT_RADIUS = 1.5;
const CURSOR_RADIUS = 120;

export default function DotGrid() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let cols, rows;

    const isDark = () => document.documentElement.classList.contains("dark");

    const resize = () => {
      canvas.width = document.documentElement.clientWidth;
      canvas.height = window.innerHeight;
      cols = Math.ceil(canvas.width / DOT_SPACING) + 1;
      rows = Math.ceil(canvas.height / DOT_SPACING) + 1;
    };

    const draw = () => {
      const { x: mx, y: my } = mouseRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dark = isDark();

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * DOT_SPACING;
          const y = row * DOT_SPACING;

          const dist = Math.hypot(x - mx, y - my);
          const cursorGlow =
            dist < CURSOR_RADIUS ? Math.pow(1 - dist / CURSOR_RADIUS, 2) : 0;

          const radius = DOT_RADIUS + cursorGlow * 2.5;

          let r, g, b, alpha;
          if (dark) {
            r = Math.round(160 + cursorGlow * 95);
            g = Math.round(185 + cursorGlow * 50);
            b = 255;
            alpha = 0.15 + cursorGlow * 0.75;
          } else {
            r = Math.round(100 - cursorGlow * 60);
            g = Math.round(116 - cursorGlow * 80);
            b = Math.round(139 + cursorGlow * 116);
            alpha = 0.12 + cursorGlow * 0.65;
          }

          if (cursorGlow > 0.1) {
            ctx.shadowColor = dark
              ? `rgba(120, 200, 255, ${cursorGlow * 0.9})`
              : `rgba(99, 102, 241, ${cursorGlow * 0.7})`;
            ctx.shadowBlur = 10 * cursorGlow;
          } else {
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
          }

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    const onMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
