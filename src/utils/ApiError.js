class ApiError extends Error {
  constructor(
    massage = "Something Went Worng",
    statusCode,
    errors = [],
    stack = ""
  ) {
    super(massage);
    this.data = null;
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;
    this.message = massage;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
    // this.stack = stack;
  }
}

export default ApiError;
