import { isRole } from "../constants/roles";
import type { CurrentUser, JwtPayload } from "../types/auth";

// Decodes the payload only. The signature is checked by the backend, never here.
export function decodeJwt(token: string): JwtPayload | null {
  const part = token.split(".")[1];
  if (!part) return null;

  try {
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));

    if (typeof payload !== "object" || payload === null) return null;
    const { sub, role, iat, exp } = payload as Record<string, unknown>;
    const id = typeof sub === "string" ? Number(sub) : sub;
    if (typeof id !== "number" || !Number.isInteger(id) || typeof role !== "string") return null;

    return {
      sub: id,
      role,
      iat: typeof iat === "number" ? iat : undefined,
      exp: typeof exp === "number" ? exp : undefined,
    };
  } catch {
    return null;
  }
}

export function toCurrentUser(token: string | null): CurrentUser | null {
  if (!token) return null;
  const payload = decodeJwt(token);
  if (!payload || !isRole(payload.role)) return null;

  return {
    id: payload.sub,
    role: payload.role,
    expiresAt: payload.exp !== undefined ? payload.exp * 1000 : null,
  };
}

export function isExpired(user: CurrentUser, now: number = Date.now()): boolean {
  return user.expiresAt !== null && user.expiresAt <= now;
}
