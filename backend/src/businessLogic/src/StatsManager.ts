import { StatsQuery } from "@alumni/dal";

export class StatsManager {
  statsQuery: StatsQuery;

  constructor() {
    this.statsQuery = new StatsQuery();
  }

  /** How many alumni profiles, students, posts and alumni open to mentoring there are. */
  public async getCounts() {
    const counts = await this.statsQuery.getCounts();
    return counts;
  }
}
