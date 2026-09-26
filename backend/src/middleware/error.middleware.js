export const errorHandler = (error, req, res, next) => {
  if (error.name === "ZodError") {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed.",
        fields: error.flatten().fieldErrors,
      },
    });
  }

  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    error: {
      code: error.code || "INTERNAL_SERVER_ERROR",
      message:
        statusCode === 500 ? "An unexpected error occurred." : error.message,
    },
  });
};
