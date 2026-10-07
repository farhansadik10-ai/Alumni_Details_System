import type {
  Alumni,
  AlumniFilters,
  CreateAlumniDTO,
  Paged,
  UpdateAlumniDTO,
} from "@alumni/shared";
import { apiClient } from "./apiClient";

const ALUMNI_PATH = "/api/alumni";
// The server registers these two above "/:id" (G36); they are only called here.
const FILTERS_PATH = `${ALUMNI_PATH}/filters`;
const MY_PROFILE_PATH = `${ALUMNI_PATH}/me`;

/**
 * The query of GET /api/alumni. A key left out is no filter. `limit` is never
 * sent: the server's default page size is used.
 */
export interface AlumniListParams {
  q?: string;
  department?: string;
  graduation_year?: number;
  field?: string;
  // The server accepts only the text "true"; anything else is a 400.
  mentoring?: "true";
  page?: number;
}

// A cancelled call (its `signal` aborted) rejects; tell it apart from a
// failure with `isCancelled` from apiError.ts.

export async function listAlumni(
  params: AlumniListParams,
  signal?: AbortSignal,
): Promise<Paged<Alumni>> {
  const response = await apiClient.get<Paged<Alumni>>(ALUMNI_PATH, {
    params,
    signal,
  });
  return response.data;
}

export async function getAlumniFilters(
  signal?: AbortSignal,
): Promise<AlumniFilters> {
  const response = await apiClient.get<AlumniFilters>(FILTERS_PATH, { signal });
  return response.data;
}

/** The logged-in user's own profile. A 404 means they have none yet. */
export async function getMyAlumni(): Promise<Alumni> {
  const response = await apiClient.get<Alumni>(MY_PROFILE_PATH);
  return response.data;
}

export async function getAlumni(
  id: number,
  signal?: AbortSignal,
): Promise<Alumni> {
  const response = await apiClient.get<Alumni>(`${ALUMNI_PATH}/${id}`, {
    signal,
  });
  return response.data;
}

/** A 409 means this user already has a profile (ADR-03). */
export async function createAlumni(body: CreateAlumniDTO): Promise<Alumni> {
  const response = await apiClient.post<Alumni>(ALUMNI_PATH, body);
  return response.data;
}

/** Only the fields sent are written; null clears a field. */
export async function updateAlumni(
  id: number,
  body: UpdateAlumniDTO,
): Promise<Alumni> {
  const response = await apiClient.put<Alumni>(`${ALUMNI_PATH}/${id}`, body);
  return response.data;
}
