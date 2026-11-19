// Forwards rejected promises to Express' error handler (avoids try/catch everywhere).
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
