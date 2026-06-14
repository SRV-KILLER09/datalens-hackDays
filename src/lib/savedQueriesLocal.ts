import type { SavedQuery } from "@/src/actions/savedQueries";

const storageKey = (userKey: string, connectionId: string) =>
  `datalens-queries-${userKey}-${connectionId}`;

export function loadLocalQueries(userKey: string, connectionId: string): SavedQuery[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(userKey, connectionId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalQueries(userKey: string, connectionId: string, queries: SavedQuery[]) {
  localStorage.setItem(storageKey(userKey, connectionId), JSON.stringify(queries));
}

export function addLocalQuery(
  userKey: string,
  connectionId: string,
  query: Omit<SavedQuery, "id" | "createdAt" | "updatedAt">
): SavedQuery {
  const existing = loadLocalQueries(userKey, connectionId);
  const entry: SavedQuery = {
    ...query,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveLocalQueries(userKey, connectionId, [entry, ...existing]);
  return entry;
}

export function updateLocalQuery(
  userKey: string,
  connectionId: string,
  id: string,
  updates: Partial<Pick<SavedQuery, "title" | "tags" | "isFavorite" | "sql">>
): SavedQuery[] {
  const existing = loadLocalQueries(userKey, connectionId);
  const updated = existing.map((q) =>
    q.id === id ? { ...q, ...updates, updatedAt: new Date().toISOString() } : q
  );
  saveLocalQueries(userKey, connectionId, updated);
  return updated;
}

export function deleteLocalQuery(userKey: string, connectionId: string, id: string): SavedQuery[] {
  const updated = loadLocalQueries(userKey, connectionId).filter((q) => q.id !== id);
  saveLocalQueries(userKey, connectionId, updated);
  return updated;
}
