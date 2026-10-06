// An alumni profile as the API answers it: the alumni columns plus the
// owner's name, email and photo from the joined "User" row. The three joined
// fields are null when the profile has no user.
export interface Alumni {
  id: number;
  user_id: number | null;
  graduation_year: number | null;
  department: string | null;
  current_company: string | null;
  job_title: string | null;
  experience: string | null;
  bio: string | null;
  linkedin_url: string | null;
  mentorship_available: boolean;
  field: string | null;
  updated_at: Date | null;
  name: string | null;
  email: string | null;
  photo_url: string | null;
}

// The profile's user comes from the login token, never from the body.
export interface CreateAlumniDTO {
  graduation_year?: number;
  department?: string;
  current_company?: string;
  job_title?: string;
  experience?: string;
  bio?: string;
  linkedin_url?: string;
  mentorship_available?: boolean;
  field?: string | null;
}

// Only the fields that are sent are written; null clears a field.
export interface UpdateAlumniDTO {
  graduation_year?: number | null;
  department?: string | null;
  current_company?: string | null;
  job_title?: string | null;
  experience?: string | null;
  bio?: string | null;
  linkedin_url?: string | null;
  mentorship_available?: boolean;
  field?: string | null;
}
