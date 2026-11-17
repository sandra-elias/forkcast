// Remembers which restaurants were already shown, so spins don't repeat.
// Uses sessionStorage: it lasts while this browser tab is open (a "session"),
// and is wiped when the tab closes. Wrapped in try/catch because storage can be
// blocked (e.g. some private browsing modes); then we just remember in memory.

const KEY = "forkcast:seen";
let memory = new Set<string>();

export function loadSeen(): Set<string> {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) memory = new Set(JSON.parse(raw) as string[]);
  } catch {
    // ignore: fall back to in-memory
  }
  return new Set(memory);
}

export function markSeen(id: string): void {
  memory.add(id);
  try {
    sessionStorage.setItem(KEY, JSON.stringify([...memory]));
  } catch {
    // ignore
  }
}

export function forgetSeen(ids: Iterable<string>): void {
  for (const id of ids) memory.delete(id);
  try {
    sessionStorage.setItem(KEY, JSON.stringify([...memory]));
  } catch {
    // ignore
  }
}
