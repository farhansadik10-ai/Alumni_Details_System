import { Request, Response, RequestHandler } from "express";

/** The shape of a controller method a route can bind. */
type ControllerMethod = (req: Request, res: Response) => unknown;

/** The names of the members of `C` that are controller methods. */
type ControllerMethodName<C> = {
  [K in keyof C]: C[K] extends ControllerMethod ? K : never;
}[keyof C];

/**
 * Binds one controller method to a route.
 *
 * Express 4 does not catch a rejected promise, so a route must never be given
 * a controller method directly. This calls the method on its own instance and
 * sends whatever it throws, now or later, to the error middleware.
 */
export function handler<C, K extends ControllerMethodName<C>>(
  controller: C,
  method: K
): RequestHandler {
  return (req, res, next) => {
    try {
      const run: ControllerMethod = controller[method] as ControllerMethod;
      Promise.resolve(run.call(controller, req, res)).catch(next);
    } catch (err) {
      next(err);
    }
  };
}
