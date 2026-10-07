import axios from "axios";

// What a screen may know about a failed call. The server's own text is never
// passed on: each screen chooses its words from `kind` and `status`.
export type ApiFailure =
  | { kind: "network" }
  | { kind: "http"; status: number };

/** The server answered with an error status: "http". Anything else: "network". */
export function toApiFailure(error: unknown): ApiFailure {
  if (axios.isAxiosError(error) && error.response !== undefined) {
    return { kind: "http", status: error.response.status };
  }
  return { kind: "network" };
}
