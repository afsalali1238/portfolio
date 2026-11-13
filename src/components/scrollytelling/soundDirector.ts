import { smoothstep } from './opticsEngine'

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext }
type AudioFactory = () => AudioContext | null

function createBrowserAudio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Audio = window.AudioContext || (window as WebkitWindow).webkitAudioContext
  return Audio ? new Audio() : null
}

/** Lazy, gesture-only audio; mute, background, modal, and unmount all release CPU/audio work. */
export class SoundDirector {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private hum: GainNode | null = null
  private sources = new Set<OscillatorNode>()
  private gains = new Set<GainNode>()
  private enabled = false
  private visible = true
  private destroyed = false
  private revision = 0
  private muteTimer: ReturnType<typeof setTimeout> | null = null
  private progress = 0
  private lastIgnition = -Infinity
  private pendingResumes = new Set<() => void>()

  constructor(
    private readonly audioFactory: AudioFactory = createBrowserAudio,
    private readonly resumeTimeout = 2000,
  ) {}

  private ensureContext() {
    if (this.destroyed) return null
    if (this.context) return this.context
    const ctx = this.audioFactory()
    if (!ctx) return null
    this.context = ctx
    try {
      this.master = ctx.createGain()
      this.gains.add(this.master)
      this.master.gain.value = 0
      this.master.connect(ctx.destination)
      this.hum = ctx.createGain()
      this.gains.add(this.hum)
      this.hum.gain.value = 0
      this.hum.connect(this.master)
      for (const [frequency, volume] of [
        [110, 0.75],
        [55, 0.25],
      ] as const) {
        const oscillator = ctx.createOscillator()
        this.sources.add(oscillator)
        const level = ctx.createGain()
        this.gains.add(level)
        oscillator.type = 'sine'
        oscillator.frequency.value = frequency
        level.gain.value = volume
        oscillator.connect(level)
        level.connect(this.hum)
        oscillator.start()
      }
      return ctx
    } catch {
      this.releaseAudio()
      return null
    }
  }
  /** A device-less or policy-blocked browser can leave resume() pending indefinitely. */
  private resumeContext(ctx: AudioContext): Promise<boolean> {
    return new Promise((resolve) => {
      let settled = false
      let timer: ReturnType<typeof setTimeout> | null = null
      const finish = (running: boolean) => {
        if (settled) return
        settled = true
        if (timer !== null) clearTimeout(timer)
        this.pendingResumes.delete(cancel)
        resolve(running)
      }
      const cancel = () => finish(false)
      this.pendingResumes.add(cancel)
      timer = setTimeout(cancel, this.resumeTimeout)
      try {
        void ctx.resume().then(
          () => {
            if (this.destroyed || this.context !== ctx) {
              finish(false)
              return
            }
            // A delayed native completion must not resurrect audio after mute/hide/timeout.
            if (!this.enabled || !this.visible) this.suspend(ctx)
            finish(ctx.state === 'running')
          },
          () => finish(false),
        )
      } catch {
        finish(false)
      }
    })
  }
  private clearMuteTimer() {
    if (this.muteTimer !== null) clearTimeout(this.muteTimer)
    this.muteTimer = null
  }
  private volume(value: number, timeConstant = 0.08) {
    const ctx = this.context
    if (ctx && ctx.state !== 'closed')
      this.master?.gain.setTargetAtTime(value, ctx.currentTime, timeConstant)
  }
  private suspend(ctx: AudioContext) {
    if (ctx.state !== 'closed') void ctx.suspend().catch(() => {})
  }
  private applyHum() {
    if (!this.context || !this.hum || this.context.state === 'closed') return
    const envelope = smoothstep(0.5, 0.7, this.progress) * (1 - smoothstep(0.94, 1, this.progress))
    this.hum.gain.setTargetAtTime(envelope * 0.23, this.context.currentTime, 0.12)
  }
  async setEnabled(value: boolean): Promise<boolean> {
    if (this.destroyed) return false
    const revision = ++this.revision
    this.enabled = value
    this.clearMuteTimer()
    if (!value) {
      this.volume(0)
      const ctx = this.context
      if (ctx)
        this.muteTimer = setTimeout(() => {
          this.muteTimer = null
          if (!this.enabled && this.context === ctx) this.suspend(ctx)
        }, 300)
      return false
    }
    try {
      const ctx = this.ensureContext()
      if (!ctx) {
        this.enabled = false
        return false
      }
      const resumed = this.visible ? await this.resumeContext(ctx) : true
      if (this.destroyed || this.context !== ctx) return false
      if (revision !== this.revision) return this.enabled
      if (!resumed && this.visible) this.enabled = false
      // A hide/mute that arrives while resume() is pending always wins.
      if (!this.enabled || !this.visible) {
        this.volume(0)
        this.suspend(ctx)
      } else {
        this.volume(0.12, 0.2)
        this.applyHum()
      }
      return this.enabled
    } catch {
      if (revision === this.revision) this.enabled = false
      return this.enabled
    }
  }
  ignition() {
    const ctx = this.context
    if (!this.enabled || !this.visible || !ctx || !this.master || ctx.state !== 'running') return
    if (ctx.currentTime - this.lastIgnition < 0.25) return
    this.lastIgnition = ctx.currentTime
    const now = ctx.currentTime
    for (const [frequency, target, volume, duration] of [
      [150, 32, 0.52, 1.3],
      [440, 220, 0.065, 1.8],
    ] as const) {
      const osc = ctx.createOscillator(),
        gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(frequency, now)
      osc.frequency.exponentialRampToValueAtTime(target, now + duration)
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(volume, now + 0.07)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
      osc.connect(gain)
      gain.connect(this.master)
      this.sources.add(osc)
      this.gains.add(gain)
      osc.onended = () => {
        osc.disconnect()
        gain.disconnect()
        this.sources.delete(osc)
        this.gains.delete(gain)
      }
      osc.start(now)
      osc.stop(now + duration + 0.1)
    }
  }
  update(progress: number) {
    this.progress = progress
    if (this.enabled && this.visible) this.applyHum()
  }
  setVisible(visible: boolean) {
    if (this.destroyed || this.visible === visible) return
    this.visible = visible
    const ctx = this.context
    if (!ctx) return
    this.clearMuteTimer()
    if (!visible) {
      this.volume(0)
      this.suspend(ctx)
      return
    }
    if (!this.enabled) return
    void this.resumeContext(ctx).then((running) => {
      if (this.destroyed || this.context !== ctx) return
      if (running && this.visible && this.enabled) {
        this.volume(0.12, 0.2)
        this.applyHum()
      } else {
        this.volume(0)
        this.suspend(ctx)
      }
    })
  }
  private releaseAudio() {
    this.pendingResumes.forEach((cancel) => cancel())
    this.pendingResumes.clear()
    this.sources.forEach((osc) => {
      try {
        osc.stop()
      } catch {
        /* An ended or not-yet-started source can throw. */
      }
      try {
        osc.disconnect()
      } catch {
        /* Partial setup may fail on a disconnected device. */
      }
      osc.onended = null
    })
    this.gains.forEach((gain) => {
      try {
        gain.disconnect()
      } catch {
        /* Already disconnected. */
      }
    })
    this.sources.clear()
    this.gains.clear()
    if (this.context && this.context.state !== 'closed') void this.context.close().catch(() => {})
    this.context = null
    this.master = null
    this.hum = null
  }
  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.enabled = false
    this.revision++
    this.clearMuteTimer()
    this.releaseAudio()
  }
}
