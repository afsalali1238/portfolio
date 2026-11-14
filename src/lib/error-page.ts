export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>A glitch in the ledger · forthe.tech</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root {
        color-scheme: dark;
        --paper: #0b0c0e;
        --ink: #eeeae1;
        --ink-soft: #a6a7a7;
        --ink-mute: #9a9ea5;
        --rule: rgba(205, 211, 221, 0.12);
        --paper-deep: #121519;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background: var(--paper);
        color: var(--ink);
        display: grid;
        place-items: center;
        min-height: 100svh;
        margin: 0;
        padding: 1.5rem;
        box-sizing: border-box;
      }
      .card {
        max-width: 28rem;
        width: 100%;
        text-align: center;
        padding: 2.5rem 1.5rem;
      }
      .mark {
        display: block;
        width: 3rem;
        height: 3rem;
        margin: 0 auto 1.5rem;
      }
      h1 {
        font-family: "Instrument Serif", Georgia, serif;
        font-size: 2.5rem;
        line-height: 1.1;
        font-weight: 400;
        margin: 0 0 0.75rem;
        color: var(--ink);
      }
      p {
        color: var(--ink-soft);
        font-size: 0.95rem;
        line-height: 1.5;
        margin: 0 0 2rem;
      }
      .actions {
        display: flex;
        gap: 0.75rem;
        justify-content: center;
        flex-wrap: wrap;
      }
      a, button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 2.75rem;
        padding: 0 1.25rem;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        text-decoration: none;
        transition: background-color 150ms ease, opacity 150ms ease;
        box-sizing: border-box;
      }
      .primary {
        background: var(--ink);
        color: var(--paper);
        border: none;
      }
      .primary:hover {
        opacity: 0.9;
      }
      .secondary {
        background: transparent;
        color: var(--ink);
        border: 1px solid var(--rule);
      }
      .secondary:hover {
        background: var(--paper-deep);
      }
    </style>
  </head>
  <body>
    <div class="card">
      <img class="mark" src="/favicon.svg" width="48" height="48" alt="" />
      <h1>A glitch in the ledger.</h1>
      <p>The server encountered an error while assembling this page. Try reloading, or return to safety.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try reloading</button>
        <a class="secondary" href="/">Back to home</a>
      </div>
    </div>
  </body>
</html>`;
}
