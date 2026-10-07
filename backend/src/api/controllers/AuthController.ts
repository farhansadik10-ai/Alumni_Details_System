import { Request, Response } from "express";
import {
  UserManager,
  UnauthorizedError,
  ValidationError,
} from "@alumni/businesslogic";
import bcrypt from "bcrypt";
import { CREDENTIALS_REQUIRED_MESSAGE } from "../utils/requestHelpers";
import { signToken } from "../utils/token";

// One message for an unknown email and for a wrong password, so the answer
// does not tell a caller which emails are registered.
const BAD_CREDENTIALS_MESSAGE = "Invalid email or password";

// Login does not trim: a stored password is compared exactly as it was typed.
function isSentText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export class AuthController {
  private readonly userManager = new UserManager();

  public async login(req: Request, res: Response): Promise<void> {
    const body: Record<string, unknown> = req.body ?? {};
    const { email, password } = body;
    if (!isSentText(email) || !isSentText(password)) {
      throw new ValidationError(CREDENTIALS_REQUIRED_MESSAGE);
    }

    const user = await this.userManager.findUserForLogin(email);
    if (!user) {
      throw new UnauthorizedError(BAD_CREDENTIALS_MESSAGE);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedError(BAD_CREDENTIALS_MESSAGE);
    }

    // `role` is nullable in the database. A user with no role gets a token
    // whose role matches no role check.
    const token = signToken({ sub: user.id, role: user.role ?? "" });
    res.status(200).json({ token });
  }
}
