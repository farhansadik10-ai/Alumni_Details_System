import pool from "../config/db.js";
import { AlumniDTO } from "../dto/AlumniDTO.js";
import { buildUpdateSet } from "./updateSet.js";

// The only columns updateAlumni may write. user_id is not here on purpose.
const UPDATABLE_COLUMNS = [
  "department",
  "graduation_year",
  "current_company",
  "job_title",
  "experience",
  "bio",
  "linkedin_url",
] as const;

export class AlumniQuery {
  constructor() {}
  public async createAlumni(alumni: AlumniDTO): Promise<AlumniDTO> {
    const info = await pool.query(
      "INSERT INTO alumni (user_id, department, graduation_year, current_company, job_title, experience, bio, linkedin_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
      [
        alumni.user_id,
        alumni.department,
        alumni.graduation_year,
        alumni.current_company,
        alumni.job_title,
        alumni.experience,
        alumni.bio,
        alumni.linkedin_url,
      ],
    );
    return info.rows[0];
  }
  public async findAlumniByEmail(
    email: string,
  ): Promise<AlumniDTO | undefined> {
    const info = await pool.query(
      `SELECT a.*, u.name, u.email, u.photo_url FROM alumni a LEFT JOIN "User" u ON u.id = a.user_id WHERE u.email = $1`,
      [email],
    );
    return info.rows[0];
  }

  public async findAlumniById(id: number): Promise<AlumniDTO> {
    const info = await pool.query(
      `SELECT a.*, u.name, u.email, u.photo_url FROM alumni a LEFT JOIN "User" u ON u.id = a.user_id WHERE a.id = $1`,
      [id],
    );
    return info.rows[0];
  }

  public async updateAlumni(
    id: number,
    alumni: Partial<AlumniDTO>,
  ): Promise<AlumniDTO> {
    const { assignments, values } = buildUpdateSet(alumni, UPDATABLE_COLUMNS);

    // Nothing was sent: write nothing and return the row as it is, with the
    // alumni columns only, the same shape the UPDATE returns.
    if (assignments.length === 0) {
      const current = await pool.query(`SELECT * FROM alumni WHERE id = $1`, [
        id,
      ]);
      return current.rows[0];
    }

    const info = await pool.query(
      `UPDATE alumni SET ${assignments.join(", ")}, updated_at = NOW() WHERE id = $${values.length + 1} RETURNING *`,
      [...values, id],
    );
    return info.rows[0];
  }

  public async getAllAlumni(): Promise<AlumniDTO[]> {
    const info = await pool.query(
      `SELECT a.*, u.name, u.email, u.photo_url FROM alumni a LEFT JOIN "User" u ON u.id = a.user_id`,
    );
     const alumnis: AlumniDTO[] = [];
            for (const alumni of info.rows) {
                alumnis.push(alumni);
            }
            return alumnis;
  }
}
