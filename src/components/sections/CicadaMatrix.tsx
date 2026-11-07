import { useEffect, useRef } from "react";
import { CICADA_GRID_W, CICADA_GRID_H, CICADA_GRID_DATA } from "./cicadaGridData";

/**
 * CicadaMatrix — a "living object" character-matrix cicada.
 * Wing veins (intensity ≥8) shimmer, the body breathes (±0.5% scale), background
 * rain bends toward the pointer, and a tap fires a "chirp" brightness pulse.
 * Performance guards mirror HeroPrism: DPR cap, idle half-rate after 2.5s,
 * sleep after 20s of no interaction, visibilitychange pause, reduced-motion static frame.
 */
export function CicadaMatrix({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const style = getComputedStyle(document.documentElement);
    const ink = style.getPropertyValue("--ink").trim() || "#1c1917";
    const paper = style.getPropertyValue("--paper").trim() || "#faf7f0";

    const CHARS = "0123456789ABCDEF";
    let raf = 0;
    let w = 0,
      h = 0,
      tick = 0,
      frame = 0;
    let lastInteract = performance.now();
    let sleeping = false;
    const pointer = { x: -9999, y: -9999, active: false };
    const pulses: { t0: number }[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(10, rect.width);
      h = Math.max(10, rect.height);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const wake = () => {
      lastInteract = performance.now();
      if (sleeping) {
        sleeping = false;
        raf = requestAnimationFrame(render);
      }
    };

    const render = (now: number) => {
      raf = requestAnimationFrame(render);
      if (document.hidden) return;
      const idleFor = now - lastInteract;
      if (idleFor > 20_000 && pointer.active === false) {
        sleeping = true;
        cancelAnimationFrame(raf);
        return;
      }
      if (idleFor > 2_500 && frame++ & 1) return; // idle half-rate
      tick++;

      // synthetic drift on touch / no-pointer devices after 6s (HeroPrism convention)
      let px = pointer.x,
        py = pointer.y,
        pActive = pointer.active;
      if (!pActive && now - lastInteract > 6_000) {
        px = w / 2 + Math.sin(now * 0.0004) * w * 0.22;
        py = h / 2 + Math.cos(now * 0.00031) * h * 0.2;
        pActive = true;
      }

      ctx.fillStyle = ink;
      ctx.fillRect(0, 0, w, h);
      const cell = Math.max(7, Math.floor(Math.min(w / 88, h / 60)));
      ctx.font = `600 ${cell - 1}px Menlo, Monaco, Consolas, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // --- background rain: columns bend toward/away from pointer ---
      const cols = Math.floor(w / cell),
        rows = Math.floor(h / cell);
      for (let c = 0; c < cols; c++) {
        const speed = 0.6 + ((c * 7) % 5) * 0.18;
        const head = ((tick * speed + c * 13) % (rows + 8)) - 4;
        let bend = 0;
        if (pActive) {
          const dx = c * cell - px;
          bend = Math.max(-1.5, Math.min(1.5, -dx / 90)) * Math.exp(-Math.abs(dx) / 160);
        }
        for (let k = 0; k < 5; k++) {
          const r = Math.floor(head) - k;
          if (r < 0 || r >= rows) continue;
          const a = 0.16 - k * 0.03;
          ctx.fillStyle = k === 0 ? `rgba(52,211,153,${a + 0.08})` : `rgba(250,247,240,${a * 0.5})`;
          ctx.fillText(
            CHARS[(c * 31 + r * 7 + (tick >> 3)) % 16],
            c * cell + cell / 2 + bend * k * 2,
            r * cell + cell / 2,
          );
        }
      }

      // --- cicada body ---
      const breathe = reduced ? 1 : 1 + Math.sin(now * 0.0011) * 0.005;
      const sway = reduced ? 0 : Math.sin(now * 0.0006) * 3;
      const targetH = h * 0.92 * breathe,
        targetW = targetH * (CICADA_GRID_W / CICADA_GRID_H);
      const ox = (w - targetW) / 2 + sway,
        oy = (h - targetH) / 2;
      const tSec = now / 1000;

      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const x = c * cell + cell / 2,
            y = r * cell + cell / 2;
          const gx = Math.floor(((x - ox) / targetW) * CICADA_GRID_W);
          const gy = Math.floor(((y - oy) / targetH) * CICADA_GRID_H);
          if (gx < 0 || gx >= CICADA_GRID_W || gy < 0 || gy >= CICADA_GRID_H) continue;
          const idx = gy * CICADA_GRID_W + gx;
          const val = CICADA_GRID_DATA.charCodeAt(idx) - 48;
          if (val <= 0) continue;
          const edge =
            gx === 0 ||
            gy === 0 ||
            gx === CICADA_GRID_W - 1 ||
            gy === CICADA_GRID_H - 1 ||
            CICADA_GRID_DATA[idx - 1] === "0" ||
            CICADA_GRID_DATA[idx + 1] === "0" ||
            CICADA_GRID_DATA[idx - CICADA_GRID_W] === "0" ||
            CICADA_GRID_DATA[idx + CICADA_GRID_W] === "0";

          let boost = 0;
          if (val >= 8 && !reduced)
            boost += 0.22 * (0.5 + 0.5 * Math.sin(tSec * 3 + gx * 0.18 + gy * 0.11)); // wing shimmer
          if (pActive) {
            const d = Math.hypot(x - px, y - py);
            if (d < 110) boost += (1 - d / 110) * 0.45;
          }
          for (const p of pulses) {
            const age = (now - p.t0) / 700;
            if (age > 1) continue;
            const wave = Math.abs(Math.hypot(x - w / 2, y - h / 2) - age * Math.max(w, h) * 0.7);
            if (wave < 26) boost += (1 - wave / 26) * (1 - age) * 0.9;
          }
          const a = Math.min(1, 0.25 + (val / 9) * 0.65 + boost);
          ctx.fillStyle =
            edge || val >= 8
              ? `rgba(52,211,153,${a})`
              : val >= 5
                ? `rgba(250,247,240,${a * 0.9})`
                : `rgba(52,211,153,${a * 0.45})`;
          ctx.fillText(CHARS[(r * 31 + c * 17 + (tick >> 4)) % 16], x, y);
        }
      for (let i = pulses.length - 1; i >= 0; i--)
        if (now - pulses[i].t0 > 750) pulses.splice(i, 1);
      if (reduced) {
        cancelAnimationFrame(raf);
        return;
      }
    };
    raf = requestAnimationFrame(render);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.active = true;
      wake();
    };
    const onLeave = () => {
      pointer.active = false;
      lastInteract = performance.now();
    };
    const onTap = (e: PointerEvent) => {
      onMove(e);
      pulses.push({ t0: performance.now() });
      wake();
    };
    const onVis = () => {
      if (!document.hidden) wake();
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerdown", onTap);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onTap);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div className={`relative overflow-hidden rounded-xl border rule-hair bg-ink ${className}`}>
      <div className="flex items-center justify-between border-b rule-hair px-4 py-2.5 text-xs font-mono text-paper/70">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold tracking-wider text-paper">CICADA_EMERGENCE</span>
          <span className="hidden sm:inline text-paper/50">:: [17-YEAR CYCLE]</span>
        </span>
        <span className="text-emerald-400">LIVING OBJECT</span>
      </div>
      <div className="relative aspect-[4/3] w-full min-h-[360px] md:min-h-[480px]">
        <canvas
          ref={canvasRef}
          className="block h-full w-full cursor-crosshair touch-none select-none"
          aria-label="Interactive character-matrix cicada. Move to bend the rain, tap for a chirp pulse."
        />
        <div className="pointer-events-none absolute bottom-3 left-3 rounded border rule-hair bg-ink/80 px-2.5 py-1 text-[11px] font-mono text-paper/70">
          <span className="text-emerald-400">SYS_LOC:</span> 25.2048° N, 55.2708° E · UTC+4
        </div>
        <div className="pointer-events-none absolute bottom-3 right-3 text-[11px] font-mono text-paper/50">
          Hover to bend rain · Tap to chirp
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between border-t rule-hair px-4 py-2 text-[11px] font-mono text-paper/60">
        <span>IDENTITY: CICADA · WINGS FIRST</span>
        <span className="text-emerald-400">STATUS: EMERGED &amp; COMPILED</span>
      </div>
    </div>
  );
}
