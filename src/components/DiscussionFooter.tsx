import { useEffect, useRef, useState, type FormEvent } from "react";
import { Brand, Icon } from "./Icons";

import {
  browserStorage,
  createThoughtId,
  MAX_NOTES,
  NOTES_KEY,
  parseThoughts,
  readThoughts,
  type Thought,
} from "./fieldNotes";

export function DiscussionFooter() {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const notes = useRef<Thought[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [name, setName] = useState(""),
    [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    notes.current = readThoughts();
    setThoughts(notes.current);
    setHydrated(true);
    const synchronize = (event: StorageEvent) => {
      if (event.key !== NOTES_KEY && event.key !== null) return;
      if (event.storageArea && event.storageArea !== browserStorage()) return;
      notes.current = parseThoughts(event.newValue);
      setThoughts(notes.current);
    };
    window.addEventListener("storage", synchronize);
    return () => window.removeEventListener("storage", synchronize);
  }, []);
  function save(next: Thought[]) {
    notes.current = next;
    setThoughts(next);
    try {
      const storage = browserStorage();
      if (!storage) return false;
      storage.setItem(NOTES_KEY, JSON.stringify(next));
      return true;
    } catch {
      return false;
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hydrated) return;
    const text = message.trim();
    if (!text) {
      setNotice("A little light needs a few words.");
      const field = event.currentTarget.querySelector("textarea");
      field?.setCustomValidity("Please add a few words.");
      field?.reportValidity();
      return;
    }
    const thought: Thought = {
      id: createThoughtId(),
      name: name.trim().slice(0, 40) || "A curious mind",
      message: text.slice(0, 600),
      date: new Date().toISOString(),
    };
    const persisted = save([thought, ...notes.current].slice(0, MAX_NOTES));
    setMessage("");
    setName("");
    setNotice(
      persisted
        ? "Saved in this browser. Not sent to a server."
        : "Saved for this visit; browser storage is unavailable.",
    );
  }
  const clearThoughts = () => {
    const persisted = save([]);
    setNotice(
      persisted
        ? "Your field notes have been cleared from this browser."
        : "Your field notes are cleared for this visit; browser storage is unavailable.",
    );
  };
  const top = () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
    document.querySelector<HTMLElement>(".site-header .brand")?.focus({ preventScroll: true });
  };
  return (
    <footer className="discussion-footer" id="discussion" tabIndex={-1}>
      <div className="discussion-topline">
        <span className="eyebrow">THE END IS AN OPENING.</span>
      </div>
      <div className="discussion-grid">
        <div className="discussion-intro">
          <p className="eyebrow">
            <span className="status-dot" />A QUIET PLACE TO THINK
          </p>
          <h2>
            What’s your
            <br />
            <em>right medium?</em>
          </h2>
          <p>
            A person. A place. A problem worth staying with.
            <br />
            Some things become clearer when we put them into words.
          </p>
          <span className="discussion-coordinate">[ THOUGHTS ARE A GOOD BEGINNING. ]</span>
        </div>
        <form
          className="thought-form"
          onSubmit={submit}
          aria-labelledby="thought-form-title"
          aria-describedby="storage-note"
        >
          <h3 className="thought-form-title" id="thought-form-title">
            Write it down
          </h3>
          <label htmlFor="thought-name">
            YOUR NAME <span>OPTIONAL</span>
          </label>
          <input
            id="thought-name"
            name="name"
            disabled={!hydrated}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="A curious mind"
            autoComplete="given-name"
          />
          <label htmlFor="thought-message">
            YOUR THOUGHT <span>{message.length} / 600</span>
          </label>
          <textarea
            id="thought-message"
            name="thought"
            disabled={!hydrated}
            value={message}
            onChange={(e) => {
              e.target.setCustomValidity("");
              setMessage(e.target.value);
            }}
            maxLength={600}
            required
            placeholder="The right medium, for me, is…"
            rows={3}
          />
          <div className="form-actions">
            <p id="storage-note">Stored in this browser, not sent to a server.</p>
            <button className="submit-thought" type="submit" disabled={!hydrated}>
              Keep this thought <Icon name="arrow" size={16} />
            </button>
          </div>
          <noscript>
            <p className="form-notice">
              Field notes need JavaScript. Nothing from this form is sent to anyone.
            </p>
          </noscript>
          <p className="form-notice" role="status" aria-atomic="true">
            {notice}
          </p>
        </form>
      </div>
      {thoughts.length > 0 && (
        <div className="saved-thoughts">
          <div className="saved-thoughts-heading">
            <h3 className="eyebrow">
              YOUR NOTES <span>({thoughts.length.toString().padStart(2, "0")})</span>
            </h3>
            <button
              className="clear-thoughts"
              type="button"
              onClick={clearThoughts}
              aria-label="Clear all saved field notes"
            >
              Clear
            </button>
          </div>
          {thoughts.map((thought) => (
            <article className="saved-thought" key={thought.id}>
              <p>{thought.message}</p>
              <div>
                <span>{thought.name}</span>
                <button
                  onClick={() => {
                    const persisted = save(notes.current.filter((t) => t.id !== thought.id));
                    setNotice(
                      persisted
                        ? "Field note removed."
                        : "Removed for this visit; browser storage is unavailable.",
                    );
                  }}
                  aria-label={`Remove thought by ${thought.name}`}
                >
                  Remove <Icon name="close" size={11} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="site-footer">
        <Brand />
        <span className="t-label">© 2026 · INDEPENDENT THOUGHT, MADE REAL.</span>
        <div className="footer-links" style={{ display: "flex", gap: "16px", margin: "0 16px" }}>
          <a href="/works" className="text-link" style={{ fontSize: "12px" }}>Works</a>
          <a href="/notes" className="text-link" style={{ fontSize: "12px" }}>Notes</a>
        </div>
        <button className="text-link" onClick={top}>
          Back to the beginning <Icon name="arrow" size={14} />
        </button>
      </div>
    </footer>
  );
}
