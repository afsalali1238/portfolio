import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MatrixSilhouette } from "./MatrixSilhouette";

// Mock matchMedia for responsive breakpoints
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe("MatrixSilhouette", () => {
  let rafSpy: ReturnType<typeof vi.spyOn>;
  let cafSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    rafSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        setTimeout(() => cb(0 as unknown as DOMHighResTimeStamp), 16);
        return 1 as unknown as number;
      });
    cafSpy = vi.spyOn(window, "cancelAnimationFrame");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders without crashing", () => {
    render(<MatrixSilhouette />);
    expect(screen.getByText("CHIMP_AK47_TACTICAL_OPERATOR")).toBeInTheDocument();
    expect(screen.getByText("STATUS: ARMED & COMPILED")).toBeInTheDocument();
  });

  it("renders both mode buttons", () => {
    render(<MatrixSilhouette />);
    expect(screen.getByRole("button", { name: /Tactical Silhouette/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Live Matrix Feed/ })).toBeInTheDocument();
  });

  it("switches between silhouette and video modes", () => {
    render(<MatrixSilhouette defaultMode="silhouette" />);

    const silhouetteBtn = screen.getByRole("button", { name: /Tactical Silhouette/ });
    const videoBtn = screen.getByRole("button", { name: /Live Matrix Feed/ });

    expect(silhouetteBtn).toHaveClass(/bg-emerald-500\/20/);

    fireEvent.click(videoBtn);

    expect(videoBtn).toHaveClass(/bg-emerald-500\/20/);
    expect(silhouetteBtn).not.toHaveClass(/bg-emerald-500\/20/);
  });

  it("hides the mode toggle when hideToggle is set", () => {
    render(<MatrixSilhouette hideToggle />);
    const toggleWrapper = screen
      .getByRole("button", { name: /Tactical Silhouette/ })
      .closest("div");
    expect(toggleWrapper).toHaveClass("hidden");
  });

  it("panel has a height limit class", () => {
    render(<MatrixSilhouette />);
    // Find the visual display div: it's the sibling of the header that contains the canvas
    const canvas = document.querySelector("canvas");
    const visualDisplay = canvas?.parentElement;
    expect(visualDisplay).toBeTruthy();
    expect(visualDisplay?.className).toContain("max-h-[65vh]");
  });

  it("calls requestAnimationFrame on mount", () => {
    render(<MatrixSilhouette />);
    expect(rafSpy).toHaveBeenCalled();
  });

  it("pauses animation when tab is hidden", () => {
    render(<MatrixSilhouette />);
    expect(rafSpy).toHaveBeenCalled();

    Object.defineProperty(document, "hidden", { writable: true, value: true });
    fireEvent(document, new Event("visibilitychange"));

    expect(cafSpy).toHaveBeenCalled();
  });

  it("resumes animation when tab becomes visible again", () => {
    render(<MatrixSilhouette />);
    rafSpy.mockClear();

    // Hide tab
    Object.defineProperty(document, "hidden", { writable: true, value: true });
    fireEvent(document, new Event("visibilitychange"));

    // Show tab again
    Object.defineProperty(document, "hidden", { writable: true, value: false });
    fireEvent(document, new Event("visibilitychange"));

    expect(rafSpy).toHaveBeenCalled();
  });

  it("renders canvas element", () => {
    render(<MatrixSilhouette />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
    expect(canvas?.className).toContain("h-full w-full block cursor-crosshair select-none");
  });

  it("applies compact chrome on mobile viewport", () => {
    vi.stubGlobal("innerWidth", 375);
    render(<MatrixSilhouette />);
    // On mobile, identity and caliber should have only the `hidden` class (no sm:inline)
    const identity = screen.getByText("IDENTITY: CHIMP_WITH_AK47");
    const caliber = screen.getByText("CALIBER: 7.62×39MM");
    expect(identity.className).toContain("hidden");
    expect(identity.className).not.toContain("sm:inline");
    expect(caliber.className).toContain("hidden");
    expect(caliber.className).not.toContain("sm:inline");
    vi.unstubAllGlobals();
  });

  it("shows full chrome on desktop viewport", () => {
    vi.stubGlobal("innerWidth", 1024);
    render(<MatrixSilhouette />);
    expect(screen.getByText("IDENTITY: CHIMP_WITH_AK47")).toBeInTheDocument();
    expect(screen.getByText("CALIBER: 7.62×39MM")).toBeInTheDocument();
    // Desktop should have sm:inline (overriding hidden at sm+ breakpoint)
    expect(screen.getByText("IDENTITY: CHIMP_WITH_AK47").className).toContain("sm:inline");
    expect(screen.getByText("CALIBER: 7.62×39MM").className).toContain("sm:inline");
    vi.unstubAllGlobals();
  });
});
