import { BaseDTO } from "./BaseDTO";

// Mirrors the alumni table in db/schema.md. Every column the table shows
// without "not null" is typed `T | null` (gotcha G31).
export class AlumniDTO implements BaseDTO {
  id!: number;
  user_id: number | null;
  graduation_year: number | null = null;
  department: string | null;
  current_company: string | null;
  job_title: string | null;
  experience: string | null;
  bio: string | null;
  linkedin_url: string | null;
  mentorship_available: boolean;
  field: string | null;
  updated_at: Date | null;
  // Read from the joined "User" row; never written to alumni (gotcha G25).
  name?: string | null;
  email?: string | null;
  photo_url?: string | null;

  constructor(
    user_id?: number | null,
    department?: string | null,
    current_company?: string | null,
    job_title?: string | null,
    experience?: string | null,
    bio?: string | null,
    linkedin_url?: string | null,
    mentorship_available: boolean = false,
    field: string | null = null,
  ) {
    this.user_id = user_id ?? null;
    this.department = department ?? null;
    this.current_company = current_company ?? null;
    this.job_title = job_title ?? null;
    this.experience = experience ?? null;
    this.bio = bio ?? null;
    this.linkedin_url = linkedin_url ?? null;
    this.mentorship_available = mentorship_available;
    this.field = field;
    this.updated_at = new Date();
  }
}
