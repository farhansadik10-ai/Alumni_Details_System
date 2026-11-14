// "The latest request wins" for one loader. Starting a new call aborts the
// one before it, and an answer that still arrives for an older call is
// dropped by its ticket (AC10, G48: StrictMode starts every effect twice).

/** One call's handle: pass `signal` to the service, check `isCurrent()` after it answers. */
export interface RequestTicket {
  signal: AbortSignal;
  isCurrent: () => boolean;
}

export interface LatestRequest {
  /** Aborts the previous call and returns the ticket of the new one. */
  begin: () => RequestTicket;
  /** Aborts the current call; its answer, if one still comes, is dropped. */
  cancel: () => void;
}

export function createLatestRequest(): LatestRequest {
  let latest = 0;
  let controller: AbortController | null = null;

  const cancel = (): void => {
    controller?.abort();
    controller = null;
    latest += 1;
  };

  const begin = (): RequestTicket => {
    cancel();
    const ticket = latest;
    const current = new AbortController();
    controller = current;
    return {
      signal: current.signal,
      isCurrent: () => ticket === latest,
    };
  };

  return { begin, cancel };
}
