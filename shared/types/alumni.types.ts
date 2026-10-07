// An alumni profile as the API answers it: the alumni columns plus the
// owner's name, email and photo from the joined "User" row. The three joined
// fields are null when the profile has no user.
// updated_at travels as JSON, so it is an ISO date string, not a Date.
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
  updated_at: string | null;
  name: string | null;
  email: string | null;
  photo_url: string | null;
}

// The body of POST /api/alumni. The profile's user comes from the login
// token, never from the body. A field left out is stored as null
// (mentorship_available as false); null is accepted and means the same.
// mentorship_available is true or false only: null is refused.
export interface CreateAlumniDTO {
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

// The body of PUT /api/alumni/:id. Only the fields that are sent are written;
// null clears a field. At least one field must be sent.
// mentorship_available is true or false only: null is refused.
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
