import { Request, Response } from "express";
import {
  UserManager,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@alumni/businesslogic";
import { UserDTO } from "@alumni/dal";
import bcrypt from "bcrypt";
import {
  pickSent,
  isAdmin,
  isSelf,
  isNonEmptyString,
  isStringOrNull,
  parseId,
  parsePaging,
  queryText,
  checkFields,
} from "../utils/requestHelpers";

const PASSWORD_SALT_ROUNDS = 10;

// The roles a person may pick at sign-up. Admin is never one of them (ADR-01).
const SIGNUP_ROLES: readonly unknown[] = ["student", "alumni"];

// The only fields PUT /api/users/:id may change. `role` and `id` are not here.
const USER_UPDATE_FIELDS = ["name", "email", "password", "photo_url"] as const;
// NOT NULL in the database: when sent, must be a non-empty string.
const REQUIRED_USER_FIELDS = ["email", "password"] as const;
// One rule per updatable field. `name` and `photo_url` are nullable in the
// database: when sent, a string or null.
const USER_UPDATE_RULES = {
  email: isNonEmptyString,
  password: isNonEmptyString,
  name: isStringOrNull,
  photo_url: isStringOrNull,
};

const SIGNUP_ROLE_MESSAGE = "Role must be student or alumni";
const CREDENTIALS_REQUIRED_MESSAGE = "Email and password are required";
const USER_NOT_FOUND_MESSAGE = "User not found";
const UPDATE_FORBIDDEN_MESSAGE = "Not authorized to update this user";
const LOGOUT_FORBIDDEN_MESSAGE = "Not authorized to log out this user";
const NO_FIELDS_MESSAGE = "No fields to update";
const USER_DELETED_MESSAGE = "User deleted successfully";

export class UserController {
  private readonly userManager = new UserManager();

  public async createUser(req: Request, res: Response): Promise<void> {
    const { name, email, password, role, photo_url } = req.body ?? {};
    if (!SIGNUP_ROLES.includes(role)) {
      throw new ValidationError(SIGNUP_ROLE_MESSAGE);
    }
    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      throw new ValidationError(CREDENTIALS_REQUIRED_MESSAGE);
    }

    const hashedPassword = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    const user = new UserDTO(name, email, hashedPassword, role, photo_url);
    const newUser = await this.userManager.createUser(user);
    res.status(201).json(newUser);
  }

  public async getAllUsers(req: Request, res: Response): Promise<void> {
    const { page, limit, offset } = parsePaging(req.query);
    const filter = {
      q: queryText(req.query, "q"),
      role: queryText(req.query, "role"),
    };

    const { rows, total } = await this.userManager.listUsers(filter, {
      limit,
      offset,
    });
    res.status(200).json({ items: rows, total, page, limit });
  }

  public async findUserById(req: Request, res: Response): Promise<void> {
    const id = parseId(req.params.id);
    const user = await this.userManager.findUserById(id);
    if (!user) {
      throw new NotFoundError(USER_NOT_FOUND_MESSAGE);
    }
    res.status(200).json(user);
  }

  public async findUserByEmail(req: Request, res: Response): Promise<void> {
    const email = Array.isArray(req.params.email)
      ? req.params.email[0]
      : req.params.email;
    const user = await this.userManager.findUserByEmail(email);
    if (!user) {
      throw new NotFoundError(USER_NOT_FOUND_MESSAGE);
    }
    res.status(200).json(user);
  }

  public async updateUser(req: Request, res: Response): Promise<void> {
    const id = parseId(req.params.id);
    // 403 comes before the 400 body checks and the 404 here, so a non-admin
    // cannot learn which user ids exist.
    if (!isSelf(req, id) && !isAdmin(req)) {
      throw new ForbiddenError(UPDATE_FORBIDDEN_MESSAGE);
    }

    const sent = pickSent(req.body, USER_UPDATE_FIELDS);
    if (Object.keys(sent).length === 0) {
      throw new ValidationError(NO_FIELDS_MESSAGE);
    }

    for (const field of REQUIRED_USER_FIELDS) {
      if (field in sent && !isNonEmptyString(sent[field])) {
        throw new ValidationError(`${field} must be a non-empty string`);
      }
    }
    const fields = checkFields(sent, USER_UPDATE_RULES);

    if (typeof fields.password === "string") {
      fields.password = await bcrypt.hash(fields.password, PASSWORD_SALT_ROUNDS);
    }

    const updated = await this.userManager.updateUser(id, fields);
    if (!updated) {
      throw new NotFoundError(USER_NOT_FOUND_MESSAGE);
    }
    res.status(200).json(updated);
  }

  public async deleteUser(req: Request, res: Response): Promise<void> {
    const id = parseId(req.params.id);
    const deleted = await this.userManager.deleteUser(id);
    if (!deleted) {
      throw new NotFoundError(USER_NOT_FOUND_MESSAGE);
    }
    res.status(200).json({ message: USER_DELETED_MESSAGE });
  }

  public async updateLogoutTime(req: Request, res: Response): Promise<void> {
    const id = parseId(req.params.id);
    if (!isSelf(req, id)) {
      throw new ForbiddenError(LOGOUT_FORBIDDEN_MESSAGE);
    }
    const updated = await this.userManager.updateLogoutTime(id);
    res.status(200).json(updated);
  }
}
