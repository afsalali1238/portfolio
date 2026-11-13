import type { ReactNode } from 'react'

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="page-shell">
      <a className="skip-link" href="#discussion">
        Skip the animation
      </a>
      <main id="main-content">{children}</main>
    </div>
  )
}
