import axios from "axios";

// What a screen may know about a failed call. The server's own text is never
// passed on: each screen chooses its words from `kind` and `status`.
export type ApiFailure =
  | { kind: "network" }
  | { kind: "http"; status: number };

/**
 * True when the call was cancelled (its `signal` was aborted), which is not a
 * failure: check this before `toApiFailure`, which would call it "network".
 */
export function isCancelled(error: unknown): boolean {
  return axios.isCancel(error);
}

/** The server answered with an error status: "http". Anything else: "network". */
export function toApiFailure(error: unknown): ApiFailure {
  if (axios.isAxiosError(error) && error.response !== undefined) {
    return { kind: "http", status: error.response.status };
  }
  return { kind: "network" };
}
