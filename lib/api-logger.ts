import { NextRequest, NextResponse } from "next/server"
import { Logger } from "./logger"

type RouteHandler = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse> | NextResponse

/**
 * Wraps an API route handler with automatic logging
 * Logs request details, duration, and any errors
 */
export function withLogging(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, context?: { params: Promise<Record<string, string>> }) => {
    const requestId = Logger.generateRequestId()
    Logger.setRequestId(requestId)
    
    const timer = Logger.startTimer(`${request.method} ${request.nextUrl.pathname}`)
    const startTime = Date.now()
    
    try {
      const response = await handler(request, context)
      const duration = Date.now() - startTime
      
      // Log successful requests
      Logger.request(
        request.method,
        request.nextUrl.pathname,
        response.status,
        duration,
        {
          requestId,
          query: Object.fromEntries(request.nextUrl.searchParams),
        }
      )
      
      // Add request ID to response headers for tracing
      const headers = new Headers(response.headers)
      headers.set("x-request-id", requestId)
      
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
    } catch (error) {
      const duration = Date.now() - startTime
      
      // Log error
      Logger.error("api", `Request failed: ${request.method} ${request.nextUrl.pathname}`, error, {
        requestId,
        duration,
        query: Object.fromEntries(request.nextUrl.searchParams),
      })
      
      // Return error response
      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : "Internal server error",
          requestId,
        },
        { 
          status: 500,
          headers: { "x-request-id": requestId },
        }
      )
    }
  }
}

/**
 * Creates a logger context for a specific API route
 */
export function createRouteLogger(routeName: string) {
  return {
    debug: (message: string, details?: Record<string, unknown>) => 
      Logger.debug("api", `[${routeName}] ${message}`, details),
    info: (message: string, details?: Record<string, unknown>) => 
      Logger.info("api", `[${routeName}] ${message}`, details),
    warn: (message: string, details?: Record<string, unknown>) => 
      Logger.warn("api", `[${routeName}] ${message}`, details),
    error: (message: string, error?: Error | unknown, details?: Record<string, unknown>) => 
      Logger.error("api", `[${routeName}] ${message}`, error, details),
  }
}
