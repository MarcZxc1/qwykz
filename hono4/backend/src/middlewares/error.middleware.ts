import type { ErrorHandler, NotFoundHandler } from "hono";

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export const notFoundHandler: NotFoundHandler = (c) => {
  return c.json({ error: { message: `Route ${c.req.method} ${c.req.path} not found` } }, 404);
};

export const errorHandler: ErrorHandler = (error, c) => {
  if (error instanceof HttpError) {
    c.status(error.statusCode as any);
    return c.json({
      error: { message: error.message, details: error.details },
    });
  }

  console.error(error);
  c.status(500);
  return c.json({ error: { message: "An unexpected error occurred." } });
};
