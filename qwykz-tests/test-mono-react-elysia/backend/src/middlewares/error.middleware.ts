export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export const notFoundHandler = ({ set }: any) => {
  set.status = 404;
  return { error: { message: `Route not found` } };
};

export const errorHandler = ({ code, error, set }: any) => {
  if (error instanceof HttpError) {
    set.status = error.statusCode;
    return {
      error: { message: error.message, details: error.details },
    };
  }

  if (code === 'VALIDATION') {
    set.status = 400;
    return {
      error: { message: "Validation failed", details: error.all }
    };
  }

  console.error(error);
  set.status = 500;
  return { error: { message: "An unexpected error occurred." } };
};
