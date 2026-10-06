import { UserDTO, UserQuery } from "@alumni/dal";

export class UserManager {
  userQuery: UserQuery;

  constructor() {
    this.userQuery = new UserQuery();
  }

  public async createUser(user: UserDTO) {
    const newUser = await this.userQuery.createUser(user);
    return newUser;
  }

  public async findUserByEmail(email: string) {
    const user = await this.userQuery.findUserByEmail(email);
    return user;
  }

  // The only read that returns the password hash. For login only; never send
  // its result to a client.
  public async findUserForLogin(email: string) {
    const user = await this.userQuery.findUserWithPasswordByEmail(email);
    return user;
  }

  public async findUserById(id: number) {
    const user = await this.userQuery.findUserById(id);
    return user;
  }

  // `fields` holds only the columns to change; anything left out is untouched.
  public async updateUser(id: number, fields: Record<string, unknown>) {
    const updatedUser = await this.userQuery.updateUser(id, fields);
    return updatedUser;
  }

  public async getAllUsers() {
    const allUsers = await this.userQuery.getAllUsers();
    return allUsers;
  }

  public async deleteUser(id: number) {
    const deletedUser = await this.userQuery.deleteUser(id);
    return deletedUser;
  }

  public async updateLogoutTime(id: number) {
    await this.userQuery.updateLogoutTime(id);
  }
}
