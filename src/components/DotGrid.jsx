"use client";
import { useEffect, useRef } from "react";

const DOT_SPACING = 24;
const DOT_RADIUS = 1;
const GLOW_RADIUS = 100; // px around cursor that glows
const GLOW_COLOR_DARK = "255, 255, 255";
const GLOW_COLOR_LIGHT = "15, 23, 42";

export default function DotGrid() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let cols, rows;

    const isDark = () =>
      document.documentElement.classList.contains("dark");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = document.documentElement.scrollHeight;
      cols = Math.ceil(canvas.width / DOT_SPACING) + 1;
      rows = Math.ceil(canvas.height / DOT_SPACING) + 1;
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x: mx, y: my } = mouseRef.current;
      const dark = isDark();
      const baseColor = dark ? GLOW_COLOR_DARK : GLOW_COLOR_LIGHT;
      const baseAlpha = dark ? 0.18 : 0.12;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * DOT_SPACING;
          const y = r * DOT_SPACING;
          const dist = Math.hypot(x - mx, y - my);
          const glow = Math.max(0, 1 - dist / GLOW_RADIUS);

          // alpha: base + glow boost
          const alpha = baseAlpha + glow * (dark ? 0.75 : 0.6);
          // radius: slightly bigger when glowing
          const radius = DOT_RADIUS + glow * 1.5;

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);

          if (glow > 0.01) {
            // add a soft outer glow via shadow
            ctx.shadowColor = `rgba(${baseColor}, ${glow * (dark ? 0.9 : 0.5)})`;
            ctx.shadowBlur = 6 * glow;
          } else {
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
          }

          ctx.fillStyle = `rgba(${baseColor}, ${alpha})`;
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    const onMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY + window.scrollY };
    };

    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);

    // observe theme changes
    const observer = new MutationObserver(() => {});
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      observer.disconnect();
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
