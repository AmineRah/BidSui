/**
 * Request logger middleware
 */
export function requestLogger(req, res, next) {
  const start = Date.now();
  
  // Log request
  console.log(`${req.method} ${req.path} - ${req.ip} - ${new Date().toISOString()}`);
  
  // Log request body (excluding sensitive data)
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    
    // Remove sensitive fields from logs
    const sensitiveFields = ['signer', 'privateKey', 'mnemonic', 'password'];
    sensitiveFields.forEach(field => {
      if (sanitizedBody[field]) {
        sanitizedBody[field] = '[REDACTED]';
      }
    });
    
    console.log('Request body:', JSON.stringify(sanitizedBody, null, 2));
  }
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    
    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
}
