// Reads what a login token says about its user. Payload only: the frontend
// never checks the signature, the server does (ADR-14).

export type Role = "student" | "alumni" | "admin";

export interface Session {
  userId: number;
  // null when the token carries no role or one we do not know (G42).
  // Such a user is still logged in.
  role: Role | null;
  // Milliseconds since 1970, or null when the token has no expiry.
  expiresAt: number | null;
}

const ROLES: readonly Role[] = ["student", "alumni", "admin"];
const TOKEN_PART_COUNT = 3;
const PAYLOAD_PART_INDEX = 1;
const BASE64_BLOCK_LENGTH = 4;
const MS_PER_SECOND = 1000;

function decodeBase64Url(text: string): string {
  const base64 = text.replaceAll("-", "+").replaceAll("_", "/");
  const missing =
    (BASE64_BLOCK_LENGTH - (base64.length % BASE64_BLOCK_LENGTH)) %
    BASE64_BLOCK_LENGTH;
  const binary = atob(base64 + "=".repeat(missing));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function toRole(value: unknown): Role | null {
  return ROLES.find((role) => role === value) ?? null;
}

/** The session a token describes, or null when the token cannot be read. */
export function readToken(token: string): Session | null {
  const parts = token.split(".");
  if (parts.length !== TOKEN_PART_COUNT) {
    return null;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(decodeBase64Url(parts[PAYLOAD_PART_INDEX]));
  } catch {
    return null;
  }
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return null;
  }

  const { sub, role, exp } = payload as Record<string, unknown>;
  // The backend always signs a number, so "12" is refused.
  if (typeof sub !== "number" || !Number.isSafeInteger(sub)) {
    return null;
  }

  let expiresAt: number | null = null;
  if (exp !== undefined) {
    if (typeof exp !== "number" || !Number.isFinite(exp)) {
      return null;
    }
    expiresAt = exp * MS_PER_SECOND;
  }

  return { userId: sub, role: toRole(role), expiresAt };
}

/** True from the expiry moment on. A session with no expiry never expires here. */
export function isExpired(session: Session, now: number): boolean {
  return session.expiresAt !== null && now >= session.expiresAt;
}

/** A session that exists and has not run out on this clock. */
export function isLiveSession(session: Session | null, now: number): session is Session {
  return session !== null && !isExpired(session, now);
}

/** True only for a known admin role. A null session or a null role is not an admin. */
export function isAdmin(session: Session | null): boolean {
  return session?.role === "admin";
}

/**
 * True for alumni and admin: they may write posts and have an alumni profile
 * (ADR-02). A student, an unknown role or no role gives false. The server
 * still decides; this only chooses what the page shows.
 */
export function canWritePosts(role: Role | null): boolean {
  return role === "alumni" || role === "admin";
}
