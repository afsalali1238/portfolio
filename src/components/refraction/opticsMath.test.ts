import assert from "node:assert/strict";
import test from "node:test";
import { cauchyRefractiveIndex, dispersionForDensity } from "./opticsMath";

test("Cauchy dispersion controls", async (t) => {
  await t.test("anchors the selected material index to the 680 nm red reference", () => {
    assert.equal(cauchyRefractiveIndex(1.52, 680), 1.52);
  });

  await t.test("shorter wavelengths refract more strongly with positive B and C", () => {
    const red = cauchyRefractiveIndex(1.52, 680);
    const violet = cauchyRefractiveIndex(1.52, 410);
    assert.ok(violet > red);
    assert.ok(dispersionForDensity(1.52) > 0);
  });

  await t.test("vacuum stays nondispersive and B/C sliders change glass dispersion", () => {
    assert.equal(cauchyRefractiveIndex(1, 410, 0.03, 0.001), 1);
    const defaultSpread = dispersionForDensity(1.52);
    const adjustedSpread = dispersionForDensity(1.52, 0.02, 0.0001);
    assert.ok(adjustedSpread > defaultSpread);
  });
});
