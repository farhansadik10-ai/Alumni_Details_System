import pool from "../config/db.js";
import { UserDTO, PublicUserDTO } from "../dto/UserDTO.js";
import { buildUpdateSet } from "./updateSet.js";
import type { UpdateFields } from "./updateSet.js";
import { likePattern } from "./listHelpers.js";
import type { PageRequest, PageRows } from "./listHelpers.js";

// Every "User" column except password. Used in place of `*` so the hash is
// never read by a query whose result can reach a response.
const PUBLIC_USER_COLUMNS =
  "id, name, email, role, photo_url, login_at, logout_at, created_at, updated_at";

// The only columns updateUser may write. Column names in its SQL come from
// this list, never from the request.
const UPDATABLE_USER_COLUMNS = ["name", "email", "password", "photo_url"] as const;

/** A column `updateUser` may write. */
export type UserUpdateColumn = (typeof UPDATABLE_USER_COLUMNS)[number];

/** What `listUsers` may narrow by. A key left out means "no filter". */
export interface UserListFilter {
  /** Any part of `name` or `email`, ignoring case. */
  q?: string;
  /** The whole `role` value. */
  role?: string;
}

export class UserQuery {
  constructor() {}

  // Create new user
  public async createUser(data: UserDTO): Promise<PublicUserDTO> {
    const info = await pool.query(
      `INSERT INTO "User"
       (name, email, password, role, photo_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${PUBLIC_USER_COLUMNS}`,
      [
        data.name,
        data.email,
        data.password,
        data.role,
        data.photo_url,
      ],
    );

    return info.rows[0];
  }

  // Find user by email, without the password hash
  public async findUserByEmail(
    email: string
  ): Promise<PublicUserDTO | undefined> {
    const info = await pool.query(
      `SELECT ${PUBLIC_USER_COLUMNS} FROM "User"
       WHERE email = $1`,
      [email],
    );

    return info.rows[0];
  }

  // Find user by email, with the password hash - for login only.
  // The one read in this class that selects the hash; never send its result
  // to a client.
  public async findUserWithPasswordByEmail(
    email: string
  ): Promise<UserDTO | undefined> {
    const info = await pool.query(
      `SELECT * FROM "User"
       WHERE email = $1`,
      [email],
    );

    return info.rows[0];
  }

  // Find user by ID
  public async findUserById(id: number): Promise<PublicUserDTO | undefined> {
    const info = await pool.query(
      `SELECT ${PUBLIC_USER_COLUMNS} FROM "User"
       WHERE id = $1`,
      [id],
    );

    return info.rows[0];
  }

  // Update user - writes only the columns present in `data`.
  // Returns undefined when no user has this id.
  public async updateUser(
    id: number,
    data: UpdateFields<UserUpdateColumn>,
  ): Promise<PublicUserDTO | undefined> {
    const { assignments, values } = buildUpdateSet(data, UPDATABLE_USER_COLUMNS);

    if (assignments.length === 0) {
      return this.findUserById(id);
    }

    const info = await pool.query(
      `UPDATE "User"
       SET ${assignments.join(", ")}, updated_at = NOW()
       WHERE id = $${values.length + 1}
       RETURNING ${PUBLIC_USER_COLUMNS}`,
      [...values, id],
    );

    return info.rows[0];
  }

  // One page of users, ordered by id, plus how many users match in all.
  // Conditions and values are built together, so each `$n` is the position
  // of the value pushed just before it. The count and the page statement
  // share the same WHERE and the same leading values.
  public async listUsers(
    filter: UserListFilter,
    page: PageRequest,
  ): Promise<PageRows<PublicUserDTO>> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filter.q !== undefined) {
      values.push(likePattern(filter.q));
      const position = values.length;
      conditions.push(`(name ILIKE $${position} OR email ILIKE $${position})`);
    }

    if (filter.role !== undefined) {
      values.push(filter.role);
      conditions.push(`role = $${values.length}`);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countInfo = await pool.query(
      `SELECT COUNT(*)::int AS total FROM "User" ${where}`,
      values,
    );

    const limitPosition = values.length + 1;
    const offsetPosition = values.length + 2;
    const pageInfo = await pool.query(
      `SELECT ${PUBLIC_USER_COLUMNS} FROM "User" ${where}
       ORDER BY id
       LIMIT $${limitPosition} OFFSET $${offsetPosition}`,
      [...values, page.limit, page.offset],
    );

    return { rows: pageInfo.rows, total: countInfo.rows[0].total };
  }

  // Delete user. Returns false when no user has this id.
  // A user who still has posts, comments or an alumni profile is refused by
  // the foreign keys in the database; that error is left to the caller.
  public async deleteUser(id: number): Promise<boolean> {
    const info = await pool.query(
      `DELETE FROM "User"
       WHERE id = $1`,
      [id],
    );

    return (info.rowCount ?? 0) > 0;
  }

  // Update logout time
  public async updateLogoutTime(id: number): Promise<void> {
    await pool.query(
      `UPDATE "User"
       SET logout_at = NOW()
       WHERE id = $1`,
      [id],
    );
  }
}
