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

    // Smoothed mouse state
    const targetMouse = { x: -1000, y: -1000, active: false };
    const currentMouse = { x: -1000, y: -1000, active: false };

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

    // Global smooth mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (
        e.clientY >= rect.top - 80 &&
        e.clientY <= rect.bottom + 80 &&
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

    // Constellation nodes (normalized 0..1 layout)
    // Pure geometry: no text labels. Harmonic distribution forming the bigger picture.
    const nodesData: Array<{
      nx: number;
      ny: number;
      isClay?: boolean;
      size: number;
      delay: number;
    }> = [
      // Primary Clay Spine (The breakthrough path through the threshold)
      { nx: 0.44, ny: 0.48, isClay: true, size: 3.5, delay: 0.0 },
      { nx: 0.53, ny: 0.42, isClay: true, size: 4.0, delay: 0.2 },
      { nx: 0.64, ny: 0.36, isClay: true, size: 4.5, delay: 0.4 },
      { nx: 0.76, ny: 0.32, isClay: true, size: 4.8, delay: 0.6 },
      { nx: 0.88, ny: 0.38, isClay: true, size: 4.0, delay: 0.8 },
      { nx: 0.95, ny: 0.45, isClay: true, size: 3.2, delay: 1.0 },

      // Upper Arch Constellation
      { nx: 0.48, ny: 0.34, size: 2.2, delay: 0.15 },
      { nx: 0.58, ny: 0.25, size: 2.6, delay: 0.3 },
      { nx: 0.7, ny: 0.2, size: 3.0, delay: 0.5 },
      { nx: 0.82, ny: 0.18, size: 2.8, delay: 0.7 },
      { nx: 0.92, ny: 0.22, size: 2.2, delay: 0.85 },

      // Central Lattice (The interconnected synthesis mesh)
      { nx: 0.5, ny: 0.56, size: 2.4, delay: 0.25 },
      { nx: 0.6, ny: 0.52, size: 2.8, delay: 0.45 },
      { nx: 0.71, ny: 0.48, size: 3.2, delay: 0.6 },
      { nx: 0.82, ny: 0.52, size: 3.0, delay: 0.75 },
      { nx: 0.91, ny: 0.58, size: 2.5, delay: 0.9 },

      // Lower Arch Constellation
      { nx: 0.47, ny: 0.66, size: 2.2, delay: 0.2 },
      { nx: 0.56, ny: 0.72, size: 2.6, delay: 0.4 },
      { nx: 0.68, ny: 0.78, size: 3.0, delay: 0.65 },
      { nx: 0.8, ny: 0.75, size: 2.7, delay: 0.8 },
      { nx: 0.89, ny: 0.7, size: 2.3, delay: 0.95 },

      // Perimeter & Harmonizing Nodes
      { nx: 0.62, ny: 0.63, size: 2.0, delay: 0.5 },
      { nx: 0.75, ny: 0.64, size: 2.4, delay: 0.7 },
      { nx: 0.85, ny: 0.29, size: 2.2, delay: 0.8 },
    ];

    // Constellation Edges (Connecting the dots into the bigger picture)
    const edges: Array<{ from: number; to: number; isClay?: boolean }> = [
      // Primary Clay Spine
      { from: 0, to: 1, isClay: true },
      { from: 1, to: 2, isClay: true },
      { from: 2, to: 3, isClay: true },
      { from: 3, to: 4, isClay: true },
      { from: 4, to: 5, isClay: true },

      // Upper Spine
      { from: 0, to: 6 },
      { from: 6, to: 7 },
      { from: 7, to: 8 },
      { from: 8, to: 9 },
      { from: 9, to: 10 },

      // Central Lattice
      { from: 0, to: 11 },
      { from: 11, to: 12 },
      { from: 12, to: 13 },
      { from: 13, to: 14 },
      { from: 14, to: 15 },

      // Lower Spine
      { from: 0, to: 16 },
      { from: 16, to: 17 },
      { from: 17, to: 18 },
      { from: 18, to: 19 },
      { from: 19, to: 20 },

      // Cross-linking filaments (Forming geometric harmony)
      { from: 1, to: 6 },
      { from: 2, to: 7 },
      { from: 3, to: 8 },
      { from: 4, to: 9 },
      { from: 1, to: 11 },
      { from: 2, to: 12 },
      { from: 3, to: 13 },
      { from: 4, to: 14 },
      { from: 11, to: 16 },
      { from: 12, to: 21 },
      { from: 21, to: 17 },
      { from: 13, to: 22 },
      { from: 22, to: 18 },
      { from: 14, to: 19 },
      { from: 3, to: 23 },
      { from: 23, to: 9 },
      { from: 4, to: 15 },
      { from: 15, to: 20 },
    ];

    // Subtle drifting dust motes
    const motes = Array.from({ length: 28 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0003,
      vy: (Math.random() - 0.5) * 0.0003,
      size: 0.8 + Math.random() * 1.5,
      alpha: 0.15 + Math.random() * 0.35,
    }));

    // Traveling light pulses along constellation filaments
    const pulses = [
      { edgeIndex: 0, progress: 0.1, speed: 0.006 },
      { edgeIndex: 2, progress: 0.5, speed: 0.005 },
      { edgeIndex: 3, progress: 0.2, speed: 0.007 },
      { edgeIndex: 7, progress: 0.7, speed: 0.004 },
      { edgeIndex: 12, progress: 0.3, speed: 0.005 },
    ];

    // Main animation loop
    const render = () => {
      if (!isVisible) {
        animationId = requestAnimationFrame(render);
        return;
      }

      time += 0.015;
      const dark = isDark();

      const width = canvas.width;
      const height = canvas.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      // Lerp mouse
      if (targetMouse.active) {
        currentMouse.x += (targetMouse.x * dpr - currentMouse.x) * 0.06;
        currentMouse.y += (targetMouse.y * dpr - currentMouse.y) * 0.06;
        currentMouse.active = true;
      } else {
        const idleX = width * 0.15;
        const idleY = height * 0.5 + Math.sin(time * 0.8) * (height * 0.1);
        currentMouse.x += (idleX - currentMouse.x) * 0.03;
        currentMouse.y += (idleY - currentMouse.y) * 0.03;
      }

      ctx.clearRect(0, 0, width, height);

      // Editorial Palette (Atmospheric, delicate, luxury)
      const beamColor = dark ? "rgba(248, 246, 240, 0.75)" : "rgba(22, 16, 12, 0.65)";
      const hairGrid = dark ? "rgba(248, 246, 240, 0.04)" : "rgba(22, 16, 12, 0.035)";
      const hairFilament = dark ? "rgba(248, 246, 240, 0.15)" : "rgba(22, 16, 12, 0.14)";
      const clayColor = dark ? "#E67E54" : "#A8471B";
      const glowClay = dark ? "rgba(230, 126, 84, 0.35)" : "rgba(168, 71, 27, 0.25)";
      const nodeFill = dark ? "rgba(248, 246, 240, 0.7)" : "rgba(22, 16, 12, 0.6)";

      // Geometric layout anchors
      // Prism sits around 32% - 36% width so text sits in front and constellation blooms to the right
      const isMobile = width < 640 * dpr;
      const prismCenterX = isMobile ? width * 0.28 : width * 0.35;
      const prismCenterY = height * 0.48;
      const prismSize = Math.min(width, height) * (isMobile ? 0.26 : 0.24);

      // Prism Vertices (Sleek Equilateral Triangle)
      const topVertex = { x: prismCenterX, y: prismCenterY - prismSize * 0.88 };
      const leftVertex = { x: prismCenterX - prismSize * 0.54, y: prismCenterY + prismSize * 0.6 };
      const rightVertex = { x: prismCenterX + prismSize * 0.54, y: prismCenterY + prismSize * 0.6 };

      // 1. Subtle, quiet hairline coordinate grid (fading towards edges)
      ctx.save();
      ctx.strokeStyle = hairGrid;
      ctx.lineWidth = 1;
      const gridStep = Math.round(50 * dpr);
      for (let gx = 0; gx < width; gx += gridStep) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }
      for (let gy = 0; gy < height; gy += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }
      ctx.restore();

      // 2. The Threshold Wall (Delicate dashed vertical axis through the prism)
      ctx.save();
      ctx.setLineDash([4 * dpr, 6 * dpr]);
      ctx.strokeStyle = dark ? "rgba(248, 246, 240, 0.08)" : "rgba(22, 16, 12, 0.07)";
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(prismCenterX, height * 0.05);
      ctx.lineTo(prismCenterX, height * 0.95);
      ctx.stroke();
      ctx.restore();

      // 3. Incident Ray (A single beam of raw curiosity entering from the left)
      const sourceY = height * 0.48 + (currentMouse.y - height * 0.48) * 0.5;
      const hitPoint = {
        x: prismCenterX - prismSize * 0.26,
        y: prismCenterY - prismSize * 0.12 + (currentMouse.y - height * 0.48) * 0.2,
      };

      ctx.save();
      ctx.shadowColor = dark ? "rgba(255, 255, 255, 0.35)" : "rgba(22, 16, 12, 0.15)";
      ctx.shadowBlur = 10 * dpr;
      ctx.strokeStyle = beamColor;
      ctx.lineWidth = 1.8 * dpr;
      ctx.beginPath();
      ctx.moveTo(0, sourceY);
      ctx.lineTo(hitPoint.x, hitPoint.y);
      ctx.stroke();
      ctx.restore();

      // Beam dust motes
      motes.forEach((mote) => {
        mote.x += mote.vx;
        mote.y += mote.vy;
        if (mote.x < 0) mote.x = 1;
        if (mote.x > 1) mote.x = 0;
        if (mote.y < 0) mote.y = 1;
        if (mote.y > 1) mote.y = 0;

        ctx.fillStyle = dark
          ? `rgba(248, 246, 240, ${mote.alpha * 0.4})`
          : `rgba(22, 16, 12, ${mote.alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(mote.x * width, mote.y * height, mote.size * dpr, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. The Glass Prism (Pink Floyd prism with internal refraction)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(topVertex.x, topVertex.y);
      ctx.lineTo(rightVertex.x, rightVertex.y);
      ctx.lineTo(leftVertex.x, leftVertex.y);
      ctx.closePath();

      // Translucent crystalline gradient
      const glassGrad = ctx.createLinearGradient(
        leftVertex.x,
        topVertex.y,
        rightVertex.x,
        rightVertex.y,
      );
      glassGrad.addColorStop(0, dark ? "rgba(255, 255, 255, 0.03)" : "rgba(22, 16, 12, 0.02)");
      glassGrad.addColorStop(0.5, dark ? "rgba(255, 255, 255, 0.06)" : "rgba(22, 16, 12, 0.04)");
      glassGrad.addColorStop(1, dark ? "rgba(230, 126, 84, 0.09)" : "rgba(168, 71, 27, 0.06)");
      ctx.fillStyle = glassGrad;
      ctx.fill();

      // Prism Facet Outlines
      ctx.strokeStyle = dark ? "rgba(248, 246, 240, 0.28)" : "rgba(22, 16, 12, 0.25)";
      ctx.lineWidth = 1.2 * dpr;
      ctx.stroke();

      // Internal Caustics / Refraction lines
      const exitPointClay = {
        x: prismCenterX + prismSize * 0.3,
        y: prismCenterY + (hitPoint.y - prismCenterY) * 0.38,
      };
      const exitPointUpper = { x: prismCenterX + prismSize * 0.26, y: exitPointClay.y - 14 * dpr };
      const exitPointLower = { x: prismCenterX + prismSize * 0.26, y: exitPointClay.y + 14 * dpr };

      ctx.strokeStyle = hairFilament;
      ctx.lineWidth = 0.9 * dpr;
      ctx.beginPath();
      ctx.moveTo(hitPoint.x, hitPoint.y);
      ctx.lineTo(exitPointUpper.x, exitPointUpper.y);
      ctx.moveTo(hitPoint.x, hitPoint.y);
      ctx.lineTo(exitPointClay.x, exitPointClay.y);
      ctx.moveTo(hitPoint.x, hitPoint.y);
      ctx.lineTo(exitPointLower.x, exitPointLower.y);
      ctx.stroke();
      ctx.restore();

      // 5. Emerging Spectral Dispersion Rays (Warm Editorial Spectrum)
      const dispersionRays = [
        { color: dark ? "rgba(180, 200, 220, 0.2)" : "rgba(80, 100, 130, 0.14)", width: 1.0 },
        { color: dark ? "rgba(230, 126, 84, 0.42)" : "rgba(168, 71, 27, 0.32)", width: 1.8 }, // Main clay ray
        { color: dark ? "rgba(240, 215, 140, 0.22)" : "rgba(160, 130, 60, 0.15)", width: 1.2 },
        { color: dark ? "rgba(160, 210, 190, 0.2)" : "rgba(50, 120, 100, 0.14)", width: 1.0 },
        { color: dark ? "rgba(200, 170, 210, 0.18)" : "rgba(110, 80, 120, 0.12)", width: 0.9 },
      ];

      dispersionRays.forEach((ray, i) => {
        const spreadOffset = (i - 2) * (height * 0.22);
        ctx.save();
        ctx.strokeStyle = ray.color;
        ctx.lineWidth = ray.width * dpr;
        ctx.beginPath();
        ctx.moveTo(exitPointClay.x, exitPointClay.y);
        ctx.lineTo(width, exitPointClay.y + spreadOffset + Math.sin(time * 0.9 + i) * 8 * dpr);
        ctx.stroke();
        ctx.restore();
      });

      // 6. Constellation of Connected Nodes (The Bigger Picture)
      const currentNodes = nodesData.map((n, idx) => {
        const breath = Math.sin(time * 1.8 + n.delay * 4) * 0.15 + 0.85;
        const driftX = Math.cos(time * 0.6 + idx * 0.8) * 2.5 * dpr;
        const driftY = Math.sin(time * 0.6 + idx * 0.8) * 2.5 * dpr;

        let mx = 0;
        let my = 0;
        if (targetMouse.active) {
          const dx = currentMouse.x - (n.nx * width + driftX);
          const dy = currentMouse.y - (n.ny * height + driftY);
          const dist = Math.hypot(dx, dy);
          const maxDist = 140 * dpr;
          if (dist < maxDist && dist > 0) {
            const force = (1 - dist / maxDist) * 14 * dpr;
            mx = (dx / dist) * force;
            my = (dy / dist) * force;
          }
        }

        return {
          x: n.nx * width + driftX + mx,
          y: n.ny * height + driftY + my,
          radius: n.size * dpr,
          isClay: n.isClay,
          breath,
        };
      });

      // Draw Filaments between dots
      edges.forEach((edge) => {
        const p1 = currentNodes[edge.from];
        const p2 = currentNodes[edge.to];
        if (!p1 || !p2) return;

        ctx.save();
        if (edge.isClay) {
          ctx.strokeStyle = clayColor;
          ctx.lineWidth = 1.4 * dpr;
          ctx.shadowColor = glowClay;
          ctx.shadowBlur = 6 * dpr;
        } else {
          ctx.strokeStyle = hairFilament;
          ctx.lineWidth = 0.9 * dpr;
        }

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.restore();
      });

      // Draw Traveling Light Pulses along filaments
      pulses.forEach((p) => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;

        const edge = edges[p.edgeIndex];
        if (!edge) return;
        const p1 = currentNodes[edge.from];
        const p2 = currentNodes[edge.to];
        if (!p1 || !p2) return;

        const px = p1.x + (p2.x - p1.x) * p.progress;
        const py = p1.y + (p2.y - p1.y) * p.progress;

        ctx.save();
        ctx.fillStyle = edge.isClay ? clayColor : beamColor;
        ctx.shadowColor = edge.isClay ? glowClay : "rgba(255, 255, 255, 0.5)";
        ctx.shadowBlur = 6 * dpr;
        ctx.beginPath();
        ctx.arc(px, py, 2 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw The Dots / Nodes
      currentNodes.forEach((node) => {
        ctx.save();
        if (node.isClay) {
          ctx.fillStyle = clayColor;
          ctx.shadowColor = glowClay;
          ctx.shadowBlur = 8 * dpr;
        } else {
          ctx.fillStyle = nodeFill;
        }

        // Core Dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * node.breath, 0, Math.PI * 2);
        ctx.fill();

        // Concentric Orbital Halo on Clay Nodes
        if (node.isClay) {
          ctx.strokeStyle = clayColor;
          ctx.lineWidth = 0.8 * dpr;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * 2.1 * node.breath, 0, Math.PI * 2);
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
