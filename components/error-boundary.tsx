"use client"

import React from "react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: React.ReactNode
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
    console.error("[v0] ErrorBoundary caught error:", error)
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[v0] ErrorBoundary error details:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md space-y-4 text-center">
            <h1 className="text-2xl font-bold text-destructive">Anwendungsfehler</h1>
            <p className="text-muted-foreground">
              Ein clientseitiger Fehler ist aufgetreten. Bitte überprüfen Sie die Browser-Konsole für weitere
              Informationen.
            </p>
            {this.state.error && (
              <pre className="rounded-md bg-muted p-4 text-left text-sm overflow-auto">{this.state.error.message}</pre>
            )}
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null })
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
