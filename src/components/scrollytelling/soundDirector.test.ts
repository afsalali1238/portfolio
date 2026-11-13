import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SoundDirector } from "./soundDirector";

class Parameter {
  value = 0;
  setTargetAtTime(value: number) {
    this.value = value;
  }
  setValueAtTime(value: number) {
    this.value = value;
  }
  linearRampToValueAtTime(value: number) {
    this.value = value;
  }
  exponentialRampToValueAtTime(value: number) {
    this.value = value;
  }
}
class Gain {
  gain = new Parameter();
  disconnected = false;
  connect() {}
  disconnect() {
    this.disconnected = true;
  }
}
class Oscillator {
  frequency = new Parameter();
  type = "sine";
  onended: (() => void) | null = null;
  stopped = false;
  disconnected = false;
  connect() {}
  start() {}
  stop() {
    this.stopped = true;
  }
  disconnect() {
    this.disconnected = true;
  }
}
class Audio {
  state = "suspended";
  currentTime = 0;
  destination = {};
  gains: Gain[] = [];
  oscillators: Oscillator[] = [];
  resumes = 0;
  suspends = 0;
  closes = 0;
  deferResume = false;
  resolveResume: (() => void) | null = null;
  createGain() {
    const node = new Gain();
    this.gains.push(node);
    return node;
  }
  createOscillator() {
    const node = new Oscillator();
    this.oscillators.push(node);
    return node;
  }
  resume() {
    this.resumes++;
    if (this.deferResume)
      return new Promise<void>((resolve) => {
        this.resolveResume = () => {
          if (this.state !== "closed") this.state = "running";
          resolve();
        };
      });
    this.state = "running";
    return Promise.resolve();
  }
  suspend() {
    this.suspends++;
    this.state = "suspended";
    return Promise.resolve();
  }
  close() {
    this.closes++;
    this.state = "closed";
    return Promise.resolve();
  }
}
const setup = () => {
  const context = new Audio();
  return { context, director: new SoundDirector(() => context as unknown as AudioContext) };
};
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Web Audio ownership and races", () => {
  it("is lazy, including when imported/updated during SSR", () => {
    let created = 0;
    const director = new SoundDirector(() => {
      created++;
      return null;
    });
    director.update(0.6);
    director.ignition();
    director.setVisible(false);
    assert.equal(created, 0);
    director.destroy();
  });
  it("applies the current chapter hum when sound is enabled later", async () => {
    const { director, context } = setup();
    director.update(0.8);
    assert.equal(await director.setEnabled(true), true);
    assert.equal(context.oscillators.length, 2);
    assert.ok(context.gains[1].gain.value > 0);
    director.destroy();
  });
  it("suspends the context after a mute fade instead of leaving silent oscillators running", async () => {
    const { director, context } = setup();
    await director.setEnabled(true);
    await director.setEnabled(false);
    assert.equal(context.gains[0].gain.value, 0);
    await wait(325);
    assert.equal(context.state, "suspended");
    director.destroy();
  });
  it("cancels a pending mute suspension when re-enabled", async () => {
    const { director, context } = setup();
    await director.setEnabled(true);
    await director.setEnabled(false);
    await director.setEnabled(true);
    await wait(325);
    assert.equal(context.state, "running");
    director.destroy();
  });
  it("does not allow a pending resume to play behind an open reader or hidden page", async () => {
    const { director, context } = setup();
    context.deferResume = true;
    const pending = director.setEnabled(true);
    director.setVisible(false);
    context.resolveResume!();
    await pending;
    assert.equal(context.state, "suspended");
    assert.equal(context.gains[0].gain.value, 0);
    director.destroy();
  });
  it("does not resurrect a destroyed context after an asynchronous resume", async () => {
    const { director, context } = setup();
    context.deferResume = true;
    const pending = director.setEnabled(true);
    director.destroy();
    context.resolveResume!();
    assert.equal(await pending, false);
    assert.equal(context.closes, 1);
    assert.equal(await director.setEnabled(true), false);
  });
  it("stops and disconnects continuous and scheduled one-shot sources on destroy", async () => {
    const { director, context } = setup();
    await director.setEnabled(true);
    director.ignition();
    assert.equal(context.oscillators.length, 4);
    director.destroy();
    director.destroy();
    assert.ok(context.oscillators.every((osc) => osc.stopped && osc.disconnected));
    assert.ok(context.gains.every((gain) => gain.disconnected));
    assert.equal(context.closes, 1);
  });
  it("bounds a resume that never resolves, then stays muted after a late completion", async () => {
    const context = new Audio();
    context.deferResume = true;
    const director = new SoundDirector(() => context as unknown as AudioContext, 20);
    assert.equal(await director.setEnabled(true), false);
    assert.equal(context.state, "suspended");
    context.resolveResume!();
    await wait(0);
    assert.equal(context.state, "suspended");
    assert.equal(context.gains[0].gain.value, 0);
    director.destroy();
  });
  it("closes a partially created graph when a browser audio device fails", async () => {
    const context = new Audio();
    context.createOscillator = () => {
      throw new Error("Device disconnected");
    };
    const director = new SoundDirector(() => context as unknown as AudioContext);
    assert.equal(await director.setEnabled(true), false);
    assert.equal(context.state, "closed");
    assert.ok(context.gains.every((gain) => gain.disconnected));
    director.destroy();
  });
  it("fails gracefully without supported audio", async () => {
    const director = new SoundDirector(() => null);
    assert.equal(await director.setEnabled(true), false);
    director.destroy();
  });
});
