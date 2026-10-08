import type { Stats } from "@alumni/shared";
import { apiClient } from "./apiClient";

const STATS_PATH = "/api/stats";

/** The four counts: alumni, students, posts, mentoring. */
export async function getStats(signal?: AbortSignal): Promise<Stats> {
  const response = await apiClient.get<Stats>(STATS_PATH, { signal });
  return response.data;
}
