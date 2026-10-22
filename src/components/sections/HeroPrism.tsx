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

    // Constellation nodes positioned in the right stage and lower transition
    // (Never cluttering the left typography)
    const constellationNodes = [
      // Primary Clay Breakthrough Spine
      { nx: 0.76, ny: 0.28, isClay: true, radius: 2.8, phase: 0.0 },
      { nx: 0.83, ny: 0.23, isClay: true, radius: 3.2, phase: 0.3 },
      { nx: 0.90, ny: 0.19, isClay: true, radius: 3.5, phase: 0.6 },
      { nx: 0.96, ny: 0.17, isClay: true, radius: 2.8, phase: 0.9 },

      // Upper Canopy (Right corner)
      { nx: 0.78, ny: 0.16, isClay: false, radius: 1.8, phase: 0.2 },
      { nx: 0.86, ny: 0.11, isClay: false, radius: 2.0, phase: 0.5 },
      { nx: 0.93, ny: 0.08, isClay: false, radius: 2.2, phase: 0.8 },

      // Middle Resonance Arch
      { nx: 0.79, ny: 0.38, isClay: false, radius: 2.0, phase: 0.4 },
      { nx: 0.87, ny: 0.34, isClay: false, radius: 2.2, phase: 0.7 },
      { nx: 0.94, ny: 0.31, isClay: false, radius: 2.0, phase: 1.0 },

      // Lower Transition Filaments (Connecting down toward stats cards)
      { nx: 0.74, ny: 0.48, isClay: false, radius: 1.8, phase: 0.5 },
      { nx: 0.82, ny: 0.46, isClay: false, radius: 2.0, phase: 0.8 },
      { nx: 0.91, ny: 0.45, isClay: false, radius: 1.8, phase: 1.1 },

      // Bottom Arch (Behind & below stats row)
      { nx: 0.35, ny: 0.86, isClay: false, radius: 1.6, phase: 0.3 },
      { nx: 0.52, ny: 0.84, isClay: true, radius: 2.2, phase: 0.6 },
      { nx: 0.70, ny: 0.86, isClay: false, radius: 1.9, phase: 0.9 },
      { nx: 0.88, ny: 0.88, isClay: true, radius: 2.2, phase: 1.2 },
      { nx: 0.60, ny: 0.95, isClay: false, radius: 1.7, phase: 1.5 },
    ];

    // Constellation Edges
    const constellationEdges = [
      // Clay Spine
      { from: 0, to: 1, isClay: true },
      { from: 1, to: 2, isClay: true },
      { from: 2, to: 3, isClay: true },

      // Upper Canopy
      { from: 0, to: 4 },
      { from: 4, to: 5 },
      { from: 5, to: 6 },
      { from: 1, to: 5 },
      { from: 2, to: 6 },

      // Middle Arch
      { from: 0, to: 7 },
      { from: 7, to: 8 },
      { from: 8, to: 9 },
      { from: 1, to: 8 },
      { from: 2, to: 9 },

      // Lower Transition
      { from: 7, to: 10 },
      { from: 10, to: 11 },
      { from: 11, to: 12 },
      { from: 8, to: 11 },
      { from: 9, to: 12 },

      // Flowing down to bottom cards
      { from: 10, to: 15 },
      { from: 11, to: 16 },
      { from: 13, to: 14 },
      { from: 14, to: 15 },
      { from: 15, to: 16 },
      { from: 14, to: 17 },
      { from: 15, to: 17 },
    ];

    // Floating ambient dust motes
    const ambientMotes = Array.from({ length: 24 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0002,
      vy: (Math.random() - 0.5) * 0.0002,
      size: 0.7 + Math.random() * 1.2,
      alpha: 0.15 + Math.random() * 0.35,
    }));

    // Micro-photons gliding across edges
    const travelingPhotons = [
      { edgeIdx: 0, progress: 0.1, speed: 0.007 },
      { edgeIdx: 1, progress: 0.5, speed: 0.006 },
      { edgeIdx: 2, progress: 0.3, speed: 0.008 },
      { edgeIdx: 4, progress: 0.8, speed: 0.005 },
      { edgeIdx: 7, progress: 0.4, speed: 0.006 },
      { edgeIdx: 13, progress: 0.2, speed: 0.005 },
      { edgeIdx: 16, progress: 0.6, speed: 0.007 },
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
        const idleX = width * 0.1;
        const idleY = height * 0.08 + Math.sin(time * 0.6) * (height * 0.03);
        currentMouse.x += (idleX - currentMouse.x) * 0.025;
        currentMouse.y += (idleY - currentMouse.y) * 0.025;
      }

      ctx.clearRect(0, 0, width, height);

      // Palette
      const beamColor = dark ? "rgba(248, 246, 240, 0.85)" : "rgba(22, 16, 12, 0.60)";
      const beamGlow = dark ? "rgba(248, 246, 240, 0.3)" : "rgba(22, 16, 12, 0.08)";
      const glassBorder = dark ? "rgba(248, 246, 240, 0.35)" : "rgba(22, 16, 12, 0.22)";
      const filamentColor = dark ? "rgba(248, 246, 240, 0.12)" : "rgba(22, 16, 12, 0.09)";
      const clayColor = dark ? "#E67E54" : "#A8471B";
      const clayGlow = dark ? "rgba(230, 126, 84, 0.4)" : "rgba(168, 71, 27, 0.22)";
      const starNodeFill = dark ? "rgba(248, 246, 240, 0.75)" : "rgba(22, 16, 12, 0.65)";

      // Compositional positioning:
      // The prism is positioned on the right stage, leaving the entire left column
      // for the authoritative headline and lead text without ANY collisions!
      const isMobile = width < 768 * dpr;
      const prismCenterX = isMobile ? width * 0.72 : width * 0.70;
      const prismCenterY = isMobile ? height * 0.24 : height * 0.30;
      const prismSize = Math.min(width, height) * (isMobile ? 0.16 : 0.18);

      // Prism Vertices (Equilateral triangle)
      const topVertex = { x: prismCenterX, y: prismCenterY - prismSize * 0.88 };
      const leftVertex = { x: prismCenterX - prismSize * 0.52, y: prismCenterY + prismSize * 0.58 };
      const rightVertex = {
        x: prismCenterX + prismSize * 0.52,
        y: prismCenterY + prismSize * 0.58,
      };

      // 1. Soft Ambient Radial Bloom
      const bloomGrad = ctx.createRadialGradient(
        prismCenterX,
        prismCenterY,
        0,
        prismCenterX,
        prismCenterY,
        prismSize * 2.4,
      );
      bloomGrad.addColorStop(0, dark ? "rgba(230, 126, 84, 0.09)" : "rgba(168, 71, 27, 0.05)");
      bloomGrad.addColorStop(0.5, dark ? "rgba(248, 246, 240, 0.02)" : "rgba(22, 16, 12, 0.015)");
      bloomGrad.addColorStop(1, "transparent");
      ctx.fillStyle = bloomGrad;
      ctx.beginPath();
      ctx.arc(prismCenterX, prismCenterY, prismSize * 2.4, 0, Math.PI * 2);
      ctx.fill();

      // 2. Incident Beam of Pure Curiosity
      // Enters from high above in the top margin (sourceY = 6% to 10%), completely above all typography!
      const sourceX = 0;
      const sourceY = height * 0.08 + (currentMouse.y - height * 0.1) * 0.2;
      const hitPoint = {
        x: prismCenterX - prismSize * 0.26,
        y: prismCenterY - prismSize * 0.12 + (currentMouse.y - height * 0.1) * 0.1,
      };

      ctx.save();
      ctx.shadowColor = beamGlow;
      ctx.shadowBlur = 10 * dpr;
      ctx.strokeStyle = beamColor;
      ctx.lineWidth = 1.4 * dpr;
      ctx.beginPath();
      ctx.moveTo(sourceX, sourceY);
      ctx.lineTo(hitPoint.x, hitPoint.y);
      ctx.stroke();

      // Core photon gliding along the incident ray
      const beamProgress = (time * 0.6) % 1;
      const beamPhotonX = sourceX + (hitPoint.x - sourceX) * beamProgress;
      const beamPhotonY = sourceY + (hitPoint.y - sourceY) * beamProgress;
      ctx.fillStyle = dark ? "#FFF" : clayColor;
      ctx.beginPath();
      ctx.arc(beamPhotonX, beamPhotonY, 1.8 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 3. Internal Crystalline Refraction Paths
      const internalExitUpper = {
        x: prismCenterX + prismSize * 0.18,
        y: prismCenterY - prismSize * 0.18,
      };
      const internalExitLower = {
        x: prismCenterX + prismSize * 0.38,
        y: prismCenterY + prismSize * 0.22,
      };

      ctx.save();
      ctx.lineWidth = 1.0 * dpr;
      const refractionGrad = ctx.createLinearGradient(
        hitPoint.x,
        hitPoint.y,
        internalExitLower.x,
        internalExitLower.y,
      );
      refractionGrad.addColorStop(0, dark ? "rgba(255,255,255,0.7)" : "rgba(22,16,12,0.45)");
      refractionGrad.addColorStop(0.5, dark ? "rgba(230,126,84,0.6)" : "rgba(168,71,27,0.4)");
      refractionGrad.addColorStop(1, dark ? "rgba(255,255,255,0.8)" : "rgba(22,16,12,0.6)");
      ctx.strokeStyle = refractionGrad;
      ctx.beginPath();
      ctx.moveTo(hitPoint.x, hitPoint.y);
      ctx.lineTo(internalExitUpper.x, internalExitUpper.y);
      ctx.moveTo(hitPoint.x, hitPoint.y);
      ctx.lineTo(internalExitLower.x, internalExitLower.y);
      ctx.stroke();
      ctx.restore();

      // 4. Multi-Spectral Dispersion Fan (Pink Floyd Dark Side Chromatic Ribbon)
      const spectralBands = [
        { color: dark ? "rgba(168, 85, 247, 0.55)" : "rgba(147, 51, 234, 0.45)", angle: -0.22 }, // Violet
        { color: dark ? "rgba(59, 130, 246, 0.60)" : "rgba(37, 99, 235, 0.45)", angle: -0.16 },  // Cyan
        { color: dark ? "rgba(16, 185, 129, 0.60)" : "rgba(5, 150, 105, 0.45)", angle: -0.10 },  // Jade
        { color: dark ? "rgba(230, 126, 84, 0.85)" : "rgba(168, 71, 27, 0.70)", angle: -0.04 },  // Clay (Flagship)
        { color: dark ? "rgba(245, 158, 11, 0.65)" : "rgba(217, 119, 6, 0.50)", angle: 0.02 },   // Amber
        { color: dark ? "rgba(239, 68, 68, 0.55)" : "rgba(220, 38, 38, 0.40)", angle: 0.08 },    // Warm Red
      ];

      const fanOriginX = prismCenterX + prismSize * 0.28;
      const fanOriginY = prismCenterY + prismSize * 0.04;

      // Draw soft gradient fills between consecutive bands (authentic continuous ribbon)
      for (let i = 0; i < spectralBands.length - 1; i++) {
        const b1 = spectralBands[i];
        const b2 = spectralBands[i + 1];
        const mouseBend = (currentMouse.y / height - 0.25) * 0.1;
        const a1 = b1.angle + mouseBend;
        const a2 = b2.angle + mouseBend;
        const ribbonLen = width * 0.45;

        const p1X = fanOriginX + Math.cos(a1) * ribbonLen;
        const p1Y = fanOriginY + Math.sin(a1) * ribbonLen;
        const p2X = fanOriginX + Math.cos(a2) * ribbonLen;
        const p2Y = fanOriginY + Math.sin(a2) * ribbonLen;

        const ribbonGrad = ctx.createLinearGradient(fanOriginX, fanOriginY, p1X, p1Y);
        ribbonGrad.addColorStop(0, dark ? "rgba(255,255,255,0.06)" : "rgba(22,16,12,0.03)");
        ribbonGrad.addColorStop(0.5, b1.color);
        ribbonGrad.addColorStop(1, "transparent");

        ctx.save();
        ctx.fillStyle = ribbonGrad;
        ctx.beginPath();
        ctx.moveTo(fanOriginX, fanOriginY);
        ctx.lineTo(p1X, p1Y);
        ctx.lineTo(p2X, p2Y);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Draw crisp spectral rays
      spectralBands.forEach((band) => {
        const mouseBend = (currentMouse.y / height - 0.25) * 0.1;
        const finalAngle = band.angle + mouseBend;
        const rayLen = width * 0.48;
        const endX = fanOriginX + Math.cos(finalAngle) * rayLen;
        const endY = fanOriginY + Math.sin(finalAngle) * rayLen;

        const rayGrad = ctx.createLinearGradient(fanOriginX, fanOriginY, endX, endY);
        rayGrad.addColorStop(0, band.color);
        rayGrad.addColorStop(0.4, band.color);
        rayGrad.addColorStop(0.9, "transparent");

        ctx.save();
        ctx.strokeStyle = rayGrad;
        ctx.lineWidth = 1.3 * dpr;
        ctx.beginPath();
        ctx.moveTo(fanOriginX, fanOriginY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.restore();
      });

      // 5. Constellation Filaments
      ctx.save();
      constellationEdges.forEach((edge) => {
        const p1 = constellationNodes[edge.from];
        const p2 = constellationNodes[edge.to];
        if (!p1 || !p2) return;

        const x1 = p1.nx * width;
        const y1 = p1.ny * height;
        const x2 = p2.nx * width;
        const y2 = p2.ny * height;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);

        if (edge.isClay) {
          ctx.strokeStyle = dark ? "rgba(230, 126, 84, 0.35)" : "rgba(168, 71, 27, 0.25)";
          ctx.lineWidth = 1.2 * dpr;
        } else {
          ctx.strokeStyle = filamentColor;
          ctx.lineWidth = 0.8 * dpr;
        }
        ctx.stroke();
      });
      ctx.restore();

      // 6. Traveling Photons
      travelingPhotons.forEach((photon) => {
        photon.progress += photon.speed;
        if (photon.progress > 1) photon.progress = 0;

        const edge = constellationEdges[photon.edgeIdx];
        if (!edge) return;
        const p1 = constellationNodes[edge.from];
        const p2 = constellationNodes[edge.to];
        if (!p1 || !p2) return;

        const px = (p1.nx + (p2.nx - p1.nx) * photon.progress) * width;
        const py = (p1.ny + (p2.ny - p1.ny) * photon.progress) * height;

        ctx.save();
        ctx.fillStyle = edge.isClay ? clayColor : dark ? "#FFF" : "#16100C";
        ctx.shadowColor = edge.isClay ? clayGlow : "rgba(255,255,255,0.4)";
        ctx.shadowBlur = 6 * dpr;
        ctx.beginPath();
        ctx.arc(px, py, 1.8 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 7. Constellation Nodes
      constellationNodes.forEach((node) => {
        const nx = node.nx * width;
        const ny = node.ny * height;
        const pulse = Math.sin(time * 2.0 + node.phase) * 0.4 + 1.0;
        const r = node.radius * dpr * pulse;

        ctx.save();
        if (node.isClay) {
          ctx.fillStyle = clayColor;
          ctx.shadowColor = clayGlow;
          ctx.shadowBlur = 8 * dpr;
        } else {
          ctx.fillStyle = starNodeFill;
          ctx.shadowColor = dark ? "rgba(248, 246, 240, 0.2)" : "rgba(22, 16, 12, 0.08)";
          ctx.shadowBlur = 4 * dpr;
        }

        ctx.beginPath();
        ctx.arc(nx, ny, r, 0, Math.PI * 2);
        ctx.fill();

        if (node.isClay && node.radius > 2.5) {
          ctx.strokeStyle = dark ? "rgba(230, 126, 84, 0.4)" : "rgba(168, 71, 27, 0.22)";
          ctx.lineWidth = 0.8 * dpr;
          ctx.beginPath();
          ctx.arc(nx, ny, r * 2.2, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      });

      // 8. Atmospheric Ambient Dust Motes
      ambientMotes.forEach((mote) => {
        mote.x += mote.vx;
        mote.y += mote.vy;
        if (mote.x < 0) mote.x = 1;
        if (mote.x > 1) mote.x = 0;
        if (mote.y < 0) mote.y = 1;
        if (mote.y > 1) mote.y = 0;

        const mx = mote.x * width;
        const my = mote.y * height;
        ctx.fillStyle = dark
          ? `rgba(248, 246, 240, ${mote.alpha * 0.3})`
          : `rgba(22, 16, 12, ${mote.alpha * 0.16})`;
        ctx.beginPath();
        ctx.arc(mx, my, mote.size * dpr, 0, Math.PI * 2);
        ctx.fill();
      });

      // 9. Prism Glass Shell & Architectural Caustic Facets
      ctx.save();
      ctx.fillStyle = dark ? "rgba(248, 246, 240, 0.03)" : "rgba(22, 16, 12, 0.02)";
      ctx.beginPath();
      ctx.moveTo(topVertex.x, topVertex.y);
      ctx.lineTo(leftVertex.x, leftVertex.y);
      ctx.lineTo(rightVertex.x, rightVertex.y);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = glassBorder;
      ctx.lineWidth = 1.4 * dpr;
      ctx.stroke();

      // Inner Caustic Line
      ctx.strokeStyle = dark ? "rgba(248, 246, 240, 0.15)" : "rgba(22, 16, 12, 0.08)";
      ctx.lineWidth = 0.8 * dpr;
      ctx.beginPath();
      ctx.moveTo(topVertex.x, topVertex.y);
      ctx.lineTo(prismCenterX, prismCenterY + prismSize * 0.58);
      ctx.stroke();
      ctx.restore();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
