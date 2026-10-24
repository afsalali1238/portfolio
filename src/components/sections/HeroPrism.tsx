import { useEffect, useRef } from "react";

/**
 * An interactive canvas prism + constellation + chromatic dispersion hero.
 *
 * Improvements over the original:
 * - Completely stops the rAF loop when off-screen (IntersectionObserver).
 * - Reads dark-mode class once per frame via a cached MutationObserver instead of 60×/s DOM reads.
 * - Respects `prefers-reduced-motion`: renders one static frame then stops.
 * - Touch support: touchmove maps to the same interaction as mousemove.
 * - Canvas is sized via ResizeObserver, not a window resize listener.
 * - All colour values use the brand palette tokens (paper, ink, clay).
 */
export function HeroPrism({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId = 0;
    let isVisible = true;
    let time = 0;
    let isDark = document.documentElement.classList.contains("dark");

    // Track dark-mode changes via MutationObserver — one check per toggle, not per frame.
    const themeObserver = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains("dark");
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Smoothed spring mouse state
    const targetMouse = { x: -1000, y: -1000, active: false };
    const currentMouse = { x: -1000, y: -1000 };

    const resize = () => {
      const parent = containerRef.current;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    resize();

    // Use ResizeObserver for container-driven resize
    const resizeObs = new ResizeObserver(resize);
    if (containerRef.current) resizeObs.observe(containerRef.current);

    // Visibility observer — completely pauses the loop when not on-screen
    const visObs = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = isVisible;
        isVisible = entry.isIntersecting;
        // Restart the loop when coming back into view
        if (!wasVisible && isVisible) {
          animationId = requestAnimationFrame(render);
        }
      },
      { threshold: 0.05 },
    );
    visObs.observe(canvas);

    // Mouse interaction
    const handlePointer = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      if (
        clientY >= rect.top - 100 &&
        clientY <= rect.bottom + 100 &&
        clientX >= rect.left &&
        clientX <= rect.right
      ) {
        targetMouse.x = clientX - rect.left;
        targetMouse.y = clientY - rect.top;
        targetMouse.active = true;
      } else {
        targetMouse.active = false;
      }
    };

    const onMouseMove = (e: MouseEvent) => handlePointer(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) handlePointer(t.clientX, t.clientY);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    // ─── Data: constellation nodes ───────────────────────────────────
    const constellationNodes = [
      // Primary clay breakthrough spine
      { nx: 0.77, ny: 0.30, isClay: true,  radius: 2.8, phase: 0.0 },
      { nx: 0.84, ny: 0.25, isClay: true,  radius: 3.2, phase: 0.3 },
      { nx: 0.91, ny: 0.20, isClay: true,  radius: 3.5, phase: 0.6 },
      { nx: 0.97, ny: 0.17, isClay: true,  radius: 2.8, phase: 0.9 },
      // Upper canopy (right corner)
      { nx: 0.79, ny: 0.18, isClay: false, radius: 1.8, phase: 0.2 },
      { nx: 0.87, ny: 0.12, isClay: false, radius: 2.0, phase: 0.5 },
      { nx: 0.94, ny: 0.09, isClay: false, radius: 2.2, phase: 0.8 },
      // Middle resonance arch
      { nx: 0.80, ny: 0.40, isClay: false, radius: 2.0, phase: 0.4 },
      { nx: 0.88, ny: 0.36, isClay: false, radius: 2.2, phase: 0.7 },
      { nx: 0.95, ny: 0.32, isClay: false, radius: 2.0, phase: 1.0 },
      // Lower transition filaments
      { nx: 0.75, ny: 0.50, isClay: false, radius: 1.8, phase: 0.5 },
      { nx: 0.83, ny: 0.48, isClay: false, radius: 2.0, phase: 0.8 },
      { nx: 0.92, ny: 0.46, isClay: false, radius: 1.8, phase: 1.1 },
      // Bottom arch (behind & below stats row)
      { nx: 0.35, ny: 0.86, isClay: false, radius: 1.6, phase: 0.3 },
      { nx: 0.52, ny: 0.84, isClay: true,  radius: 2.2, phase: 0.6 },
      { nx: 0.70, ny: 0.86, isClay: false, radius: 1.9, phase: 0.9 },
      { nx: 0.88, ny: 0.88, isClay: true,  radius: 2.2, phase: 1.2 },
      { nx: 0.60, ny: 0.95, isClay: false, radius: 1.7, phase: 1.5 },
    ];

    // ─── Data: constellation edges ───────────────────────────────────
    const constellationEdges: { from: number; to: number; isClay?: boolean }[] = [
      // Clay spine
      { from: 0, to: 1, isClay: true },
      { from: 1, to: 2, isClay: true },
      { from: 2, to: 3, isClay: true },
      // Upper canopy
      { from: 0, to: 4 }, { from: 4, to: 5 }, { from: 5, to: 6 },
      { from: 1, to: 5 }, { from: 2, to: 6 },
      // Middle arch
      { from: 0, to: 7 }, { from: 7, to: 8 }, { from: 8, to: 9 },
      { from: 1, to: 8 }, { from: 2, to: 9 },
      // Lower transition
      { from: 7, to: 10 }, { from: 10, to: 11 }, { from: 11, to: 12 },
      { from: 8, to: 11 }, { from: 9, to: 12 },
      // Flowing down to bottom
      { from: 10, to: 15 }, { from: 11, to: 16 },
      { from: 13, to: 14 }, { from: 14, to: 15 }, { from: 15, to: 16 },
      { from: 14, to: 17 }, { from: 15, to: 17 },
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
      { edgeIdx: 0,  progress: 0.1, speed: 0.007 },
      { edgeIdx: 1,  progress: 0.5, speed: 0.006 },
      { edgeIdx: 2,  progress: 0.3, speed: 0.008 },
      { edgeIdx: 4,  progress: 0.8, speed: 0.005 },
      { edgeIdx: 7,  progress: 0.4, speed: 0.006 },
      { edgeIdx: 13, progress: 0.2, speed: 0.005 },
      { edgeIdx: 16, progress: 0.6, speed: 0.007 },
    ];

    // ─── Main render ─────────────────────────────────────────────────
      // ── Ripple waves from mouse position ───────────────────────────────────
      const rippleCount = 3;
      for (let r = 0; r < rippleCount; r++) {
        const rippleTime = (time + r * 0.5) % 2;
        const rippleRadius = rippleTime * (prismSize * 3.5);
        const rippleAlpha = (1 - rippleTime / 2) * 0.15;

        ctx.save();
        ctx.strokeStyle = isDark 
          ? `rgba(248, 246, 240, ${rippleAlpha})` 
          : `rgba(22, 16, 12, ${rippleAlpha * 0.8})`;
        ctx.lineWidth = 1.0 * dpr;
        ctx.beginPath();
        ctx.arc(currentMouse.x, currentMouse.y, rippleRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }


    const render = () => {
      if (!isVisible) return; // truly stopped, not just skipping

      time += 0.016;
      const w = canvas.width;
      const h = canvas.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      // Smooth mouse lerping
      if (targetMouse.active) {
        currentMouse.x += (targetMouse.x * dpr - currentMouse.x) * 0.05;
        currentMouse.y += (targetMouse.y * dpr - currentMouse.y) * 0.05;
      } else {
        const idleX = w * 0.65;
        const idleY = h * 0.28 + Math.sin(time * 0.6) * (h * 0.03);
        currentMouse.x += (idleX - currentMouse.x) * 0.025;
        currentMouse.y += (idleY - currentMouse.y) * 0.025;
      }

      ctx.clearRect(0, 0, w, h);

      // ── Palette (brand tokens) ─────────────────────────────────────
      const beamGlow   = isDark ? "rgba(248,246,240,0.3)"  : "rgba(22,16,12,0.08)";
      const glassBdr   = isDark ? "rgba(248,246,240,0.35)" : "rgba(22,16,12,0.22)";
      const filament   = isDark ? "rgba(248,246,240,0.12)" : "rgba(22,16,12,0.09)";
      const clay       = isDark ? "#E67E54" : "#A8471B";
      const clayGlw    = isDark ? "rgba(230,126,84,0.4)"   : "rgba(168,71,27,0.22)";
      const starFill   = isDark ? "rgba(248,246,240,0.75)" : "rgba(22,16,12,0.65)";

      // ── Prism geometry ─────────────────────────────────────────────
      const isMobile   = w < 768 * dpr;
      const prismCX    = isMobile ? w * 0.74 : w * 0.70;
      const prismCY    = isMobile ? h * 0.26 : h * 0.32;
      const prismSize  = Math.min(w, h) * (isMobile ? 0.20 : 0.24);

      const topV  = { x: prismCX, y: prismCY - prismSize * 0.88 };
      const leftV = { x: prismCX - prismSize * 0.52, y: prismCY + prismSize * 0.58 };
      const rightV = { x: prismCX + prismSize * 0.52, y: prismCY + prismSize * 0.58 };

      // 1. Soft ambient radial bloom
      const bloom = ctx.createRadialGradient(prismCX, prismCY, 0, prismCX, prismCY, prismSize * 2.4);
      bloom.addColorStop(0,   isDark ? "rgba(230,126,84,0.09)"  : "rgba(168,71,27,0.05)");
      bloom.addColorStop(0.5, isDark ? "rgba(248,246,240,0.02)" : "rgba(22,16,12,0.015)");
      bloom.addColorStop(1, "transparent");
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(prismCX, prismCY, prismSize * 2.4, 0, Math.PI * 2);
      ctx.fill();

      // 2. Incident beam
      const raySpan = isMobile ? prismSize * 1.8 : prismSize * 2.6;
      const srcX = prismCX - raySpan;
      const srcY = prismCY - prismSize * 0.40 + (currentMouse.y - h * 0.3) * 0.15;
      const hitPt = {
        x: prismCX - prismSize * 0.26,
        y: prismCY - prismSize * 0.12 + (currentMouse.y - h * 0.3) * 0.08,
      };

      ctx.save();
      ctx.shadowColor = beamGlow;
      ctx.shadowBlur = 10 * dpr;

      const beamGrad = ctx.createLinearGradient(srcX, srcY, hitPt.x, hitPt.y);
      beamGrad.addColorStop(0,    "transparent");
      beamGrad.addColorStop(0.25, isDark ? "rgba(248,246,240,0.3)" : "rgba(22,16,12,0.2)");
      beamGrad.addColorStop(1,    isDark ? "rgba(248,246,240,0.85)" : "rgba(22,16,12,0.65)");
      ctx.strokeStyle = beamGrad;
      ctx.lineWidth = 1.4 * dpr;
      ctx.beginPath();
      ctx.moveTo(srcX, srcY);
      ctx.lineTo(hitPt.x, hitPt.y);
      ctx.stroke();

      // Photon on the incident beam
      const beamProg = (time * 0.6) % 1;
      ctx.fillStyle = isDark ? "#FFF" : clay;
      ctx.beginPath();
      ctx.arc(
        srcX + (hitPt.x - srcX) * beamProg,
        srcY + (hitPt.y - srcY) * beamProg,
        1.8 * dpr, 0, Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();

      // 3. Internal refraction paths
      const intUpper = { x: prismCX + prismSize * 0.18, y: prismCY - prismSize * 0.18 };
      const intLower = { x: prismCX + prismSize * 0.38, y: prismCY + prismSize * 0.22 };

      ctx.save();
      ctx.lineWidth = 1.0 * dpr;
      const refGrad = ctx.createLinearGradient(hitPt.x, hitPt.y, intLower.x, intLower.y);
      refGrad.addColorStop(0,   isDark ? "rgba(255,255,255,0.7)" : "rgba(22,16,12,0.45)");
      refGrad.addColorStop(0.5, isDark ? "rgba(230,126,84,0.6)"  : "rgba(168,71,27,0.4)");
      refGrad.addColorStop(1,   isDark ? "rgba(255,255,255,0.8)" : "rgba(22,16,12,0.6)");
      ctx.strokeStyle = refGrad;
      ctx.beginPath();
      ctx.moveTo(hitPt.x, hitPt.y);
      ctx.lineTo(intUpper.x, intUpper.y);
      ctx.moveTo(hitPt.x, hitPt.y);
      ctx.lineTo(intLower.x, intLower.y);
      ctx.stroke();
      ctx.restore();

      // 4. Chromatic dispersion fan (the Dark Side ribbon)
          const spectralBands = [
      { color: isDark ? "rgba(236, 72, 153, 0.70)" : "rgba(219, 39, 119, 0.55)",  angle: -0.22, width: 2.0 }, // pink
      { color: isDark ? "rgba(168, 85, 247, 0.65)" : "rgba(147, 51, 234, 0.50)",  angle: -0.16, width: 1.8 }, // purple
      { color: isDark ? "rgba(59, 130, 246, 0.60)" : "rgba(37, 99, 235, 0.45)",   angle: -0.10, width: 1.6 }, // blue
      { color: isDark ? "rgba(6, 182, 212, 0.65)" : "rgba(2, 132, 199, 0.50)",   angle: -0.05, width: 1.7 }, // cyan
      { color: isDark ? "rgba(230, 126, 84, 0.75)" : "rgba(168, 71, 27, 0.60)",   angle:  0.00, width: 2.0 }, // clay
      { color: isDark ? "rgba(245, 158, 11, 0.70)" : "rgba(217, 119, 6, 0.55)",   angle:  0.06, width: 1.8 }, // amber
      { color: isDark ? "rgba(239, 68, 68, 0.65)" : "rgba(220, 38, 38, 0.50)",   angle:  0.12, width: 1.6 }, // red
    ];

      const fanOX = prismCX + prismSize * 0.28;
      const fanOY = prismCY + prismSize * 0.04;

      // Continuous ribbon fills between bands
      for (let i = 0; i < spectralBands.length - 1; i++) {
        const b1 = spectralBands[i];
        const b2 = spectralBands[i + 1];
        const bend = (currentMouse.y / h - 0.25) * 0.1;
        const a1 = b1.angle + bend;
        const a2 = b2.angle + bend;
        const len = w * 0.42;

        const p1X = fanOX + Math.cos(a1) * len;
        const p1Y = fanOY + Math.sin(a1) * len;
        const p2X = fanOX + Math.cos(a2) * len;
        const p2Y = fanOY + Math.sin(a2) * len;

        const rg = ctx.createLinearGradient(fanOX, fanOY, p1X, p1Y);
        rg.addColorStop(0,   isDark ? "rgba(255,255,255,0.06)" : "rgba(22,16,12,0.03)");
        rg.addColorStop(0.5, b1.color);
        rg.addColorStop(1,   "transparent");

        ctx.save();
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.moveTo(fanOX, fanOY);
        ctx.lineTo(p1X, p1Y);
        ctx.lineTo(p2X, p2Y);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Crisp spectral rays
      for (const band of spectralBands) {
        const bend = (currentMouse.y / h - 0.25) * 0.1;
        const angle = band.angle + bend;
        const len = w * 0.45;
        const endX = fanOX + Math.cos(angle) * len;
        const endY = fanOY + Math.sin(angle) * len;

        const rg = ctx.createLinearGradient(fanOX, fanOY, endX, endY);
        rg.addColorStop(0,   band.color);
        rg.addColorStop(0.4, band.color);
        rg.addColorStop(0.9, "transparent");

        ctx.save();
        ctx.strokeStyle = rg;
        ctx.lineWidth = 1.3 * dpr;
        ctx.beginPath();
        ctx.moveTo(fanOX, fanOY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.restore();
      }

      // 5. Constellation filaments
      ctx.save();
      for (const edge of constellationEdges) {
        const p1 = constellationNodes[edge.from];
        const p2 = constellationNodes[edge.to];
        if (!p1 || !p2) continue;

        ctx.beginPath();
        ctx.moveTo(p1.nx * w, p1.ny * h);
        ctx.lineTo(p2.nx * w, p2.ny * h);

        if (edge.isClay) {
          ctx.strokeStyle = isDark ? "rgba(230,126,84,0.35)" : "rgba(168,71,27,0.25)";
          ctx.lineWidth = 1.2 * dpr;
        } else {
          ctx.strokeStyle = filament;
          ctx.lineWidth = 0.8 * dpr;
        }
        ctx.stroke();
      }
      ctx.restore();

      // 6. Traveling photons
      for (const photon of travelingPhotons) {
        photon.progress += photon.speed;
        if (photon.progress > 1) photon.progress = 0;

        const edge = constellationEdges[photon.edgeIdx];
        if (!edge) continue;
        const p1 = constellationNodes[edge.from];
        const p2 = constellationNodes[edge.to];
        if (!p1 || !p2) continue;

        const px = (p1.nx + (p2.nx - p1.nx) * photon.progress) * w;
        const py = (p1.ny + (p2.ny - p1.ny) * photon.progress) * h;

        ctx.save();
        ctx.fillStyle = edge.isClay ? clay : isDark ? "#FFF" : "#16100C";
        ctx.shadowColor = edge.isClay ? clayGlw : "rgba(255,255,255,0.4)";
        ctx.shadowBlur = 6 * dpr;
        ctx.beginPath();
        ctx.arc(px, py, 1.8 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 7. Constellation nodes
      for (const node of constellationNodes) {
        const nx = node.nx * w;
        const ny = node.ny * h;
        const pulse = Math.sin(time * 2.0 + node.phase) * 0.4 + 1.0;
        const r = node.radius * dpr * pulse;

        ctx.save();
        if (node.isClay) {
          ctx.fillStyle = clay;
          ctx.shadowColor = clayGlw;
          ctx.shadowBlur = 8 * dpr;
        } else {
          ctx.fillStyle = starFill;
          ctx.shadowColor = isDark ? "rgba(248,246,240,0.2)" : "rgba(22,16,12,0.08)";
          ctx.shadowBlur = 4 * dpr;
        }
        ctx.beginPath();
        ctx.arc(nx, ny, r, 0, Math.PI * 2);
        ctx.fill();

        if (node.isClay && node.radius > 2.5) {
          ctx.strokeStyle = isDark ? "rgba(230,126,84,0.4)" : "rgba(168,71,27,0.22)";
          ctx.lineWidth = 0.8 * dpr;
          ctx.beginPath();
          ctx.arc(nx, ny, r * 2.2, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 8. Atmospheric ambient dust motes
      for (const mote of ambientMotes) {
        mote.x += mote.vx;
        mote.y += mote.vy;
        if (mote.x < 0) mote.x = 1;
        if (mote.x > 1) mote.x = 0;
        if (mote.y < 0) mote.y = 1;
        if (mote.y > 1) mote.y = 0;

        ctx.fillStyle = isDark
          ? `rgba(248,246,240,${mote.alpha * 0.3})`
          : `rgba(22,16,12,${mote.alpha * 0.16})`;
        ctx.beginPath();
        ctx.arc(mote.x * w, mote.y * h, mote.size * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      // 9. Prism glass shell
      ctx.save();
      ctx.fillStyle = isDark ? "rgba(248,246,240,0.03)" : "rgba(22,16,12,0.02)";
      ctx.beginPath();
      ctx.moveTo(topV.x, topV.y);
      ctx.lineTo(leftV.x, leftV.y);
      ctx.lineTo(rightV.x, rightV.y);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = glassBdr;
      ctx.lineWidth = 1.4 * dpr;
      ctx.stroke();

      // Inner caustic line
      ctx.strokeStyle = isDark ? "rgba(248,246,240,0.15)" : "rgba(22,16,12,0.08)";
      ctx.lineWidth = 0.8 * dpr;
      ctx.beginPath();
      ctx.moveTo(topV.x, topV.y);
      ctx.lineTo(prismCX, prismCY + prismSize * 0.58);
      ctx.stroke();
      ctx.restore();

      animationId = requestAnimationFrame(render);
    };

    // Respect prefers-reduced-motion: render one static frame, then stop.
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      // Push mouse to idle so the static frame looks composed
      currentMouse.x = canvas.width * 0.65;
      currentMouse.y = canvas.height * 0.28;
      render(); // one frame
      cancelAnimationFrame(animationId);
    } else {
      animationId = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(animationId);
      resizeObs.disconnect();
      visObs.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
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
