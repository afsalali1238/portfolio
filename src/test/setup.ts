import "@testing-library/jest-dom";
// Type augmentation for Vitest matchers
import "@testing-library/jest-dom/vitest";

// Polyfill requestAnimationFrame/cancelAnimationFrame for jsdom
if (typeof window.requestAnimationFrame === "undefined") {
  Object.defineProperty(window, "requestAnimationFrame", {
    writable: true,
    configurable: true,
    value: (cb: FrameRequestCallback) => {
      return setTimeout(() => cb(0 as unknown as DOMHighResTimeStamp), 16) as unknown as number;
    },
  });
}
if (typeof window.cancelAnimationFrame === "undefined") {
  Object.defineProperty(window, "cancelAnimationFrame", {
    writable: true,
    configurable: true,
    value: (id: number) => {
      clearTimeout(id);
    },
  });
}

// Mock HTMLCanvasElement.getContext("2d") so canvas-based components render in jsdom
const mockCtx = {
  clearRect: () => {},
  fillRect: () => {},
  fillStyle: "",
  scale: () => {},
  setTransform: () => {},
  font: "",
  textBaseline: "",
  textAlign: "",
  fillText: () => {},
  getImageData: () => ({
    data: new Uint8ClampedArray(4),
  }),
  createImageData: () => ({}),
  putImageData: () => {},
  drawImage: () => {},
  save: () => {},
  restore: () => {},
  beginPath: () => {},
  arc: () => {},
  stroke: () => {},
  lineTo: () => {},
  moveTo: () => {},
  rect: () => {},
  measureText: () => ({ width: 0 }),
} as unknown as CanvasRenderingContext2D;

HTMLCanvasElement.prototype.getContext = function (
  _contextType: string,
): CanvasRenderingContext2D | null {
  return mockCtx;
} as unknown as HTMLCanvasElement["getContext"];

HTMLCanvasElement.prototype.toDataURL = function () {
  return "";
} as unknown as HTMLCanvasElement["toDataURL"];

// Mock HTMLMediaElement.play() for video elements
HTMLMediaElement.prototype.play = function () {
  return Promise.resolve();
} as unknown as HTMLMediaElement["play"];

// Mock ResizeObserver for jsdom
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

// Mock IntersectionObserver for jsdom
globalThis.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
  root = null;
  rootMargin = "";
  thresholds = [];
} as unknown as typeof IntersectionObserver;
