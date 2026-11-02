/**
 * dom-interaction.mts — automated DOM & React lifecycle tests for HeroPrism + hero-layout.
 *
 * Exercises the real `HeroPrism` React component and `shouldIgnoreHeroPointerTarget` inside a
 * headless DOM (`happy-dom`) backed by `@napi-rs/canvas` 2D contexts:
 *   1. Interactive target filtering (links, buttons, inputs, selects, textareas, labels,
 *      details/summary, contenteditable, ARIA widgets, tabindex, [data-hero-control], and
 *      elements outside `<section data-hero>` such as sticky headers / backdrops).
 *   2. Mouse primary click placement, right/ctrl-click rejection, prism-click & dblclick reset.
 *   3. Touch tap placement vs touch scroll-drag (>10px) cancellation & double-tap reset.
 *   4. Keyboard / assistive `controlRef` preset cycling (`left -> base -> right -> rest`).
 *   5. `prefers-reduced-motion: reduce`: zero rAF scheduled on mount, static still painted,
 *      pointer/scroll/preset interactions ignored, and live media-query toggle cancels rAF.
 */
import assert from "node:assert/strict";
import { createCanvas } from "@napi-rs/canvas";
import { Window } from "happy-dom";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { shouldIgnoreHeroPointerTarget } from "../../src/components/sections/hero-layout.ts";
import {
  HeroPrism,
  type HeroPrismControl,
  type HeroSourceMode,
} from "../../src/components/sections/HeroPrism.tsx";
import type { HeroRay } from "../../src/components/sections/hero-ray.ts";

// React 19 act() environment flag
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let failures = 0;
const runCheck = async (name: string, fn: () => void | Promise<void>) => {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failures += 1;
    console.log(`  ✗ ${name}\n      ${(error as Error).stack ?? (error as Error).message}`);
  }
};

type EnvOptions = { reducedMotion?: boolean; width?: number; height?: number };

function installDomEnv(opts: EnvOptions = {}) {
  const width = opts.width ?? 1440;
  const height = opts.height ?? 720;
  const win = new Window({ url: "http://localhost:3000/?heroDebug=1", width, height });

  let reduced = Boolean(opts.reducedMotion);
  const motionListeners = new Set<(e: { matches: boolean }) => void>();
  const hoverListeners = new Set<(e: { matches: boolean }) => void>();

  let nextRafId = 1;
  let rafCount = 0;
  const rafCallbacks = new Map<number, (ts: number) => void>();

  win.requestAnimationFrame = ((cb: (ts: number) => void) => {
    rafCount += 1;
    const id = nextRafId++;
    rafCallbacks.set(id, cb);
    return id;
  }) as unknown as typeof win.requestAnimationFrame;

  win.cancelAnimationFrame = ((id: number) => {
    rafCallbacks.delete(id);
  }) as unknown as typeof win.cancelAnimationFrame;

  win.matchMedia = ((query: string) => {
    if (query.includes("prefers-reduced-motion")) {
      return {
        media: query,
        get matches() {
          return reduced;
        },
        addEventListener: (_: string, fn: (e: { matches: boolean }) => void) =>
          motionListeners.add(fn),
        removeEventListener: (_: string, fn: (e: { matches: boolean }) => void) =>
          motionListeners.delete(fn),
      };
    }
    return {
      media: query,
      matches: true,
      addEventListener: (_: string, fn: (e: { matches: boolean }) => void) =>
        hoverListeners.add(fn),
      removeEventListener: (_: string, fn: (e: { matches: boolean }) => void) =>
        hoverListeners.delete(fn),
    };
  }) as unknown as typeof win.matchMedia;

  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  class MockIntersectionObserver {
    private cb: (entries: { isIntersecting: boolean }[]) => void;
    constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
      this.cb = cb;
    }
    observe() {
      this.cb([{ isIntersecting: true }]);
    }
    unobserve() {}
    disconnect() {}
  }

  const canvasBacking = new WeakMap<object, ReturnType<typeof createCanvas>>();
  const origCreateElement = win.document.createElement.bind(win.document);
  const patchCanvas = (el: HTMLElement) => {
    let w = width;
    let h = height;
    const getBacking = () => {
      let c = canvasBacking.get(el);
      if (!c) {
        c = createCanvas(Math.max(1, w), Math.max(1, h));
        canvasBacking.set(el, c);
      }
      return c;
    };
    Object.defineProperty(el, "width", {
      get: () => w,
      set: (next: number) => {
        w = Math.max(1, Math.round(next));
        const c = getBacking();
        c.width = w;
      },
      configurable: true,
    });
    Object.defineProperty(el, "height", {
      get: () => h,
      set: (next: number) => {
        h = Math.max(1, Math.round(next));
        const c = getBacking();
        c.height = h;
      },
      configurable: true,
    });
    (el as unknown as HTMLCanvasElement).getContext = ((type: string) => {
      if (type !== "2d") return null;
      const ctx = getBacking().getContext("2d");
      if (!(ctx as unknown as { __patchedDrawImage?: boolean }).__patchedDrawImage) {
        const origDraw = ctx.drawImage.bind(ctx);
        (ctx as unknown as { drawImage: (...args: unknown[]) => void }).drawImage = (
          img: unknown,
          ...rest: unknown[]
        ) => {
          const resolved = img && typeof img === "object" ? (canvasBacking.get(img) ?? img) : img;
          return (origDraw as (...a: unknown[]) => void)(resolved, ...rest);
        };
        (ctx as unknown as { __patchedDrawImage?: boolean }).__patchedDrawImage = true;
      }
      return ctx;
    }) as unknown as HTMLCanvasElement["getContext"];
  };

  win.document.createElement = ((tag: string, options?: unknown) => {
    const el = origCreateElement(tag, options as never) as unknown as HTMLElement;
    if (String(tag).toLowerCase() === "canvas") patchCanvas(el);
    return el as never;
  }) as typeof win.document.createElement;

  Object.assign(globalThis, {
    window: win,
    document: win.document,
    Element: win.Element,
    HTMLElement: win.HTMLElement,
    Node: win.Node,
    Event: win.Event,
    MouseEvent: win.MouseEvent,
    PointerEvent: win.PointerEvent ?? win.MouseEvent,
    MutationObserver: win.MutationObserver,
    ResizeObserver: MockResizeObserver,
    IntersectionObserver: MockIntersectionObserver,
    requestAnimationFrame: win.requestAnimationFrame,
    cancelAnimationFrame: win.cancelAnimationFrame,
  });

  // Build realistic hero shell + sticky header sibling outside [data-hero]
  const header = win.document.createElement("header");
  header.innerHTML = `<a id="nav-link" href="/works">Works</a><div id="menu-backdrop" role="button" tabindex="0"></div>`;
  win.document.body.appendChild(header);

  const hero = win.document.createElement("section");
  hero.setAttribute("data-hero", "");
  hero.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      width,
      height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as unknown as DOMRect;

  const copy = win.document.createElement("div");
  copy.setAttribute("data-hero-copy", "");
  copy.innerHTML = `
    <h1 id="hero-heading"><span>For the tech.</span><span data-hero-thesis>Not because anyone asked.</span></h1>
    <p id="hero-lede">Documenting what happens when the wall disappears.</p>
    <div>
      <a id="cta-link" href="/works"><span>See the builds</span></a>
      <button id="cta-btn" type="button">Action</button>
      <input id="form-input" type="text" />
      <select id="form-select"><option>One</option></select>
      <textarea id="form-textarea"></textarea>
      <label id="form-label" for="form-input">Label</label>
      <details id="form-details"><summary id="form-summary">More</summary></details>
      <div id="editable-note" contenteditable="true">Editable</div>
      <div id="aria-switch" role="switch" aria-checked="false">Toggle</div>
      <div id="focusable-box" tabindex="0">Focusable</div>
      <button id="prism-cycle" type="button" data-hero-control="cycle-light">Aim light</button>
    </div>
  `;
  hero.appendChild(copy);

  const mountPoint = win.document.createElement("div");
  hero.appendChild(mountPoint);
  win.document.body.appendChild(hero);

  let nowMs = 10_000;
  const origNow = performance.now.bind(performance);
  performance.now = () => nowMs;

  const stepFrames = (count: number, dt = 16) => {
    for (let i = 0; i < count; i++) {
      nowMs += dt;
      const pending = [...rafCallbacks.entries()];
      rafCallbacks.clear();
      for (const [, cb] of pending) cb(nowMs);
    }
  };

  const setReducedMotion = (next: boolean) => {
    reduced = next;
    for (const fn of motionListeners) fn({ matches: next });
  };

  const getRay = () => (win as unknown as { __heroRay?: HeroRay }).__heroRay ?? null;

  const getCanvasData = () => {
    const canvasEl = mountPoint.querySelector("canvas");
    const backing = canvasEl ? canvasBacking.get(canvasEl) : undefined;
    return backing ? backing.data() : null;
  };

  const cleanup = () => {
    performance.now = origNow;
    win.close();
  };

  return {
    win,
    hero: hero as unknown as HTMLElement,
    mountPoint: mountPoint as unknown as HTMLElement,
    get rafCount() {
      return rafCount;
    },
    get activeRafs() {
      return rafCallbacks.size;
    },
    advanceClock(ms: number) {
      nowMs += ms;
    },
    stepFrames,
    setReducedMotion,
    getRay,
    getCanvasData,
    cleanup,
  };
}

function dispatchPointer(
  target: EventTarget,
  type: string,
  init: {
    clientX: number;
    clientY: number;
    button?: number;
    ctrlKey?: boolean;
    pointerType?: string;
    pointerId?: number;
    isPrimary?: boolean;
  },
) {
  const Ctor = (globalThis.PointerEvent ?? globalThis.MouseEvent) as typeof MouseEvent;
  const ev = new Ctor(type, {
    bubbles: true,
    cancelable: true,
    clientX: init.clientX,
    clientY: init.clientY,
    button: init.button ?? 0,
    ctrlKey: init.ctrlKey ?? false,
  });
  Object.defineProperty(ev, "pointerType", { value: init.pointerType ?? "mouse" });
  Object.defineProperty(ev, "pointerId", { value: init.pointerId ?? 1 });
  Object.defineProperty(ev, "isPrimary", { value: init.isPrimary ?? true });
  (target as HTMLElement).dispatchEvent(ev);
}

console.log("\nDOM & React HeroPrism interaction checks");

await runCheck("shouldIgnoreHeroPointerTarget filters controls and outside-hero overlays", () => {
  const env = installDomEnv();
  try {
    const { win, hero } = env;
    const doc = win.document;

    // Non-interactive hero surfaces are allowed
    assert.equal(shouldIgnoreHeroPointerTarget(hero, hero), false);
    assert.equal(shouldIgnoreHeroPointerTarget(doc.getElementById("hero-heading"), hero), false);
    assert.equal(shouldIgnoreHeroPointerTarget(doc.getElementById("hero-lede"), hero), false);

    // Every interactive/editable element inside the hero is ignored
    for (const id of [
      "cta-link",
      "cta-btn",
      "form-input",
      "form-select",
      "form-textarea",
      "form-label",
      "form-summary",
      "form-details",
      "editable-note",
      "aria-switch",
      "focusable-box",
      "prism-cycle",
    ]) {
      const el = doc.getElementById(id);
      assert.ok(el, `missing #${id}`);
      assert.equal(
        shouldIgnoreHeroPointerTarget(el as unknown as EventTarget, hero),
        true,
        `expected #${id} to be ignored`,
      );
    }

    // Nested child inside a link is also ignored
    const linkSpan = doc.querySelector("#cta-link span");
    assert.equal(shouldIgnoreHeroPointerTarget(linkSpan as unknown as EventTarget, hero), true);

    // Elements outside <section data-hero> (sticky header, drawer backdrop, null) are ignored
    assert.equal(
      shouldIgnoreHeroPointerTarget(doc.getElementById("nav-link") as unknown as EventTarget, hero),
      true,
    );
    assert.equal(
      shouldIgnoreHeroPointerTarget(
        doc.getElementById("menu-backdrop") as unknown as EventTarget,
        hero,
      ),
      true,
    );
    assert.equal(shouldIgnoreHeroPointerTarget(null, hero), true);
  } finally {
    env.cleanup();
  }
});

await runCheck(
  "mounted HeroPrism: mouse click pins, controls/header are ignored, dblclick & prism click reset",
  async () => {
    const env = installDomEnv();
    const controlRef: { current: HeroPrismControl | null } = { current: null };
    const modes: HeroSourceMode[] = [];
    const root = createRoot(env.mountPoint);
    try {
      await act(async () => {
        root.render(
          React.createElement(HeroPrism, {
            controlRef,
            onSourceModeChange: (m) => modes.push(m),
          }),
        );
      });
      env.stepFrames(2, 16);
      const ray = env.getRay();
      assert.ok(ray, "expected debug __heroRay instance");
      assert.equal(ray.isSourcePinned(), false);

      // Clicking controls or sticky header at hero coordinates must NOT pin a source
      for (const id of [
        "cta-link",
        "cta-btn",
        "form-input",
        "form-select",
        "form-textarea",
        "editable-note",
        "aria-switch",
        "prism-cycle",
        "nav-link",
      ]) {
        const el = env.win.document.getElementById(id)!;
        await act(async () => {
          dispatchPointer(el as unknown as EventTarget, "pointerdown", {
            clientX: 140,
            clientY: 420,
          });
        });
        assert.equal(ray.isSourcePinned(), false, `click on #${id} must not pin source`);
      }

      // Secondary button & ctrl+click must NOT pin a source
      await act(async () => {
        dispatchPointer(env.hero, "pointerdown", { clientX: 140, clientY: 420, button: 2 });
        dispatchPointer(env.hero, "pointerdown", {
          clientX: 140,
          clientY: 420,
          button: 0,
          ctrlKey: true,
        });
      });
      assert.equal(ray.isSourcePinned(), false);

      // Primary click on hero whitespace pins the source
      await act(async () => {
        dispatchPointer(env.hero, "pointerdown", { clientX: 140, clientY: 420, button: 0 });
      });
      assert.equal(ray.isSourcePinned(), true);
      assert.equal(modes[modes.length - 1], "custom");
      env.stepFrames(8, 16);
      assert.deepEqual(ray.beamAxisAt(0), { x: 140, y: 420 });

      // Double-click on whitespace resets the source
      await act(async () => {
        const dbl = new env.win.MouseEvent("dblclick", {
          bubbles: true,
          clientX: 200,
          clientY: 300,
        });
        (env.hero as unknown as EventTarget).dispatchEvent(dbl as unknown as Event);
      });
      env.stepFrames(8, 16);
      assert.equal(ray.isSourcePinned(), false);
      assert.equal(modes[modes.length - 1], "rest");

      // Keyboard / assistive controlRef cycles left -> base -> right -> rest
      assert.ok(controlRef.current, "expected controlRef handle");
      const seenPresets: HeroSourceMode[] = [];
      for (let i = 0; i < 4; i++) {
        await act(async () => {
          seenPresets.push(controlRef.current!.cyclePreset());
        });
        env.stepFrames(8, 16);
      }
      assert.deepEqual(seenPresets, ["left", "base", "right", "rest"]);
      assert.equal(ray.isSourcePinned(), false);
    } finally {
      await act(async () => root.unmount());
      env.cleanup();
    }
  },
);

await runCheck(
  "mounted HeroPrism: touch scroll drag cancels tap, clean tap pins, double-tap resets",
  async () => {
    const env = installDomEnv({ width: 390, height: 697 });
    const root = createRoot(env.mountPoint);
    try {
      await act(async () => {
        root.render(React.createElement(HeroPrism));
      });
      env.stepFrames(2, 16);
      const ray = env.getRay()!;

      // 1. Touch swipe (>10px vertical travel) must NOT place a source
      await act(async () => {
        dispatchPointer(env.hero, "pointerdown", {
          clientX: 120,
          clientY: 460,
          pointerType: "touch",
          pointerId: 7,
        });
        dispatchPointer(env.hero, "pointermove", {
          clientX: 122,
          clientY: 420,
          pointerType: "touch",
          pointerId: 7,
        });
        dispatchPointer(env.hero, "pointerup", {
          clientX: 122,
          clientY: 420,
          pointerType: "touch",
          pointerId: 7,
        });
      });
      assert.equal(ray.isSourcePinned(), false, "touch scroll drag must not pin source");

      // 2. Clean tap (<10px movement) pins the source on pointerup
      env.advanceClock(500);
      await act(async () => {
        dispatchPointer(env.hero, "pointerdown", {
          clientX: 90,
          clientY: 320,
          pointerType: "touch",
          pointerId: 8,
        });
        dispatchPointer(env.hero, "pointermove", {
          clientX: 92,
          clientY: 322,
          pointerType: "touch",
          pointerId: 8,
        });
        dispatchPointer(env.hero, "pointerup", {
          clientX: 92,
          clientY: 322,
          pointerType: "touch",
          pointerId: 8,
        });
      });
      assert.equal(ray.isSourcePinned(), true, "clean touch tap should pin source");
      env.stepFrames(8, 16);
      assert.deepEqual(ray.beamAxisAt(0), { x: 92, y: 322 });

      // 3. Second tap within DOUBLE_TAP_MS resets the source
      env.advanceClock(140);
      await act(async () => {
        dispatchPointer(env.hero, "pointerdown", {
          clientX: 94,
          clientY: 320,
          pointerType: "touch",
          pointerId: 9,
        });
        dispatchPointer(env.hero, "pointerup", {
          clientX: 94,
          clientY: 320,
          pointerType: "touch",
          pointerId: 9,
        });
      });
      env.stepFrames(8, 16);
      assert.equal(ray.isSourcePinned(), false, "double-tap should reset source");
    } finally {
      await act(async () => root.unmount());
      env.cleanup();
    }
  },
);

await runCheck(
  "prefers-reduced-motion: zero rAF scheduled, static still painted, live toggle cancels loop",
  async () => {
    const env = installDomEnv({ reducedMotion: true });
    const controlRef: { current: HeroPrismControl | null } = { current: null };
    const root = createRoot(env.mountPoint);
    try {
      await act(async () => {
        root.render(React.createElement(HeroPrism, { controlRef }));
      });
      assert.equal(
        env.rafCount,
        0,
        `expected 0 rAF calls under reduced motion, got ${env.rafCount}`,
      );
      assert.equal(
        env.hero.dataset.heroPainted,
        "",
        "expected static still to mark data-hero-painted",
      );

      const data = env.getCanvasData();
      assert.ok(data, "expected painted backing canvas");
      let nonEmpty = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 4) nonEmpty += 1;
      assert.ok(nonEmpty > 500, `expected static still pixels, got ${nonEmpty}`);

      // Clicks & preset triggers are no-ops under reduced motion
      const ray = env.getRay()!;
      await act(async () => {
        dispatchPointer(env.hero, "pointerdown", { clientX: 160, clientY: 400 });
        controlRef.current?.cyclePreset();
      });
      assert.equal(ray.isSourcePinned(), false);
      assert.equal(env.rafCount, 0);

      // Enabling motion starts rAF; toggling reduced-motion back on cancels rAF & resets pinned state
      await act(async () => {
        env.setReducedMotion(false);
      });
      assert.ok(env.activeRafs > 0, "expected rAF loop when motion preference clears");
      await act(async () => {
        dispatchPointer(env.hero, "pointerdown", { clientX: 160, clientY: 400 });
      });
      env.stepFrames(6, 16);
      assert.equal(ray.isSourcePinned(), true);

      await act(async () => {
        env.setReducedMotion(true);
      });
      assert.equal(
        env.activeRafs,
        0,
        "expected 0 active rAF callbacks after re-enabling reduced motion",
      );
      assert.equal(ray.isSourcePinned(), false, "reduced motion still must clear pinned source");
    } finally {
      await act(async () => root.unmount());
      env.cleanup();
    }
  },
);

if (failures > 0) {
  console.error(`\n${failures} DOM interaction check(s) failed.`);
  process.exit(1);
}
console.log("\nAll DOM & reduced-motion checks pass.");
