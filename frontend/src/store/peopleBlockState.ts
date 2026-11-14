// The one mapper from the people atom's state to what PeopleBlock draws. The
// Feed wants "mentoring" and the Dashboard "newest"; they share one atom.

import type { PeopleBlockState } from "../components/alumni/PeopleBlock/PeopleBlock";
import type { PeopleKind, PeopleState } from "./postAtoms";

/**
 * The atom carries "idle" and the kind it was loaded for; the block draws only
 * loading, ready and error. An idle state, or one loaded for another kind, is
 * "loading", so a page never shows a frame of the other page's list (pattern 23).
 */
export function toPeopleBlockState(state: PeopleState, kind: PeopleKind): PeopleBlockState {
  if (state.status === "idle" || state.kind !== kind) {
    return { status: "loading", items: [], failure: null };
  }
  return { status: state.status, items: state.items, failure: state.failure };
}
