// Who may change a post or a comment (ADR-02, AC14, AC15). One rule for both:
// posts and comments call these. The server still decides; this only chooses
// which buttons to show.

import { isAdmin, type Session } from "./token";

/** True only for the author. No session, or content with no author, gives false. */
export function canEditContent(session: Session | null, userId: number | null): boolean {
  return session !== null && userId !== null && session.userId === userId;
}

/** True for the author or an admin. No session, or content with no author, gives false. */
export function canDeleteContent(session: Session | null, userId: number | null): boolean {
  if (session === null || userId === null) {
    return false;
  }
  return session.userId === userId || isAdmin(session);
}
