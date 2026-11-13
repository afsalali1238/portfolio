interface ScrollLock {
  count: number
  bodyOverflow: string
  rootOverflow: string
  rootOverscroll: string
}

const locks = new WeakMap<Document, ScrollLock>()

/** Each owner releases only its own lock. Nested overlays and pre-existing styles survive. */
export function lockDocumentScroll(doc: Document): () => void {
  let state = locks.get(doc)
  if (state) state.count++
  else {
    state = {
      count: 1,
      bodyOverflow: doc.body.style.overflow,
      rootOverflow: doc.documentElement.style.overflow,
      rootOverscroll: doc.documentElement.style.overscrollBehavior,
    }
    locks.set(doc, state)
    doc.body.style.overflow = 'hidden'
    doc.documentElement.style.overflow = 'hidden'
    doc.documentElement.style.overscrollBehavior = 'none'
  }
  let released = false
  return () => {
    if (released) return
    released = true
    const current = locks.get(doc)
    if (!current || --current.count > 0) return
    doc.body.style.overflow = current.bodyOverflow
    doc.documentElement.style.overflow = current.rootOverflow
    doc.documentElement.style.overscrollBehavior = current.rootOverscroll
    locks.delete(doc)
  }
}
