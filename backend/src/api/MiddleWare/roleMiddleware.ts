import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "@alumni/businesslogic";

const FORBIDDEN_MESSAGE = "Forbidden";

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError(FORBIDDEN_MESSAGE));
      return;
    }
    next();
  };
}
