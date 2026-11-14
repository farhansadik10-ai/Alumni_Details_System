import pool from "../config/db";

/** The value of "User".role that counts as a student. */
const STUDENT_ROLE = "student";

export class StatsQuery {
  constructor() {}

  /**
   * The four dashboard numbers in one statement: alumni profiles, users whose
   * role is student, posts, and alumni profiles open to mentoring.
   *
   * COUNT(*) is a bigint, which `pg` hands back as a string; the ::int casts
   * make each one a JavaScript number.
   */
  public async getCounts(): Promise<{
    alumni: number;
    students: number;
    posts: number;
    mentoring: number;
  }> {
    const info = await pool.query(
      `SELECT
        (SELECT COUNT(*)::int FROM alumni) AS alumni,
        (SELECT COUNT(*)::int FROM "User" WHERE role = $1) AS students,
        (SELECT COUNT(*)::int FROM posts) AS posts,
        (SELECT COUNT(*)::int FROM alumni WHERE mentorship_available = true) AS mentoring`,
      [STUDENT_ROLE],
    );
    return info.rows[0];
  }
}
