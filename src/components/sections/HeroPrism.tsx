import { useEffect, useRef } from "react";

export function HeroPrism({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let isVisible = true;
    let time = 0;

    // Smoothed spring mouse state
    const targetMouse = { x: -1000, y: -1000, active: false };
    const currentMouse = { x: -1000, y: -1000 };

    const isDark = () => document.documentElement.classList.contains("dark");

    const handleResize = () => {
      const parent = containerRef.current;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Battery saver observer
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 },
    );
    observer.observe(canvas);

    // Track mouse across the hero area smoothly
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (
        e.clientY >= rect.top - 100 &&
        e.clientY <= rect.bottom + 100 &&
        e.clientX >= rect.left &&
        e.clientX <= rect.right
      ) {
        targetMouse.x = e.clientX - rect.left;
        targetMouse.y = e.clientY - rect.top;
        targetMouse.active = true;
      } else {
        targetMouse.active = false;
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Harmonic constellation nodes (delicate, high-craft, positioned in natural negative space)
    // Avoids directly blocking the right-column buttons while forming the bigger picture
    const constellationNodes = [
      // Primary Breakthrough Spine (Warm Clay)
      { nx: 0.5, ny: 0.38, isClay: true, radius: 2.5, phase: 0.0 },
      { nx: 0.58, ny: 0.32, isClay: true, radius: 2.8, phase: 0.3 },
      { nx: 0.68, ny: 0.25, isClay: true, radius: 3.2, phase: 0.6 },
      { nx: 0.79, ny: 0.19, isClay: true, radius: 3.5, phase: 0.9 },
      { nx: 0.9, ny: 0.16, isClay: true, radius: 3.0, phase: 1.2 },

      // Upper Celestial Canopy (Expanding into top-right negative space)
      { nx: 0.54, ny: 0.22, isClay: false, radius: 1.8, phase: 0.2 },
      { nx: 0.63, ny: 0.15, isClay: false, radius: 2.0, phase: 0.5 },
      { nx: 0.74, ny: 0.11, isClay: false, radius: 2.2, phase: 0.8 },
      { nx: 0.85, ny: 0.09, isClay: false, radius: 2.0, phase: 1.1 },
      { nx: 0.94, ny: 0.11, isClay: false, radius: 1.6, phase: 1.4 },

      // Middle Resonance Arch
      { nx: 0.56, ny: 0.46, isClay: false, radius: 1.9, phase: 0.4 },
      { nx: 0.66, ny: 0.42, isClay: false, radius: 2.2, phase: 0.7 },
      { nx: 0.76, ny: 0.38, isClay: false, radius: 2.4, phase: 1.0 },
      { nx: 0.86, ny: 0.35, isClay: false, radius: 2.0, phase: 1.3 },
      { nx: 0.95, ny: 0.32, isClay: false, radius: 1.8, phase: 1.6 },

      // Lower Ambient Latticework (Kept subtle and low-opacity)
      { nx: 0.52, ny: 0.58, isClay: false, radius: 1.6, phase: 0.3 },
      { nx: 0.62, ny: 0.62, isClay: false, radius: 1.8, phase: 0.6 },
      { nx: 0.73, ny: 0.65, isClay: false, radius: 2.0, phase: 0.9 },
      { nx: 0.84, ny: 0.68, isClay: false, radius: 1.7, phase: 1.2 },

      // Cross-linking geometry anchors
      { nx: 0.6, ny: 0.26, isClay: false, radius: 1.5, phase: 0.4 },
      { nx: 0.71, ny: 0.33, isClay: false, radius: 1.7, phase: 0.8 },
      { nx: 0.82, ny: 0.27, isClay: false, radius: 1.8, phase: 1.1 },
    ];

    // Constellation Edges (Fine filaments connecting the dots)
    const constellationEdges = [
      // Primary Clay Spine
      { from: 0, to: 1, isClay: true },
      { from: 1, to: 2, isClay: true },
      { from: 2, to: 3, isClay: true },
      { from: 3, to: 4, isClay: true },

      // Upper Canopy
      { from: 0, to: 5 },
      { from: 5, to: 6 },
      { from: 6, to: 7 },
      { from: 7, to: 8 },
      { from: 8, to: 9 },

      // Middle Arch
      { from: 0, to: 10 },
      { from: 10, to: 11 },
      { from: 11, to: 12 },
      { from: 12, to: 13 },
      { from: 13, to: 14 },

      // Lower Arch
      { from: 10, to: 15 },
      { from: 15, to: 16 },
      { from: 16, to: 17 },
      { from: 17, to: 18 },

      // Polyhedral cross-ties
      { from: 1, to: 5 },
      { from: 2, to: 6 },
      { from: 2, to: 19 },
      { from: 19, to: 7 },
      { from: 3, to: 8 },
      { from: 1, to: 10 },
      { from: 2, to: 11 },
      { from: 11, to: 20 },
      { from: 20, to: 12 },
      { from: 3, to: 21 },
      { from: 21, to: 13 },
      { from: 12, to: 17 },
      { from: 13, to: 18 },
      { from: 4, to: 14 },
    ];

    // Delicate floating ambient dust motes
    const ambientMotes = Array.from({ length: 22 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0002,
      vy: (Math.random() - 0.5) * 0.0002,
      size: 0.7 + Math.random() * 1.2,
      alpha: 0.15 + Math.random() * 0.35,
    }));

    // Micro-photons gliding across constellation edges
    const travelingPhotons = [
      { edgeIdx: 0, progress: 0.1, speed: 0.006 },
      { edgeIdx: 2, progress: 0.6, speed: 0.005 },
      { edgeIdx: 3, progress: 0.3, speed: 0.007 },
      { edgeIdx: 6, progress: 0.8, speed: 0.004 },
      { edgeIdx: 11, progress: 0.4, speed: 0.005 },
      { edgeIdx: 17, progress: 0.2, speed: 0.006 },
    ];

    // Main animation loop
    const render = () => {
      if (!isVisible) {
        animationId = requestAnimationFrame(render);
        return;
      }

      time += 0.016;
      const dark = isDark();

      const width = canvas.width;
      const height = canvas.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      // Smooth mouse lerping
      if (targetMouse.active) {
        currentMouse.x += (targetMouse.x * dpr - currentMouse.x) * 0.05;
        currentMouse.y += (targetMouse.y * dpr - currentMouse.y) * 0.05;
      } else {
        // Idle gentle breathing wave
        const idleX = width * 0.12;
        const idleY = height * 0.28 + Math.sin(time * 0.6) * (height * 0.06);
        currentMouse.x += (idleX - currentMouse.x) * 0.025;
        currentMouse.y += (idleY - currentMouse.y) * 0.025;
      }

      ctx.clearRect(0, 0, width, height);

      // Color Palette Definition
      const beamColor = dark ? "rgba(248, 246, 240, 0.85)" : "rgba(22, 16, 12, 0.75)";
      const beamGlow = dark ? "rgba(248, 246, 240, 0.3)" : "rgba(22, 16, 12, 0.12)";
      const glassBorder = dark ? "rgba(248, 246, 240, 0.35)" : "rgba(22, 16, 12, 0.3)";
      const filamentColor = dark ? "rgba(248, 246, 240, 0.14)" : "rgba(22, 16, 12, 0.12)";
      const clayColor = dark ? "#E67E54" : "#A8471B";
      const clayGlow = dark ? "rgba(230, 126, 84, 0.4)" : "rgba(168, 71, 27, 0.25)";
      const starNodeFill = dark ? "rgba(248, 246, 240, 0.75)" : "rgba(22, 16, 12, 0.65)";

      // Compositional positioning:
      // The prism is positioned around 40% width and 42% height so the beam sweeps
      // safely ABOVE the "For the tech." headline without slicing through it!
      const isMobile = width < 768 * dpr;
      const prismCenterX = isMobile ? width * 0.32 : width * 0.41;
      const prismCenterY = isMobile ? height * 0.4 : height * 0.42;
      const prismSize = Math.min(width, height) * (isMobile ? 0.22 : 0.2);

      // Prism Vertices (Equilateral triangle)
      const topVertex = { x: prismCenterX, y: prismCenterY - prismSize * 0.88 };
      const leftVertex = { x: prismCenterX - prismSize * 0.52, y: prismCenterY + prismSize * 0.58 };
      const rightVertex = {
        x: prismCenterX + prismSize * 0.52,
        y: prismCenterY + prismSize * 0.58,
      };

      // 1. Soft Ambient Prism Glow (Radial bloom in the background)
      const bloomGrad = ctx.createRadialGradient(
        prismCenterX,
        prismCenterY,
        0,
        prismCenterX,
        prismCenterY,
        prismSize * 2.2,
      );
      bloomGrad.addColorStop(0, dark ? "rgba(230, 126, 84, 0.08)" : "rgba(168, 71, 27, 0.05)");
      bloomGrad.addColorStop(0.5, dark ? "rgba(248, 246, 240, 0.03)" : "rgba(22, 16, 12, 0.02)");
      bloomGrad.addColorStop(1, "transparent");
      ctx.fillStyle = bloomGrad;
      ctx.beginPath();
      ctx.arc(prismCenterX, prismCenterY, prismSize * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // 2. Incident Beam of Pure Curiosity (Sweeps gracefully from the upper-left)
      // Natural angle avoids colliding with the main title
      const sourceX = 0;
      const sourceY = height * 0.22 + (currentMouse.y - height * 0.22) * 0.35;
      const hitPoint = {
        x: prismCenterX - prismSize * 0.26,
        y: prismCenterY - prismSize * 0.15 + (currentMouse.y - height * 0.22) * 0.15,
      };

      ctx.save();
      ctx.shadowColor = beamGlow;
      ctx.shadowBlur = 12 * dpr;
      ctx.strokeStyle = beamColor;
      ctx.lineWidth = 1.6 * dpr;
      ctx.beginPath();
      ctx.moveTo(sourceX, sourceY);
      ctx.lineTo(hitPoint.x, hitPoint.y);
      ctx.stroke();

      // Optical beam core
      ctx.strokeStyle = dark ? "#FFFFFF" : "#000000";
      ctx.lineWidth = 0.8 * dpr;
      ctx.stroke();
      ctx.restore();

      // Drifting ambient dust motes
      ambientMotes.forEach((mote) => {
        mote.x += mote.vx;
        mote.y += mote.vy;
        if (mote.x < 0) mote.x = 1;
        if (mote.x > 1) mote.x = 0;
        if (mote.y < 0) mote.y = 1;
        if (mote.y > 1) mote.y = 0;

        ctx.fillStyle = dark
          ? `rgba(248, 246, 240, ${mote.alpha * 0.35})`
          : `rgba(22, 16, 12, ${mote.alpha * 0.25})`;
        ctx.beginPath();
        ctx.arc(mote.x * width, mote.y * height, mote.size * dpr, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. The Glass Prism (Pink Floyd Dark Side of the Moon Crystalline Diamond)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(topVertex.x, topVertex.y);
      ctx.lineTo(rightVertex.x, rightVertex.y);
      ctx.lineTo(leftVertex.x, leftVertex.y);
      ctx.closePath();

      // Internal frosted crystal gradient
      const glassGrad = ctx.createLinearGradient(
        leftVertex.x,
        topVertex.y,
        rightVertex.x,
        rightVertex.y,
      );
      glassGrad.addColorStop(0, dark ? "rgba(255, 255, 255, 0.04)" : "rgba(22, 16, 12, 0.02)");
      glassGrad.addColorStop(0.5, dark ? "rgba(255, 255, 255, 0.08)" : "rgba(22, 16, 12, 0.04)");
      glassGrad.addColorStop(1, dark ? "rgba(230, 126, 84, 0.12)" : "rgba(168, 71, 27, 0.07)");
      ctx.fillStyle = glassGrad;
      ctx.fill();

      // Glass facet perimeter
      ctx.strokeStyle = glassBorder;
      ctx.lineWidth = 1.2 * dpr;
      ctx.stroke();

      // Refractive Internal Rays crossing the crystal core
      const exitBaseY = prismCenterY + (hitPoint.y - prismCenterY) * 0.35;
      const internalRays = [
        { exitY: exitBaseY - 10 * dpr, color: "rgba(99, 102, 241, 0.35)" }, // Violet
        { exitY: exitBaseY - 5 * dpr, color: "rgba(14, 165, 233, 0.35)" }, // Cyan
        { exitY: exitBaseY, color: clayColor }, // Clay core
        { exitY: exitBaseY + 5 * dpr, color: "rgba(245, 158, 11, 0.35)" }, // Amber
        { exitY: exitBaseY + 10 * dpr, color: "rgba(239, 68, 68, 0.35)" }, // Red
      ];

      const exitX = prismCenterX + prismSize * 0.28;

      internalRays.forEach((r) => {
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 0.8 * dpr;
        ctx.beginPath();
        ctx.moveTo(hitPoint.x, hitPoint.y);
        ctx.lineTo(exitX, r.exitY);
        ctx.stroke();
      });
      ctx.restore();

      // 4. Emerging Spectral Ribbon / Dispersion Fan (Pink Floyd Rainbow Spectrum)
      // Radiating into the upper-right canvas and illuminating the background
      const spectralRibbons = [
        {
          color: dark ? "rgba(99, 102, 241, 0.35)" : "rgba(79, 70, 229, 0.22)",
          width: 1.2,
          spread: -0.26,
        }, // Violet
        {
          color: dark ? "rgba(14, 165, 233, 0.40)" : "rgba(2, 132, 199, 0.24)",
          width: 1.4,
          spread: -0.16,
        }, // Blue/Cyan
        {
          color: dark ? "rgba(20, 184, 166, 0.35)" : "rgba(13, 148, 136, 0.22)",
          width: 1.2,
          spread: -0.06,
        }, // Jade/Teal
        {
          color: dark ? "rgba(230, 126, 84, 0.65)" : "rgba(168, 71, 27, 0.45)",
          width: 2.2,
          spread: 0.04,
        }, // Primary Clay Spine
        {
          color: dark ? "rgba(245, 158, 11, 0.40)" : "rgba(217, 119, 6, 0.24)",
          width: 1.4,
          spread: 0.14,
        }, // Amber Gold
        {
          color: dark ? "rgba(239, 68, 68, 0.30)" : "rgba(220, 38, 38, 0.20)",
          width: 1.0,
          spread: 0.24,
        }, // Warm Red
      ];

      spectralRibbons.forEach((ribbon, idx) => {
        const rayExitY = exitBaseY + (idx - 2.5) * (4 * dpr);
        const rayTargetY = height * (0.35 + ribbon.spread) + Math.sin(time * 0.8 + idx) * (6 * dpr);

        ctx.save();
        ctx.strokeStyle = ribbon.color;
        ctx.lineWidth = ribbon.width * dpr;
        ctx.shadowColor = ribbon.color;
        ctx.shadowBlur = (idx === 3 ? 8 : 4) * dpr;
        ctx.beginPath();
        ctx.moveTo(exitX, rayExitY);
        ctx.lineTo(width, rayTargetY);
        ctx.stroke();
        ctx.restore();
      });

      // 5. Constellation of Connected Dots (The Bigger Picture)
      // Calculated with subtle spring drift and magnetic cursor interaction
      const currentNodes = constellationNodes.map((n, idx) => {
        const pulse = Math.sin(time * 1.6 + n.phase * 3.5) * 0.15 + 0.85;
        const driftX = Math.cos(time * 0.5 + idx * 0.9) * (2 * dpr);
        const driftY = Math.sin(time * 0.5 + idx * 0.9) * (2 * dpr);

        let mx = 0;
        let my = 0;
        if (targetMouse.active) {
          const dx = currentMouse.x - (n.nx * width + driftX);
          const dy = currentMouse.y - (n.ny * height + driftY);
          const dist = Math.hypot(dx, dy);
          const maxDist = 120 * dpr;
          if (dist < maxDist && dist > 0) {
            const force = (1 - dist / maxDist) * (10 * dpr);
            mx = (dx / dist) * force;
            my = (dy / dist) * force;
          }
        }

        return {
          x: n.nx * width + driftX + mx,
          y: n.ny * height + driftY + my,
          radius: n.radius * dpr,
          isClay: n.isClay,
          pulse,
        };
      });

      // Draw Filaments between constellation dots
      constellationEdges.forEach((edge) => {
        const p1 = currentNodes[edge.from];
        const p2 = currentNodes[edge.to];
        if (!p1 || !p2) return;

        ctx.save();
        if (edge.isClay) {
          ctx.strokeStyle = clayColor;
          ctx.lineWidth = 1.3 * dpr;
          ctx.shadowColor = clayGlow;
          ctx.shadowBlur = 5 * dpr;
        } else {
          ctx.strokeStyle = filamentColor;
          ctx.lineWidth = 0.7 * dpr;
        }

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.restore();
      });

      // Draw Traveling Photons along filaments
      travelingPhotons.forEach((p) => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;

        const edge = constellationEdges[p.edgeIdx];
        if (!edge) return;
        const p1 = currentNodes[edge.from];
        const p2 = currentNodes[edge.to];
        if (!p1 || !p2) return;

        const px = p1.x + (p2.x - p1.x) * p.progress;
        const py = p1.y + (p2.y - p1.y) * p.progress;

        ctx.save();
        ctx.fillStyle = edge.isClay ? clayColor : beamColor;
        ctx.shadowColor = edge.isClay ? clayGlow : "rgba(255, 255, 255, 0.4)";
        ctx.shadowBlur = 5 * dpr;
        ctx.beginPath();
        ctx.arc(px, py, 1.5 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw the Constellation Dots
      currentNodes.forEach((node) => {
        ctx.save();
        if (node.isClay) {
          ctx.fillStyle = clayColor;
          ctx.shadowColor = clayGlow;
          ctx.shadowBlur = 8 * dpr;
        } else {
          ctx.fillStyle = starNodeFill;
        }

        // Core Dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * node.pulse, 0, Math.PI * 2);
        ctx.fill();

        // Subtle Concentric Orbital Halo on Clay Spine Nodes
        if (node.isClay) {
          ctx.strokeStyle = clayColor;
          ctx.lineWidth = 0.7 * dpr;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * 2.0 * node.pulse, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none select-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
