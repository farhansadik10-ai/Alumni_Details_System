import { AlumniDTO, AlumniQuery } from "@alumni/dal";

export class AlumniManager {
  alumniQuery: AlumniQuery;

  constructor() {
    this.alumniQuery = new AlumniQuery();
  }

  // Gives back undefined when the user already has a profile.
  public async createAlumni(alumni: AlumniDTO) {
    const newAlumni = await this.alumniQuery.createAlumni(alumni);
    return newAlumni;
  }

  public async findAlumniByEmail(email: string) {
    const alumni = await this.alumniQuery.findAlumniByEmail(email);
    return alumni;
  }

  public async findAlumniById(id: number) {
    const alumni = await this.alumniQuery.findAlumniById(id);
    return alumni;
  }

  public async findAlumniByUserId(userId: number) {
    const alumni = await this.alumniQuery.findAlumniByUserId(userId);
    return alumni;
  }

  public async updateAlumni(
    id: number,
    data: Parameters<AlumniQuery["updateAlumni"]>[1],
  ) {
    const updatedAlumni = await this.alumniQuery.updateAlumni(id, data);
    return updatedAlumni;
  }

  public async listAlumni(
    filter: Parameters<AlumniQuery["listAlumni"]>[0],
    page: Parameters<AlumniQuery["listAlumni"]>[1],
  ) {
    const alumniPage = await this.alumniQuery.listAlumni(filter, page);
    return alumniPage;
  }

  public async getFilterValues() {
    const filterValues = await this.alumniQuery.getFilterValues();
    return filterValues;
  }
}
