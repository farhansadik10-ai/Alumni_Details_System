import type { Role } from "../constants/roles";

// Claims signed by the backend's login(): jwt.sign({ sub, role }, secret, { expiresIn: "1h" }).
export interface JwtPayload {
  sub: number;
  role: string;
  iat?: number;
  exp?: number;
}

// The logged-in user, read from the token (login returns only { token }).
export interface CurrentUser {
  id: number;
  role: Role;
  // Milliseconds since epoch; null when the token carries no `exp`.
  expiresAt: number | null;
}
