import type { BaseDTO } from "./BaseDTO";

// Mirrors the "User" table in db/schema.md. Every column the table shows
// without "not null" is typed `T | null` (gotcha G31).
export class UserDTO implements BaseDTO {
  id!: number;
  name: string | null;
  email: string;
  password: string;
  role: string | null;
  photo_url: string | null;
  login_at: Date | null;
  logout_at: Date | null;
  created_at: Date | null;
  updated_at: Date | null;

  constructor(
    name: string | null | undefined,
    email: string,
    password: string,
    role?: string | null,
    photo_url?: string | null,
  ) {
    this.name = name ?? null;
    this.email = email;
    this.password = password;
    this.role = role ?? null;
    this.photo_url = photo_url ?? null;
    const now = new Date();
    this.login_at = now;
    this.logout_at = now;
    this.created_at = now;
    this.updated_at = now;
  }
}

/** A user as the API may show it: every column except the password hash. */
export type PublicUserDTO = Omit<UserDTO, "password">;
