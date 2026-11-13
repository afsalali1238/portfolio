export interface Thought {
  id: string;
  name: string;
  message: string;
  date: string;
}
export const NOTES_KEY = "forthe-tech:thoughts:v1";
export const MAX_NOTES = 20;

/** Treat browser storage as untrusted and bounded, just like a network response. */
export function parseThoughts(serialized: string | null): Thought[] {
  if (!serialized || serialized.length > 65_536) return [];
  try {
    const value: unknown = JSON.parse(serialized);
    if (!Array.isArray(value)) return [];
    const ids = new Set<string>(),
      result: Thought[] = [];
    for (const item of value) {
      if (
        !item ||
        typeof item !== "object" ||
        typeof item.id !== "string" ||
        typeof item.name !== "string" ||
        typeof item.message !== "string" ||
        typeof item.date !== "string"
      )
        continue;
      const id = item.id.trim().slice(0, 100),
        message = item.message.trim().slice(0, 600);
      if (!id || !message || ids.has(id) || !Number.isFinite(Date.parse(item.date))) continue;
      ids.add(id);
      result.push({
        id,
        message,
        name: item.name.trim().slice(0, 40) || "A curious mind",
        date: new Date(item.date).toISOString(),
      });
      if (result.length === MAX_NOTES) break;
    }
    return result;
  } catch {
    return [];
  }
}

/** Storage may be disabled by browser privacy settings, including its property getter. */
export function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readThoughts(): Thought[] {
  try {
    return parseThoughts(browserStorage()?.getItem(NOTES_KEY) || null);
  } catch {
    return [];
  }
}

let sequence = 0;
/** This is a local UI identifier, never an authentication/security token. */
export function createThoughtId(): string {
  try {
    const cryptoApi = globalThis.crypto;
    if (typeof cryptoApi?.randomUUID === "function") return cryptoApi.randomUUID();
    if (typeof cryptoApi?.getRandomValues === "function") {
      const values = cryptoApi.getRandomValues(new Uint32Array(4));
      return Array.from(values, (n) => n.toString(16).padStart(8, "0")).join("");
    }
  } catch {
    /* Some restricted contexts expose a crypto object that cannot be used. */
  }
  return `local-${Date.now().toString(36)}-${(++sequence).toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
