import type { ReactNode } from 'react'
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import '@fontsource-variable/dm-sans/wght.css'
import '@fontsource/instrument-serif/latin-400.css'
import '@fontsource/instrument-serif/latin-400-italic.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '../styles/app.css'
import '../styles/compact.css'
import '../styles/accessibility.css'
import serifNormalUrl from '@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2?url'
import serifItalicUrl from '@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2?url'
import { FailureView } from '../components/FailureView'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#0b0c0e' },
      { title: 'The Refraction of Thought — for the tech.' },
    ],
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      {
        rel: 'preload',
        as: 'font',
        type: 'font/woff2',
        href: serifNormalUrl,
        crossOrigin: 'anonymous',
      },
      {
        rel: 'preload',
        as: 'font',
        type: 'font/woff2',
        href: serifItalicUrl,
        crossOrigin: 'anonymous',
      },
    ],
  }),
  component: Root,
  errorComponent: FailureView,
  notFoundComponent: () => (
    <div className="not-found">
      <p className="eyebrow">404 / OUTSIDE THE FIELD</p>
      <h1>A different direction.</h1>
      <a href="/thesis">Return to the thesis ↗</a>
    </div>
  ),
})

function Root() {
  return (
    <Document>
      <Outlet />
    </Document>
  )
}

function Document({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
