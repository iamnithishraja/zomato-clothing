import type { Request, Response, NextFunction } from "express";

/**
 * Request timeout middleware
 * Automatically terminates requests that exceed the specified timeout duration
 * 
 * @param timeoutMs - Timeout duration in milliseconds (default: 30000ms = 30 seconds)
 */
export function requestTimeout(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set a timeout for the request
    const timeout = setTimeout(() => {
      // Check if response has already been sent
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Request timeout - The server took too long to respond',
          error: 'TIMEOUT'
        });
      }
    }, timeoutMs);

    // Clear timeout when response finishes
    res.on('finish', () => {
      clearTimeout(timeout);
    });

    // Clear timeout on response close (connection terminated)
    res.on('close', () => {
      clearTimeout(timeout);
    });

    next();
  };
}

/**
 * Different timeout configurations for different types of routes
 */
export const timeouts = {
  // Standard API requests (30 seconds)
  standard: requestTimeout(30000),
  
  // File upload/download operations (2 minutes)
  upload: requestTimeout(120000),
  
  // Payment operations (45 seconds - Razorpay webhooks can be slow)
  payment: requestTimeout(45000),
  
  // Report generation (1 minute)
  reports: requestTimeout(60000),
  
  // Quick operations (10 seconds)
  quick: requestTimeout(10000),
};

