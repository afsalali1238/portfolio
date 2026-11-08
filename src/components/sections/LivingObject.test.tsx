import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LivingObject } from "./LivingObject";

// Mock matchMedia
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

beforeEach(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LivingObject", () => {
  it("renders children in immersive (cicada) mode", () => {
    render(
      <LivingObject>
        <h1 data-testid="intro-heading">The Man Behind.</h1>
      </LivingObject>,
    );
    expect(screen.getByTestId("intro-heading")).toBeInTheDocument();
  });

  it("renders mode buttons as tabs", () => {
    render(
      <LivingObject>
        <h1 data-testid="intro-heading">The Man Behind.</h1>
      </LivingObject>,
    );
    expect(screen.getByRole("tab", { name: /Cicada \(natural\)/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Ape AK-47 \(video\)/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Ape \(silhouette\)/ })).toBeInTheDocument();
  });

  it("switches to ape mode and renders MatrixSilhouette", () => {
    render(
      <LivingObject>
        <h1 data-testid="intro-heading">The Man Behind.</h1>
      </LivingObject>,
    );

    fireEvent.click(screen.getByRole("tab", { name: /Ape \(silhouette\)/ }));

    expect(screen.getByText("CHIMP_AK47_TACTICAL_OPERATOR")).toBeInTheDocument();
  });

  it("switches between ape video and ape silhouette modes", () => {
    render(
      <LivingObject>
        <h1 data-testid="intro-heading">The Man Behind.</h1>
      </LivingObject>,
    );

    fireEvent.click(screen.getByRole("tab", { name: /Ape \(silhouette\)/ }));
    fireEvent.click(screen.getByRole("tab", { name: /Ape AK-47 \(video\)/ }));

    // Both modes should render the panel
    expect(screen.getByText("CHIMP_AK47_TACTICAL_OPERATOR")).toBeInTheDocument();
  });

  it("has responsive layout classes", () => {
    render(
      <LivingObject>
        <h1 data-testid="intro-heading">The Man Behind.</h1>
      </LivingObject>,
    );

    // Switch to ape mode to see the layout
    fireEvent.click(screen.getByRole("tab", { name: /Ape \(silhouette\)/ }));

    // The section should use flex-col for mobile stacking
    const section = screen.getByTestId("intro-heading").closest("section");
    expect(section).toBeTruthy();
    expect(section?.className).toContain("flex-col");
  });

  it("keeps mode controls above the ape panel in the DOM", () => {
    render(
      <LivingObject>
        <h1 data-testid="intro-heading">The Man Behind.</h1>
      </LivingObject>,
    );

    fireEvent.click(screen.getByRole("tab", { name: /Ape \(silhouette\)/ }));

    const heading = screen.getByTestId("intro-heading");
    const apePanel = screen.getByText("CHIMP_AK47_TACTICAL_OPERATOR");
    expect(heading).toBeTruthy();
    expect(apePanel).toBeTruthy();
    // Both elements should be in the same document
    expect(heading.ownerDocument).toBe(apePanel.ownerDocument);
    // The heading text should appear before the ape panel text in the section's HTML
    const section = heading.closest("section");
    expect(section).toBeTruthy();
    const html = section!.innerHTML;
    const headingPos = html.indexOf("The Man Behind.");
    const apePos = html.indexOf("CHIMP_AK47_TACTICAL_OPERATOR");
    expect(headingPos).toBeGreaterThanOrEqual(0);
    expect(apePos).toBeGreaterThanOrEqual(0);
    expect(headingPos).toBeLessThan(apePos);
  });

  it("uses side-by-side layout wrapper on desktop", () => {
    render(
      <LivingObject>
        <h1 data-testid="intro-heading">The Man Behind.</h1>
      </LivingObject>,
    );

    fireEvent.click(screen.getByRole("tab", { name: /Ape \(silhouette\)/ }));

    // The responsive wrapper should use flex-col (mobile default) with lg:flex-row
    const section = screen.getByTestId("intro-heading").closest("section");
    const layoutWrapper = section?.querySelector(".flex.flex-col.lg\\:flex-row");
    expect(layoutWrapper).toBeTruthy();
  });
});
