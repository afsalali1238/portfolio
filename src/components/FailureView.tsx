export function FailureView() {
  return (
    <main className="not-found failure-view" aria-labelledby="failure-title">
      <p className="eyebrow">THE FIELD / SIGNAL INTERRUPTED</p>
      <h1 id="failure-title">
        A pause.
        <br />
        <em>Not the end.</em>
      </h1>
      <p>Something interrupted the experience. Reload the page to reconnect with the light.</p>
      <button type="button" className="text-link" onClick={() => window.location.reload()}>
        Reload the experience ↗
      </button>
      <p className="failure-help">
        If the interruption continues, try another browser or disable extensions for this page.
      </p>
    </main>
  )
}
