export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>A glitch in the ledger · forthe.tech</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root {
        --paper: #F8F6F0;
        --ink: #2B231D;
        --ink-soft: #5A524A;
        --ink-mute: #8C847B;
        --rule: #DCD8CF;
        --paper-deep: #EDEAE1;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --paper: #16120F;
          --ink: #F5F2EB;
          --ink-soft: #C8C3BA;
          --ink-mute: #928C84;
          --rule: #2C2621;
          --paper-deep: #211B17;
        }
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
        display: inline-block;
        width: 2.5rem;
        height: 2.5rem;
        background: var(--ink);
        border-radius: 6px;
        margin-bottom: 1.5rem;
        position: relative;
      }
      .mark::after {
        content: "";
        position: absolute;
        top: 0.6rem;
        left: 0.6rem;
        width: 0.5rem;
        height: 0.5rem;
        background: #A8471B;
        border-radius: 50%;
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
      <div class="mark" aria-hidden="true"></div>
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
