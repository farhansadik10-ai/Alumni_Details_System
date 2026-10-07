import { classifyDbError, UserDTO, UserQuery } from "@alumni/dal";
import { ConflictError } from "./errors";

// The unique constraint on "User".email, as named in db/schema.md.
const USER_EMAIL_CONSTRAINT = "User_email_key";
const EMAIL_TAKEN_MESSAGE = "This email is already registered";
const USER_HAS_CONTENT_MESSAGE =
  "This user has posts, comments or an alumni profile and cannot be deleted";

type UserUpdateFields = Parameters<UserQuery["updateUser"]>[1];
type UserListFilter = Parameters<UserQuery["listUsers"]>[0];
type UserListPage = Parameters<UserQuery["listUsers"]>[1];

// Turns the "email already used" error from the database into a
// ConflictError. Any other error is returned as it came, to be rethrown.
function mapEmailConflict(err: unknown): unknown {
  const info = classifyDbError(err);
  if (info?.kind === "unique" && info.constraint === USER_EMAIL_CONSTRAINT) {
    return new ConflictError(EMAIL_TAKEN_MESSAGE);
  }
  return err;
}

export class UserManager {
  userQuery: UserQuery;

  constructor() {
    this.userQuery = new UserQuery();
  }

  // Throws ConflictError when the email is already registered. The database
  // constraint decides, so two sign-ups at the same instant still get one 409.
  public async createUser(user: UserDTO) {
    try {
      return await this.userQuery.createUser(user);
    } catch (err) {
      throw mapEmailConflict(err);
    }
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
  // Returns undefined when no user has this id. Throws ConflictError when the
  // new email belongs to another user.
  public async updateUser(id: number, fields: UserUpdateFields) {
    try {
      return await this.userQuery.updateUser(id, fields);
    } catch (err) {
      throw mapEmailConflict(err);
    }
  }

  // One page of users plus the total that match `filter`. No password.
  public async listUsers(filter: UserListFilter, page: UserListPage) {
    const users = await this.userQuery.listUsers(filter, page);
    return users;
  }

  // Returns false when no user has this id. Throws ConflictError when the
  // user still has posts, comments or an alumni profile (ADR-06): the foreign
  // keys in the database refuse the delete and nothing is removed.
  public async deleteUser(id: number): Promise<boolean> {
    try {
      return await this.userQuery.deleteUser(id);
    } catch (err) {
      if (classifyDbError(err)?.kind === "foreign_key") {
        throw new ConflictError(USER_HAS_CONTENT_MESSAGE);
      }
      throw err;
    }
  }

  public async updateLogoutTime(id: number) {
    await this.userQuery.updateLogoutTime(id);
  }
}
