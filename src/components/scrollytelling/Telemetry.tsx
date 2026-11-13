import { forwardRef, useImperativeHandle, useRef } from 'react'
import { chapterAt, surfaceAt, SURFACES } from './story'
import { lerp, smoothstep, SPECTRUM } from './opticsEngine'

export interface TelemetryHandle {
  update: (progress: number) => void
}

export const Telemetry = forwardRef<TelemetryHandle>(function Telemetry(_, ref) {
  const label = useRef<HTMLSpanElement>(null)
  const index = useRef<HTMLSpanElement>(null)
  const velocity = useRef<HTMLSpanElement>(null)
  const status = useRef<HTMLSpanElement>(null)
  const spectrum = useRef<HTMLDivElement>(null)
  useImperativeHandle(
    ref,
    () => ({
      update(p) {
        const chapter = chapterAt(p),
          glass = smoothstep(0.54, 0.7, p),
          n = lerp(1, 1.52, glass)
        if (label.current)
          label.current.textContent =
            chapter === 0
              ? 'FIELD / AT REST'
              : chapter === 1
                ? 'ORIGIN / SPONTANEOUS'
                : chapter === 2
                  ? 'MEDIUM / VACUUM'
                  : chapter === 3
                    ? `SURFACE / ${SURFACES[surfaceAt(p)].material}`
                    : chapter === 6
                      ? 'STATE / UNBOUNDED'
                      : 'MEDIUM / OPTICAL GLASS'
        if (index.current) index.current.textContent = n.toFixed(3)
        if (velocity.current) velocity.current.textContent = `${(1 / n).toFixed(3)}c`
        if (status.current)
          status.current.textContent =
            chapter === 0
              ? 'AWAITING INPUT'
              : chapter === 1
                ? 'IGNITION'
                : chapter === 2
                  ? 'FRICTION: 0.00'
                  : chapter === 3
                    ? SURFACES[surfaceAt(p)].status
                    : chapter === 4
                      ? 'SLOWING TO BECOME'
                      : chapter === 5
                        ? '410–680 nm'
                        : 'PERMANENT'
        if (spectrum.current) spectrum.current.style.opacity = String(smoothstep(0.72, 0.8, p))
      },
    }),
    [],
  )
  return (
    <aside className="telemetry" aria-label="Optical telemetry" aria-hidden="true">
      <div className="spectral-legend" ref={spectrum}>
        {SPECTRUM.map((band) => (
          <div key={band.name}>
            <i style={{ background: band.color }} />
            <span>
              {band.wavelength}
              <small> nm</small>
            </span>
          </div>
        ))}
      </div>
      <div className="telemetry-top">
        <span className="status-dot" />
        <span ref={label}>FIELD / AT REST</span>
        <span className="telemetry-live">LIVE</span>
      </div>
      <div className="telemetry-values">
        <div>
          <span className="telemetry-key">REFRACTIVE INDEX</span>
          <span className="telemetry-value">
            <i>n</i>
            <span ref={index}>1.000</span>
          </span>
        </div>
        <div>
          <span className="telemetry-key">PHASE VELOCITY</span>
          <span className="telemetry-value">
            <i>v</i>
            <span ref={velocity}>1.000c</span>
          </span>
        </div>
        <div className="telemetry-status">
          <span className="telemetry-key">OBSERVATION</span>
          <span className="telemetry-status-value" ref={status}>
            AWAITING INPUT
          </span>
        </div>
      </div>
    </aside>
  )
})
