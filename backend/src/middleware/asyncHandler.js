/**
 * Async error handler wrapper
 * Wraps async route handlers to catch errors and pass them to error middleware
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
