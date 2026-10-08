// The directory's search, filters and page, as kept in the address (AC5, AC7).
// The address is the truth: the page reads it through readDirectoryQuery and
// writes it through writeDirectoryQuery, so a bad value never reaches the page.

import { readPageParam, singleParam } from "./addressParams";

/** The directory query after reading the address. Defaults mean "not set". */
export interface DirectoryQuery {
  q: string;
  department: string;
  graduationYear: number | null;
  field: string;
  mentoring: boolean;
  page: number;
}

export const DEFAULT_DIRECTORY_QUERY: DirectoryQuery = {
  q: "",
  department: "",
  graduationYear: null,
  field: "",
  mentoring: false,
  page: 1,
};

/**
 * The query of GET /api/alumni. The same shape as `AlumniListParams` in
 * services/alumniService.ts; it is repeated here because lib/ does not import
 * services/.
 */
export interface DirectoryListParams {
  q?: string;
  department?: string;
  graduation_year?: number;
  field?: string;
  mentoring?: "true";
  page?: number;
}

// The address keys, in the order they are written (the same query always
// gives the same address text).
const Q_KEY = "q";
const DEPARTMENT_KEY = "department";
const YEAR_KEY = "graduation_year";
const FIELD_KEY = "field";
const MENTORING_KEY = "mentoring";
const PAGE_KEY = "page";

const YEAR_PATTERN = /^[0-9]{4}$/;
// The server compares department and field with btrim, which strips spaces
// only (ADV-004). A tab or a line break in an option must survive the trip.
const OUTER_SPACES = /^ +| +$/g;

/**
 * Reads the directory query from the address. Anything bad falls back to its
 * default (AC7): a page that is not 1 to 9999999 is 1, a year that is not
 * exactly four digits is no year, mentoring is on only for the text "true".
 * No text is dropped for its length: the server accepts any length (ADV-004).
 */
export function readDirectoryQuery(params: URLSearchParams): DirectoryQuery {
  const q = singleParam(params, Q_KEY);
  const department = singleParam(params, DEPARTMENT_KEY);
  const year = singleParam(params, YEAR_KEY);
  const field = singleParam(params, FIELD_KEY);
  return {
    q: q === null ? "" : q.trim(),
    department: department === null ? "" : department.replace(OUTER_SPACES, ""),
    graduationYear: year !== null && YEAR_PATTERN.test(year) ? Number(year) : null,
    field: field === null ? "" : field.replace(OUTER_SPACES, ""),
    mentoring: singleParam(params, MENTORING_KEY) === "true",
    page: readPageParam(params),
  };
}

/** The address for a query: only the values that are set; page 1 is left out (AC5). */
export function writeDirectoryQuery(query: DirectoryQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q !== "") {
    params.set(Q_KEY, query.q);
  }
  if (query.department !== "") {
    params.set(DEPARTMENT_KEY, query.department);
  }
  if (query.graduationYear !== null) {
    params.set(YEAR_KEY, String(query.graduationYear).padStart(4, "0"));
  }
  if (query.field !== "") {
    params.set(FIELD_KEY, query.field);
  }
  if (query.mentoring) {
    params.set(MENTORING_KEY, "true");
  }
  if (query.page > 1) {
    params.set(PAGE_KEY, String(query.page));
  }
  return params;
}

/**
 * The directory with only "open to mentoring" on, for the "See all" links on
 * the Feed and the Dashboard. Written by writeDirectoryQuery, so it is always
 * the address the directory itself would write. The caller passes the
 * directory's path (lib/ does not import routes/).
 */
export function mentoringDirectoryAddress(directoryPath: string): { pathname: string; search: string } {
  return {
    pathname: directoryPath,
    search: `?${writeDirectoryQuery({ ...DEFAULT_DIRECTORY_QUERY, mentoring: true }).toString()}`,
  };
}

/** The request query for the list. `limit` is never sent (the server's page size is used). */
export function toListParams(query: DirectoryQuery): DirectoryListParams {
  const params: DirectoryListParams = {};
  if (query.q !== "") {
    params.q = query.q;
  }
  if (query.department !== "") {
    params.department = query.department;
  }
  if (query.graduationYear !== null) {
    params.graduation_year = query.graduationYear;
  }
  if (query.field !== "") {
    params.field = query.field;
  }
  if (query.mentoring) {
    params.mentoring = "true";
  }
  if (query.page > 1) {
    params.page = query.page;
  }
  return params;
}

/** How many filters are set, for "Filters (2)" (AC13). The search text is not a filter. */
export function activeFilterCount(query: DirectoryQuery): number {
  return [
    query.department !== "",
    query.graduationYear !== null,
    query.field !== "",
    query.mentoring,
  ].filter(Boolean).length;
}

/** True when the search text or any filter is set: an empty result then offers "Clear" (AC11). */
export function hasCriteria(query: DirectoryQuery): boolean {
  return query.q !== "" || activeFilterCount(query) > 0;
}
