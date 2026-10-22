import React from "react";

export function RevealWord({
  children,
  delay = 0,
  italic = false,
}: {
  children: React.ReactNode;
  delay?: number;
  italic?: boolean;
}) {
  // A CSS animation, not a Motion one: it starts on first paint from the server HTML
  // instead of waiting for hydration, so the headline is never held back by JS.
  return (
    <span className="inline-block overflow-hidden align-top">
      <span
        className={`reveal-word inline-block ${italic ? "italic" : ""}`}
        style={{ animationDelay: `${delay}s` }}
      >
        {children}
      </span>
    </span>
  );
}
