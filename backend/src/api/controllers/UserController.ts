import { Request, Response } from "express";
import { UserManager } from "@alumni/businesslogic";
import { UserDTO } from "@alumni/dal";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  pickSent,
  isAdmin,
  isSelf,
  isNonEmptyString,
  isStringOrNull,
} from "../utils/requestHelpers";

const userManager = new UserManager();
const JWT_SECRET = process.env.JWT_SECRET as string;
const PASSWORD_SALT_ROUNDS = 10;

// The roles a person may pick at sign-up. Admin is never one of them (ADR-01).
const SIGNUP_ROLES: readonly unknown[] = ["student", "alumni"];

// The only fields PUT /api/users/:id may change. `role` and `id` are not here.
const USER_UPDATE_FIELDS = ["name", "email", "password", "photo_url"] as const;
// NOT NULL in the database: when sent, must be a non-empty string.
const REQUIRED_USER_FIELDS = ["email", "password"] as const;
// Nullable in the database: when sent, must be a string or null.
const NULLABLE_USER_FIELDS = ["name", "photo_url"] as const;



export async function login(email: string, password: string) {
  const user = await userManager.findUserForLogin(email);
  if (!user) throw { status: 401, message: "Invalid" };

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw { status: 401, message: "Invalid" };

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  return { token };
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as unknown as { sub: number; role: string };
}



export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, photo_url } = req.body;
    if (!SIGNUP_ROLES.includes(role)) {
      res.status(400).json({ error: "Role must be student or alumni" });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    const user = new UserDTO(name, email, hashedPassword, role, photo_url);
    const newUser = await userManager.createUser(user);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await userManager.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const findUserById = async (req: Request, res: Response) => {
  try {
    const user = await userManager.findUserById(Number(req.params.id));
    res.status(200).json(user);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
};

export const findUserByEmail = async (req: Request, res: Response) => {
  try {
    const email = Array.isArray(req.params.email) ? req.params.email[0] : req.params.email;
    const user = await userManager.findUserByEmail(email);
    res.status(200).json(user);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    // 403 comes before 400 and 404 here, so a non-admin cannot learn which
    // user ids exist.
    if (!isSelf(req, id) && !isAdmin(req)) {
      res.status(403).json({ error: "Not authorized to update this user" });
      return;
    }

    const fields = pickSent(req.body, USER_UPDATE_FIELDS);
    if (Object.keys(fields).length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    for (const field of REQUIRED_USER_FIELDS) {
      if (field in fields && !isNonEmptyString(fields[field])) {
        res.status(400).json({ error: `${field} must be a non-empty string` });
        return;
      }
    }
    for (const field of NULLABLE_USER_FIELDS) {
      if (field in fields && !isStringOrNull(fields[field])) {
        res.status(400).json({ error: `${field} has the wrong type` });
        return;
      }
    }

    if (isNonEmptyString(fields.password)) {
      fields.password = await bcrypt.hash(fields.password, PASSWORD_SALT_ROUNDS);
    }

    const updated = await userManager.updateUser(id, fields);
    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await userManager.deleteUser(id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const updateLogoutTime = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!isSelf(req, id)) {
      res.status(403).json({ error: "Not authorized to log out this user" });
      return;
    }
    const updated = await userManager.updateLogoutTime(id);
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};