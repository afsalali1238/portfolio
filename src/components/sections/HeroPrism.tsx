import { useEffect, useRef, useState } from "react";

export function HeroPrism() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modeNote, setModeNote] = useState("Beam active · Move cursor to refract");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let isVisible = true;
    let mouse = { x: -1000, y: -1000, active: false };
    let time = 0;

    // Detect dark mode from document class
    const isDark = () => document.documentElement.classList.contains("dark");

    // Sizing
    const handleResize = () => {
      const parent = containerRef.current;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Visibility observer to save battery
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(canvas);

    // Mouse listeners
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const onMouseLeave = () => {
      mouse.active = false;
    };

    const parentEl = containerRef.current;
    if (parentEl) {
      parentEl.addEventListener("mousemove", onMouseMove);
      parentEl.addEventListener("mouseleave", onMouseLeave);
    }

    // Seed constellation nodes relative to prism exit
    // Base layout defined on a 1000 x 400 normalized space
    const normalizedNodes: Array<{
      nx: number;
      ny: number;
      label?: string;
      isClay?: boolean;
      delay: number;
    }> = [
      // Primary Clay Branch (The build path)
      { nx: 0.52, ny: 0.44, label: "catalyst", isClay: true, delay: 0 },
      { nx: 0.62, ny: 0.38, label: "intent", isClay: true, delay: 0.2 },
      { nx: 0.74, ny: 0.32, label: "provia", isClay: true, delay: 0.4 },
      { nx: 0.88, ny: 0.26, label: "kinē", isClay: true, delay: 0.6 },
      { nx: 0.94, ny: 0.35, label: "0.24 Wh", isClay: true, delay: 0.8 },

      // Upper Dispersion Branch (Philosophy & curiosity)
      { nx: 0.54, ny: 0.32, delay: 0.1 },
      { nx: 0.66, ny: 0.22, label: "philosophy", delay: 0.3 },
      { nx: 0.79, ny: 0.16, label: "curiosity", delay: 0.5 },
      { nx: 0.92, ny: 0.12, label: "enlightenment", delay: 0.7 },

      // Middle Mesh (Connection & synthesis)
      { nx: 0.56, ny: 0.54, delay: 0.2 },
      { nx: 0.68, ny: 0.5, label: "software", delay: 0.35 },
      { nx: 0.78, ny: 0.48, label: "network", delay: 0.55 },
      { nx: 0.89, ny: 0.52, label: "outcomes", delay: 0.75 },

      // Lower Dispersion Branch (Community & people)
      { nx: 0.54, ny: 0.68, delay: 0.15 },
      { nx: 0.64, ny: 0.74, label: "nxtdoor", delay: 0.4 },
      { nx: 0.76, ny: 0.82, label: "whatsapp os", delay: 0.6 },
      { nx: 0.9, ny: 0.86, label: "people", delay: 0.85 },

      // Cross-linking constellation anchors
      { nx: 0.72, ny: 0.62, delay: 0.5 },
      { nx: 0.83, ny: 0.68, delay: 0.65 },
      { nx: 0.82, ny: 0.38, delay: 0.7 },
    ];

    // Connectivity graph between indices
    const edgesList: Array<{ from: number; to: number; isClay?: boolean }> = [
      // Clay spine
      { from: 0, to: 1, isClay: true },
      { from: 1, to: 2, isClay: true },
      { from: 2, to: 3, isClay: true },
      { from: 3, to: 4, isClay: true },

      // Upper spine
      { from: 0, to: 5 },
      { from: 5, to: 6 },
      { from: 6, to: 7 },
      { from: 7, to: 8 },

      // Middle spine
      { from: 0, to: 9 },
      { from: 9, to: 10 },
      { from: 10, to: 11 },
      { from: 11, to: 12 },

      // Lower spine
      { from: 0, to: 13 },
      { from: 13, to: 14 },
      { from: 14, to: 15 },
      { from: 15, to: 16 },

      // Cross-mesh connecting lines (forming the bigger picture)
      { from: 1, to: 5 },
      { from: 2, to: 6 },
      { from: 2, to: 10 },
      { from: 3, to: 19 },
      { from: 19, to: 11 },
      { from: 9, to: 13 },
      { from: 10, to: 17 },
      { from: 17, to: 14 },
      { from: 11, to: 18 },
      { from: 18, to: 15 },
      { from: 12, to: 16 },
      { from: 4, to: 12 },
    ];

    // Floating ambient dust motes
    const motes = Array.from({ length: 24 }, () => ({
      x: Math.random(),
      y: Math.random(),
      speed: 0.0003 + Math.random() * 0.0008,
      size: 0.8 + Math.random() * 1.6,
      alpha: 0.1 + Math.random() * 0.4,
    }));

    // Animation Render Loop
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

      ctx.clearRect(0, 0, width, height);

      // Colors
      const inkColor = dark ? "#F8F6F0" : "#16100C";
      const inkMute = dark ? "rgba(248, 246, 240, 0.35)" : "rgba(22, 16, 12, 0.38)";
      const hairRule = dark ? "rgba(248, 246, 240, 0.12)" : "rgba(22, 16, 12, 0.1)";
      const clayColor = dark ? "#E67E54" : "#A8471B";
      const glowClay = dark ? "rgba(230, 126, 84, 0.3)" : "rgba(168, 71, 27, 0.25)";

      // Prism Coordinates
      const prismCenterX = width * 0.38;
      const prismCenterY = height * 0.5;
      const prismSize = Math.min(width, height) * 0.28;

      // Prism Vertices (Triangular Diamond)
      const topVertex = { x: prismCenterX, y: prismCenterY - prismSize * 0.85 };
      const leftVertex = { x: prismCenterX - prismSize * 0.55, y: prismCenterY + prismSize * 0.65 };
      const rightVertex = {
        x: prismCenterX + prismSize * 0.55,
        y: prismCenterY + prismSize * 0.65,
      };

      // Incident ray: source from the left edge
      const targetRayY = mouse.active
        ? mouse.y * dpr
        : prismCenterY + Math.sin(time * 0.8) * (height * 0.08);

      const sourceY = prismCenterY + (targetRayY - prismCenterY) * 0.65;
      const hitPoint = {
        x: prismCenterX - prismSize * 0.25,
        y: prismCenterY - prismSize * 0.15 + (targetRayY - prismCenterY) * 0.3,
      };

      // 1. Draw subtle background coordinate grid
      ctx.strokeStyle = hairRule;
      ctx.lineWidth = 1;
      const gridStep = 40 * dpr;
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

      // 2. The Wall / Seam (Vertical dividing line at the prism)
      ctx.save();
      ctx.setLineDash([4 * dpr, 6 * dpr]);
      ctx.strokeStyle = hairRule;
      ctx.beginPath();
      ctx.moveTo(prismCenterX, 0);
      ctx.lineTo(prismCenterX, height);
      ctx.stroke();
      ctx.restore();

      // Wall labels
      ctx.fillStyle = inkMute;
      ctx.font = `${9 * dpr}px monospace`;
      ctx.textAlign = "right";
      ctx.fillText("IDEA / PHILOSOPHY", prismCenterX - 12 * dpr, 20 * dpr);
      ctx.textAlign = "left";
      ctx.fillText("BUILT / COMPLEXITY", prismCenterX + 12 * dpr, 20 * dpr);

      // 3. Incident Ray (A single beam of pure curiosity)
      ctx.save();
      // Ray glow
      ctx.shadowColor = dark ? "rgba(255, 255, 255, 0.4)" : "rgba(22, 16, 12, 0.2)";
      ctx.shadowBlur = 8 * dpr;
      ctx.strokeStyle = inkColor;
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.moveTo(0, sourceY);
      ctx.lineTo(hitPoint.x, hitPoint.y);
      ctx.stroke();
      ctx.restore();

      // Source label
      ctx.fillStyle = inkMute;
      ctx.font = `${8 * dpr}px monospace`;
      ctx.textAlign = "left";
      ctx.fillText("Curiosity (Raw beam)", 12 * dpr, sourceY - 8 * dpr);

      // 4. Prism Body
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(topVertex.x, topVertex.y);
      ctx.lineTo(rightVertex.x, rightVertex.y);
      ctx.lineTo(leftVertex.x, leftVertex.y);
      ctx.closePath();

      // Prism glass fill
      const glassGrad = ctx.createLinearGradient(
        leftVertex.x,
        topVertex.y,
        rightVertex.x,
        rightVertex.y,
      );
      glassGrad.addColorStop(0, dark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.03)");
      glassGrad.addColorStop(0.5, dark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)");
      glassGrad.addColorStop(1, dark ? "rgba(230, 126, 84, 0.12)" : "rgba(168, 71, 27, 0.08)");
      ctx.fillStyle = glassGrad;
      ctx.fill();

      // Prism edges
      ctx.strokeStyle = dark ? "rgba(255, 255, 255, 0.35)" : "rgba(22, 16, 12, 0.35)";
      ctx.lineWidth = 1.5 * dpr;
      ctx.stroke();

      // Internal refraction lines
      const exitPointClay = {
        x: prismCenterX + prismSize * 0.32,
        y: prismCenterY + (hitPoint.y - prismCenterY) * 0.4,
      };
      const exitPointUpper = { x: prismCenterX + prismSize * 0.28, y: exitPointClay.y - 18 * dpr };
      const exitPointLower = { x: prismCenterX + prismSize * 0.28, y: exitPointClay.y + 18 * dpr };

      ctx.strokeStyle = hairRule;
      ctx.beginPath();
      ctx.moveTo(hitPoint.x, hitPoint.y);
      ctx.lineTo(exitPointUpper.x, exitPointUpper.y);
      ctx.moveTo(hitPoint.x, hitPoint.y);
      ctx.lineTo(exitPointClay.x, exitPointClay.y);
      ctx.moveTo(hitPoint.x, hitPoint.y);
      ctx.lineTo(exitPointLower.x, exitPointLower.y);
      ctx.stroke();

      ctx.restore();

      // 5. Emerging Refracted Light Bands
      const dispersionColors = [
        dark ? "rgba(200, 210, 230, 0.25)" : "rgba(60, 70, 90, 0.18)",
        dark ? "rgba(230, 126, 84, 0.45)" : "rgba(168, 71, 27, 0.35)", // clay
        dark ? "rgba(240, 220, 160, 0.25)" : "rgba(130, 110, 50, 0.18)",
        dark ? "rgba(180, 220, 210, 0.25)" : "rgba(40, 110, 100, 0.18)",
      ];

      dispersionColors.forEach((col, i) => {
        const spreadY = (i - 1.5) * (height * 0.28);
        ctx.save();
        ctx.strokeStyle = col;
        ctx.lineWidth = (i === 1 ? 1.8 : 1) * dpr;
        ctx.beginPath();
        ctx.moveTo(exitPointClay.x, exitPointClay.y);
        ctx.lineTo(width, exitPointClay.y + spreadY + Math.sin(time + i) * 6 * dpr);
        ctx.stroke();
        ctx.restore();
      });

      // 6. Constellation Nodes & Connecting Threads
      // Calculate current world coordinates of normalized nodes
      const currentNodes = normalizedNodes.map((n, idx) => {
        const pulse = Math.sin(time * 2 + n.delay * 5) * 0.2 + 0.8;
        const driftX = Math.cos(time * 0.7 + idx) * 3 * dpr;
        const driftY = Math.sin(time * 0.7 + idx) * 3 * dpr;

        // Interaction magnet
        let mx = 0;
        let my = 0;
        if (mouse.active) {
          const dx = mouse.x * dpr - (n.nx * width + driftX);
          const dy = mouse.y * dpr - (n.ny * height + driftY);
          const dist = Math.hypot(dx, dy);
          if (dist < 120 * dpr && dist > 0) {
            const pull = (1 - dist / (120 * dpr)) * 12 * dpr;
            mx = (dx / dist) * pull;
            my = (dy / dist) * pull;
          }
        }

        return {
          x: n.nx * width + driftX + mx,
          y: n.ny * height + driftY + my,
          radius: (n.isClay ? 3.5 : 2.5) * dpr,
          label: n.label,
          isClay: n.isClay,
          pulse,
        };
      });

      // Draw Edges (Connecting threads between dots)
      edgesList.forEach((edge) => {
        const p1 = currentNodes[edge.from];
        const p2 = currentNodes[edge.to];
        if (!p1 || !p2) return;

        ctx.save();
        if (edge.isClay) {
          ctx.strokeStyle = clayColor;
          ctx.lineWidth = 1.6 * dpr;
          ctx.shadowColor = glowClay;
          ctx.shadowBlur = 6 * dpr;
        } else {
          ctx.strokeStyle = dark ? "rgba(248, 246, 240, 0.22)" : "rgba(22, 16, 12, 0.2)";
          ctx.lineWidth = 1 * dpr;
        }

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.restore();
      });

      // Draw Nodes (The Dots)
      currentNodes.forEach((node) => {
        ctx.save();
        if (node.isClay) {
          ctx.fillStyle = clayColor;
          ctx.shadowColor = glowClay;
          ctx.shadowBlur = 8 * dpr;
        } else {
          ctx.fillStyle = inkColor;
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * node.pulse, 0, Math.PI * 2);
        ctx.fill();

        // Node halo
        if (node.isClay) {
          ctx.strokeStyle = clayColor;
          ctx.lineWidth = 0.8 * dpr;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * 2.2 * node.pulse, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Editorial Label
        if (node.label) {
          ctx.fillStyle = node.isClay ? clayColor : inkMute;
          ctx.font = `${8.5 * dpr}px monospace`;
          ctx.textAlign = "left";
          ctx.fillText(node.label, node.x + 8 * dpr, node.y + 3 * dpr);
        }
        ctx.restore();
      });

      // 7. Ambient dust motes floating through the beam
      motes.forEach((mote) => {
        mote.x += mote.speed;
        if (mote.x > 1) mote.x = 0;
        const mx = mote.x * width;
        const my = mote.y * height;

        ctx.fillStyle = dark
          ? `rgba(248, 246, 240, ${mote.alpha})`
          : `rgba(22, 16, 12, ${mote.alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(mx, my, mote.size * dpr, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      if (parentEl) {
        parentEl.removeEventListener("mousemove", onMouseMove);
        parentEl.removeEventListener("mouseleave", onMouseLeave);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => {
        setModeNote("Refraction tracking pointer");
      }}
      onMouseLeave={() => {
        setModeNote("Beam active · Move cursor to refract");
      }}
      className="group relative my-10 overflow-hidden rounded-xl border rule-hair bg-paper-deep/40 shadow-xs transition-colors hover:border-ink/30"
      aria-label="Interactive Pink Floyd-inspired prism: a single ray of curiosity hitting the AI threshold and refracting into an interconnected constellation of software and ideas."
    >
      {/* Canvas Viewport */}
      <div className="relative h-64 w-full sm:h-80 md:h-96">
        <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full cursor-crosshair" />
      </div>

      {/* Editorial Plate Header & Footer */}
      <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-ink-mute">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-ink" />
        <span>
          Fig. 01 — The Prism of Synthesis · Pink Floyd Dark Side &amp; The Wall reference
        </span>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-4 right-4 flex items-center justify-between font-mono text-[10px] text-ink-mute">
        <span>Curiosity in → Threshold → Connected constellation</span>
        <span className="hidden sm:inline-block">{modeNote}</span>
      </div>
    </div>
  );
}
