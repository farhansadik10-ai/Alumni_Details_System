import { Request, Response } from "express";
import { StatsManager } from "@alumni/businesslogic";

export class StatsController {
  private readonly statsManager = new StatsManager();

  /** GET /api/stats: `{ alumni, students, posts, mentoring }`. Errors go to the error middleware. */
  public async getStats(req: Request, res: Response) {
    const counts = await this.statsManager.getCounts();
    res.status(200).json(counts);
  }
}
