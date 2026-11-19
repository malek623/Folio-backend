// Every error returned by the API has the same shape:
// { "error": { "status": 400, "message": "...", "details": [...] } }
export function notFound(req, res) {
  res.status(404).json({ error: { status: 404, message: `Route not found: ${req.method} ${req.originalUrl}` } });
}

export function errorHandler(err, _req, res, _next) {
  let status = err.status || 500;
  let message = err.message || "Internal server error";
  let details = err.details;

  if (err.name === "ValidationError") {
    status = 400;
    message = "Validation failed";
    details = Object.values(err.errors).map((e) => e.message);
  } else if (err.name === "CastError") {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    message = "A resource with this value already exists";
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Malformed JSON in request body";
  }

  if (status >= 500) {
    console.error(err);
    message = "Internal server error"; // do not leak internals to the client
    details = undefined;
  }

  res.status(status).json({ error: { status, message, ...(details && { details }) } });
}
