// The address a visitor asked for before being sent to log in.

export interface ReturnAddress {
  pathname: string;
  search: string;
  hash: string;
}

/**
 * The address RequireAuth handed over, or null. Router state can be anything,
 * so every part is checked. Only an address inside the app is accepted: the
 * path must start with one "/" and not be "//" or "/\" (both can mean another
 * site to a browser). A search or hash that is not text becomes "".
 */
export function readReturnAddress(state: unknown): ReturnAddress | null {
  if (typeof state !== "object" || state === null) {
    return null;
  }
  const from: unknown = (state as { from?: unknown }).from;
  if (typeof from !== "object" || from === null) {
    return null;
  }
  const { pathname, search, hash } = from as Record<string, unknown>;
  if (
    typeof pathname !== "string" ||
    !pathname.startsWith("/") ||
    pathname.startsWith("//") ||
    pathname.startsWith("/\\")
  ) {
    return null;
  }
  return {
    pathname,
    search: typeof search === "string" ? search : "",
    hash: typeof hash === "string" ? hash : "",
  };
}
