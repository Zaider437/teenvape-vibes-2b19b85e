import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAnimationSettings } from "@/lib/admin.functions";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  angle?: number;
  spin?: number;
  color?: string;
  type: "snow" | "leaf";
}

export function FallingEffects() {
  const getAnim = useServerFn(getAnimationSettings);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeEffects, setActiveEffects] = useState<{ snow: boolean; leaves: boolean }>({
    snow: false,
    leaves: false,
  });

  useEffect(() => {
    let cancelled = false;
    const cached = localStorage.getItem("animationSettings");
    const cachedTime = localStorage.getItem("animationSettingsTime");
    const now = Date.now();
    const cacheValid = cached && cachedTime && now - Number(cachedTime) < 60 * 1000;

    if (cacheValid) {
      try {
        const settings = JSON.parse(cached);
        if (settings) {
          const currentMonth = new Date().getMonth() + 1;
          const isMonthInRange = (curr: number, from: number, to: number) => {
            if (from <= to) return curr >= from && curr <= to;
            return curr >= from || curr <= to;
          };
          const snowActive = settings.snow?.enabled && isMonthInRange(currentMonth, settings.snow.from, settings.snow.to);
          const leavesActive = settings.leaves?.enabled && isMonthInRange(currentMonth, settings.leaves.from, settings.leaves.to);
          setActiveEffects({ snow: snowActive, leaves: leavesActive });
          return;
        }
      } catch {
        // ignore parse errors
      }
    }

    getAnim()
      .then((settings) => {
        if (cancelled || !settings) return;
        try {
          localStorage.setItem("animationSettings", JSON.stringify(settings));
          localStorage.setItem("animationSettingsTime", String(Date.now()));
        } catch {
          // ignore storage errors
        }
        const currentMonth = new Date().getMonth() + 1;
        const isMonthInRange = (curr: number, from: number, to: number) => {
          if (from <= to) return curr >= from && curr <= to;
          return curr >= from || curr <= to;
        };
        const snowActive = settings.snow.enabled && isMonthInRange(currentMonth, settings.snow.from, settings.snow.to);
        const leavesActive = settings.leaves.enabled && isMonthInRange(currentMonth, settings.leaves.from, settings.leaves.to);
        setActiveEffects({ snow: snowActive, leaves: leavesActive });
      })
      .catch((err) => {
        console.error("Failed to load animation settings:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [getAnim]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || (!activeEffects.snow && !activeEffects.leaves)) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Initialize particles
    const maxParticles = 60;
    const leafColors = ["#e28743", "#eab676", "#abdbe3", "#ee6c4d", "#f9c74f", "#90be6d"];

    const createParticle = (initY = false): Particle => {
      const type = activeEffects.snow && activeEffects.leaves
        ? (Math.random() > 0.5 ? "snow" : "leaf")
        : (activeEffects.snow ? "snow" : "leaf");

      const x = Math.random() * window.innerWidth;
      const y = initY ? Math.random() * window.innerHeight : -10;
      const size = type === "snow" ? Math.random() * 3 + 1 : Math.random() * 8 + 6;
      const speedY = type === "snow" ? Math.random() * 1 + 0.5 : Math.random() * 1.2 + 0.8;
      const speedX = Math.random() * 1 - 0.5;

      if (type === "leaf") {
        return {
          x,
          y,
          size,
          speedY,
          speedX,
          angle: Math.random() * Math.PI * 2,
          spin: Math.random() * 0.02 - 0.01,
          color: leafColors[Math.floor(Math.random() * leafColors.length)],
          type,
        };
      }

      return {
        x,
        y,
        size,
        speedY,
        speedX,
        type,
      };
    };

    for (let i = 0; i < maxParticles; i++) {
      particles.push(createParticle(true));
    }

    const animate = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      particles.forEach((p, idx) => {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.y / 30) * 0.2; // slight sway

        if (p.type === "leaf" && p.angle !== undefined && p.spin !== undefined) {
          p.angle += p.spin;
        }

        // Draw particle
        if (p.type === "snow") {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
          ctx.fill();
        } else if (p.type === "leaf" && p.color && p.angle !== undefined) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.beginPath();
          // Draw a simple leaf shape
          ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
          ctx.restore();
        }

        // Reset particle if it goes off screen
        if (p.y > window.innerHeight + 10 || p.x < -10 || p.x > window.innerWidth + 10) {
          particles[idx] = createParticle(false);
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeEffects]);

  if (!activeEffects.snow && !activeEffects.leaves) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
