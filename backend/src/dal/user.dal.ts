import pool from '../config/db';
import { User, CreateUserDTO } from '../../../shared/types/user.types';

export async function createUser(data: CreateUserDTO): Promise<User> {
  const { name, email, password, role = 'Student', photo_url } = data;
  const result = await pool.query(
    `INSERT INTO "User" (name, email, password, role, photo_url)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, email, password, role, photo_url]
  );
  return result.rows[0];
}


export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query(
    `SELECT * FROM "User" WHERE email = $1`,
    [email]
  );
  return result.rows[0] || null;
}


export async function findUserById(id: number): Promise<User | null> {
  const result = await pool.query(
    `SELECT * FROM "User" WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}


export async function getAllUsers(): Promise<User[]> {
  const result = await pool.query(
    `SELECT * FROM "User"`
  );
  return result.rows;
}


export async function updateUser(id: number, data: Partial<User>): Promise<User> {
  const { name, photo_url } = data;
  const result = await pool.query(
    `UPDATE "User" SET name=$1, photo_url=$2, updated_at=NOW()
     WHERE id=$3 RETURNING *`,
    [name, photo_url, id]
  );
  return result.rows[0];
}

export async function updateLoginTime(id: number): Promise<void> {
  await pool.query(
    `UPDATE "User" SET login_at=NOW() WHERE id=$1`,
    [id]
  );
}


export async function updateLogoutTime(id: number): Promise<void> {
  await pool.query(
    `UPDATE "User" SET logout_at=NOW() WHERE id=$1`,
    [id]
  );
}


export async function deleteUser(id: number): Promise<void> {
  await pool.query(
    `DELETE FROM "User" WHERE id = $1`,
    [id]
  );
}