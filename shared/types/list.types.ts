// One page of a list endpoint (ADR-12).
export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// The values the alumni directory can filter on.
export interface AlumniFilters {
  departments: string[];
  graduation_years: number[];
  fields: string[];
}

// The counts shown on the landing page.
export interface Stats {
  alumni: number;
  students: number;
  posts: number;
  mentoring: number;
}
