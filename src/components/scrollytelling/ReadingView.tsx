import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { CHAPTERS, FULL_TEXT } from './story'
import { Icon } from '../Icons'
import { lockDocumentScroll } from './scrollLock'

export interface ReadingHandle {
  open: () => void
  close: () => void
  isOpen: () => boolean
}

export const ReadingView = forwardRef<
  ReadingHandle,
  { onOpenChange: (open: boolean) => void; onChapter: (index: number) => void }
>(function ReadingView({ onOpenChange, onChapter }, ref) {
  const dialog = useRef<HTMLDialogElement>(null)
  const restoreScroll = useRef<(() => void) | null>(null)
  const release = useCallback(() => {
    if (!restoreScroll.current) return
    const restore = restoreScroll.current
    restoreScroll.current = null
    restore()
    onOpenChange(false)
  }, [onOpenChange])
  const close = useCallback(() => {
    if (dialog.current?.open) dialog.current.close()
    release()
  }, [release])
  useEffect(
    () => () => {
      restoreScroll.current?.()
      restoreScroll.current = null
    },
    [],
  )
  useImperativeHandle(
    ref,
    () => ({
      open() {
        if (!dialog.current || dialog.current.open) return
        try {
          dialog.current.showModal()
        } catch {
          return
        }
        restoreScroll.current = lockDocumentScroll(document)
        onOpenChange(true)
      },
      close,
      isOpen() {
        return !!dialog.current?.open
      },
    }),
    [onOpenChange, close],
  )

  return (
    <dialog
      className="reading-dialog"
      ref={dialog}
      aria-labelledby="reading-title"
      onKeyDown={(event) => {
        if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return
        const controls = [
          ...event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])',
          ),
        ].filter((element) => element.getClientRects().length > 0 && !element.closest('[inert]'))
        const first = controls[0],
          last = controls[controls.length - 1]
        if (!first) return
        if (
          event.shiftKey &&
          (document.activeElement === first || document.activeElement === event.currentTarget)
        ) {
          event.preventDefault()
          last.focus()
        } else if (
          !event.shiftKey &&
          (document.activeElement === last || document.activeElement === event.currentTarget)
        ) {
          event.preventDefault()
          first.focus()
        }
      }}
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      onClose={() => {
        if (!dialog.current?.open) release()
      }}
      onClick={(event) => {
        if (event.target === dialog.current) close()
      }}
    >
      <div className="reading-paper">
        <header className="reading-header">
          <span className="eyebrow">FOR THE TECH. / THE MANIFESTO</span>
          <button className="icon-button" aria-label="Close reading view" onClick={close} autoFocus>
            <Icon name="close" />
          </button>
        </header>
        <div className="reading-intro">
          <p className="eyebrow">THE WORDS, WITHOUT THE MOTION.</p>
          <h2 id="reading-title">
            The Refraction
            <br />
            of <em>Thought.</em>
          </h2>
          <p className="reading-deck">
            Curiosity enters. Craft bends it.
            <br />
            Reality catches the colour.
          </p>
        </div>
        {FULL_TEXT.map((chapter, index) => (
          <section className="reading-chapter" key={chapter.title}>
            <button
              className="reading-chapter-link"
              onClick={() => {
                close()
                onChapter(index + 1)
              }}
            >
              <span>{CHAPTERS[index + 1].numeral}</span>
              <span>{chapter.title}</span>
              <Icon name="arrow" size={14} />
            </button>
            {chapter.paragraphs.map((paragraph, pIndex) => (
              <p
                key={paragraph}
                className={pIndex === chapter.paragraphs.length - 1 ? 'reading-last' : ''}
              >
                {paragraph}
              </p>
            ))}
          </section>
        ))}
        <footer className="reading-note">
          <span className="eyebrow">A NOTE ON THE EXPERIMENT</span>
          <p>
            This is a metaphor, not a physics textbook. The optical engine uses Snell’s law and
            Cauchy’s equation; spectral separation is exaggerated after emergence. In nature, light
            can also refract when it leaves a denser medium.
          </p>
          <button className="text-link" onClick={close}>
            Back to the light <Icon name="arrow" size={14} />
          </button>
        </footer>
      </div>
    </dialog>
  )
})
