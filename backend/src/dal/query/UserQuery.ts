import pool from "../config/db.js";
import { UserDTO, PublicUserDTO } from "../dto/UserDTO.js";
import { buildUpdateSet } from "./updateSet.js";

// Every "User" column except password. Used in place of `*` so the hash is
// never read by a query whose result can reach a response.
const PUBLIC_USER_COLUMNS =
  "id, name, email, role, photo_url, login_at, logout_at, created_at, updated_at";

// The only columns updateUser may write. Column names in its SQL come from
// this list, never from the request.
const UPDATABLE_USER_COLUMNS = ["name", "email", "password", "photo_url"] as const;

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
    data: Record<string, unknown>,
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

  // Get all users
  public async getAllUsers(): Promise<PublicUserDTO[]> {
    const info = await pool.query(
      `SELECT ${PUBLIC_USER_COLUMNS} FROM "User"`
    );

    const users: PublicUserDTO[] = [];

    for (const user of info.rows) {
      users.push(user);
    }

    return users;
  }

  // Delete user
  public async deleteUser(id: number): Promise<void> {
    await pool.query(
      `DELETE FROM "User"
       WHERE id = $1`,
      [id],
    );
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
