import pool from "../config/db.js";
import { AlumniDTO } from "../dto/AlumniDTO.js";
import { likePattern } from "./listHelpers.js";
import type { PageRequest, PageRows } from "./listHelpers.js";
import { withTransaction } from "./transaction.js";
import { buildUpdateSet } from "./updateSet.js";
import type { UpdateFields } from "./updateSet.js";

// The only columns updateAlumni may write. user_id is not here on purpose.
const UPDATABLE_COLUMNS = [
  "department",
  "graduation_year",
  "current_company",
  "job_title",
  "experience",
  "bio",
  "linkedin_url",
  "mentorship_available",
  "field",
] as const;

export type AlumniUpdateColumn = (typeof UPDATABLE_COLUMNS)[number];

// The joined FROM that every alumni read and the list count share.
const ALUMNI_FROM = `FROM alumni a LEFT JOIN "User" u ON u.id = a.user_id`;

// The one alumni read: the alumni columns plus the user's name, email and
// photo. Never u.* and never the password column.
const ALUMNI_READ = `SELECT a.*, u.name, u.email, u.photo_url ${ALUMNI_FROM}`;

// First key of the advisory lock createAlumni takes; the second key is the
// user's id. The number only has to differ from any other two-key advisory
// lock in this database.
const ALUMNI_CREATE_LOCK_KEY = 7301;

export interface AlumniListFilter {
  q?: string;
  department?: string;
  graduation_year?: number;
  field?: string;
  mentoring?: boolean;
}

export interface AlumniFilterValues {
  departments: string[];
  graduation_years: number[];
  fields: string[];
}

export class AlumniQuery {
  constructor() {}

  /**
   * Creates the user's alumni profile. Returns `undefined`, and writes
   * nothing, when that user already has one.
   *
   * alumni.user_id has no UNIQUE constraint, so the check and the insert run
   * in one transaction behind a per-user lock: a second create for the same
   * user waits for the first to finish and then sees its row.
   *
   * The new profile is returned through the joined read, so a create answers
   * with the same shape as every alumni read (name, email, photo_url).
   */
  public async createAlumni(alumni: AlumniDTO): Promise<AlumniDTO | undefined> {
    return withTransaction(async (client) => {
      await client.query(`SELECT pg_advisory_xact_lock($1::int, $2::int)`, [
        ALUMNI_CREATE_LOCK_KEY,
        alumni.user_id,
      ]);

      const existing = await client.query(
        `SELECT 1 FROM alumni WHERE user_id = $1 LIMIT 1`,
        [alumni.user_id],
      );
      if (existing.rows.length > 0) {
        return undefined;
      }

      const inserted = await client.query(
        "INSERT INTO alumni (user_id, department, graduation_year, current_company, job_title, experience, bio, linkedin_url, mentorship_available, field) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id",
        [
          alumni.user_id,
          alumni.department,
          alumni.graduation_year,
          alumni.current_company,
          alumni.job_title,
          alumni.experience,
          alumni.bio,
          alumni.linkedin_url,
          alumni.mentorship_available ?? false,
          alumni.field,
        ],
      );

      // The joined re-read runs on the transaction's own client, before the
      // transaction ends. The row is not committed yet, so only this
      // connection can see it; pool.query here would find nothing.
      const info = await client.query(`${ALUMNI_READ} WHERE a.id = $1`, [
        inserted.rows[0].id,
      ]);
      return info.rows[0];
    });
  }

  public async findAlumniByEmail(
    email: string,
  ): Promise<AlumniDTO | undefined> {
    const info = await pool.query(`${ALUMNI_READ} WHERE u.email = $1`, [email]);
    return info.rows[0];
  }

  public async findAlumniById(id: number): Promise<AlumniDTO | undefined> {
    const info = await pool.query(`${ALUMNI_READ} WHERE a.id = $1`, [id]);
    return info.rows[0];
  }

  public async findAlumniByUserId(
    userId: number,
  ): Promise<AlumniDTO | undefined> {
    const info = await pool.query(
      `${ALUMNI_READ} WHERE a.user_id = $1 ORDER BY a.id LIMIT 1`,
      [userId],
    );
    return info.rows[0];
  }

  /**
   * Writes only the fields present in `data`. Returns the updated profile
   * through the joined read, the same shape every alumni read has, or
   * `undefined` when no profile has this id. With nothing to write it runs no
   * UPDATE and returns the current profile.
   */
  public async updateAlumni(
    id: number,
    data: UpdateFields<AlumniUpdateColumn>,
  ): Promise<AlumniDTO | undefined> {
    const { assignments, values } = buildUpdateSet(data, UPDATABLE_COLUMNS);

    if (assignments.length === 0) {
      return this.findAlumniById(id);
    }

    const updated = await pool.query(
      `UPDATE alumni SET ${assignments.join(", ")}, updated_at = NOW() WHERE id = $${values.length + 1} RETURNING id`,
      [...values, id],
    );
    if (updated.rows.length === 0) {
      return undefined;
    }
    return this.findAlumniById(id);
  }

  /**
   * One page of alumni, newest profile first, plus how many match in all.
   * A filter that is not set adds no condition.
   */
  public async listAlumni(
    filter: AlumniListFilter,
    page: PageRequest,
  ): Promise<PageRows<AlumniDTO>> {
    const conditions: string[] = [];
    const values: Array<string | number> = [];

    // Each push adds one value, so values.length is that value's $n.
    if (filter.q !== undefined) {
      values.push(likePattern(filter.q));
      const n = values.length;
      conditions.push(
        `(u.name ILIKE $${n} OR a.current_company ILIKE $${n} OR a.job_title ILIKE $${n})`,
      );
    }
    if (filter.department !== undefined) {
      values.push(filter.department);
      conditions.push(`btrim(a.department) = $${values.length}`);
    }
    if (filter.graduation_year !== undefined) {
      values.push(filter.graduation_year);
      conditions.push(`a.graduation_year = $${values.length}`);
    }
    if (filter.field !== undefined) {
      values.push(filter.field);
      conditions.push(`btrim(a.field) = $${values.length}`);
    }
    if (filter.mentoring === true) {
      conditions.push(`a.mentorship_available = true`);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const count = await pool.query(
      `SELECT COUNT(*)::int AS total ${ALUMNI_FROM} ${where}`,
      values,
    );

    const info = await pool.query(
      `${ALUMNI_READ} ${where} ORDER BY a.id DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, page.limit, page.offset],
    );

    return { rows: info.rows, total: count.rows[0].total };
  }

  /** The choices the list filters offer: only values some profile has. */
  public async getFilterValues(): Promise<AlumniFilterValues> {
    const departments = await pool.query(
      `SELECT DISTINCT btrim(department) AS value FROM alumni WHERE department IS NOT NULL AND btrim(department) <> '' ORDER BY value`,
    );
    const years = await pool.query(
      `SELECT DISTINCT graduation_year FROM alumni WHERE graduation_year IS NOT NULL ORDER BY graduation_year`,
    );
    const fields = await pool.query(
      `SELECT DISTINCT btrim(field) AS value FROM alumni WHERE field IS NOT NULL AND btrim(field) <> '' ORDER BY value`,
    );

    return {
      departments: departments.rows.map((row) => row.value),
      graduation_years: years.rows.map((row) => row.graduation_year),
      fields: fields.rows.map((row) => row.value),
    };
  }
}
