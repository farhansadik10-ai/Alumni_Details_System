import pool from "../config/db.js";
import { UserDTO } from "../dto/UserDTO.js";

export class UserQuery {
  constructor() {}

  public async createUser(data: UserDTO): Promise<UserDTO> {
    const info = await pool.query(
      "INSERT INTO User (name , email , password, role) VALUES ($1,$2,$3,$4) RETURNING *",
      [data.name, data.email, data.password, data.role],
    );
    return info.rows[0];
  }
  public async findUserByEmail(email: string): Promise<UserDTO | undefined> {
    const info = await pool.query("SELECT * FROM User WHERE email = $1", [
      email,
    ]);
    return info.rows[0];
  }

  public async findUserById(id: number): Promise<UserDTO> {
    const info = await pool.query("SELECT * FROM User WHERE id = $1", [id]);
    return info.rows[0];
  }

  public async updateUser(
    id: number,
    data: Partial<UserDTO>,
  ): Promise<UserDTO> {
    const info = await pool.query(
      `UPDATE User SET name=$1, photo_url=$2, password=$3,email=$4, updated_at=NOW() WHERE id=$4 RETURNING *`,
      [data.name, data.photo_url, data.password, data.email, id],
    );
    return info.rows[0];
  }

  public async getAllUsers(): Promise<UserDTO[]> {
    const info = await pool.query("SELECT * FROM User");
    const User: UserDTO[] = [];
    for (const user of info.rows) {
      console.log(user);
      User.push(user);
    }
    return User;
   
  }
  public async deleteUser(id: number): Promise<void> {
    await pool.query("DELETE FROM User WHERE id = $1", [id]);
  }
  public async updateLoginTime(id: number): Promise<void> {
    await pool.query("UPDATE User SET login_at=NOW() WHERE id=$1", [id]);
  }
  public async updateLogoutTime(id: number): Promise<void> {
    await pool.query("UPDATE User SET logout_at=NOW() WHERE id=$1", [id]);
  }
}
