"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import Logger from "@/lib/logger"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Logger.error("ui", "ErrorBoundary caught error", error, { componentStack: errorInfo.componentStack })
    
    // Send to error tracking database
    this.sendToErrorTracking(error, errorInfo)
  }

  private async sendToErrorTracking(error: Error, errorInfo: React.ErrorInfo) {
    try {
      await fetch("/api/error-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: "error",
          category: "ui",
          message: `ErrorBoundary: ${error.message}`,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          context: {
            componentStack: errorInfo.componentStack,
          },
          url: typeof window !== "undefined" ? window.location.href : undefined,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        }),
      })
    } catch (e) {
      // Silent fail - don't cause more errors while reporting errors
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md space-y-4 text-center">
            <h1 className="text-2xl font-bold text-destructive">Anwendungsfehler</h1>
            <p className="text-muted-foreground">
              Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.
            </p>
            {this.state.error && process.env.NODE_ENV === "development" && (
              <pre className="rounded-md bg-muted p-4 text-left text-sm overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <Button
              onClick={() => {
                this.handleReset()
                window.location.reload()
              }}
            >
              Seite neu laden
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
