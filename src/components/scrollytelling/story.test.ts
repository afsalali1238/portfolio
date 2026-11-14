import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CHAPTERS,
  MOVEMENTS,
  PHYSICS_NOTE,
  PROLOGUE,
  SURFACES,
  THESIS_PUBLISHED_AT,
  movementPlainText,
  publishedDateLabel,
  segmentsText,
} from "./story";

describe("The thesis source of truth", () => {
  it("keeps the seven movements and chapter order intact", () => {
    assert.deepEqual(
      MOVEMENTS.map(({ numeral }) => numeral),
      ["01", "02", "03", "04", "05", "06", "07"],
    );
    assert.deepEqual(
      MOVEMENTS.map(({ title }) => title),
      [
        "The Incident Beam",
        "The First Boundary",
        "The Glass",
        "Dispersion",
        "The Emergent Ray",
        "The Spectrum",
        "The Continuous Engine",
      ],
    );
    assert.equal(CHAPTERS.length, 8);
    assert.deepEqual(
      CHAPTERS.slice(1).map(({ numeral }) => numeral),
      MOVEMENTS.map(({ numeral }) => numeral),
    );
    // Every movement header is dual-tone: a bone clause answered by an italic muted clause.
    for (const movement of MOVEMENTS) {
      assert.equal(movement.heading.at(-1)?.emphasis, true);
      assert.equal(movement.heading.at(-1)?.breakBefore, true);
    }
  });

  it("shares the complete surface copy with the non-interactive reading versions", () => {
    const movement = movementPlainText(MOVEMENTS[2]);
    for (const surface of SURFACES) {
      assert.ok(movement.includes(surface.label));
      assert.ok(movement.includes(surface.lead));
      assert.ok(movement.includes(surface.detail));
    }
  });

  it("describes refraction at a boundary in the movement and physics note", () => {
    const bend = movementPlainText(MOVEMENTS[2]).join(" ");
    assert.match(bend, /At the boundary, its change in speed bends an angled ray/);
    assert.match(PHYSICS_NOTE, /at a boundary as it enters or leaves a medium/);
    assert.doesNotMatch(bend, /Slowing down is what bends it/);
  });

  it("keeps editorial footnotes in the reading and no-script text", () => {
    for (const movement of MOVEMENTS) {
      const text = movementPlainText(movement);
      assert.ok(text.every((line) => typeof line === "string" && line.length > 0));
      if (movement.footnote) assert.equal(text.at(-1), movement.footnote);
    }
  });

  it("uses one publication date for every presentation", () => {
    assert.match(THESIS_PUBLISHED_AT, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(publishedDateLabel(), "12 Nov 2026");
    assert.equal(segmentsText(PROLOGUE.heading), "The Refraction of Thought.");
    assert.equal(MOVEMENTS[6].footnote, undefined);
  });
});
