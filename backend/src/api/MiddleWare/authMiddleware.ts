import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "@alumni/businesslogic";
import { verifyToken } from "../utils/token";

const NO_TOKEN_MESSAGE = "No token provided";

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) {
    next(new UnauthorizedError(NO_TOKEN_MESSAGE));
    return;
  }

  try {
    req.user = verifyToken(token);
  } catch (err) {
    next(err);
    return;
  }
  next();
}
