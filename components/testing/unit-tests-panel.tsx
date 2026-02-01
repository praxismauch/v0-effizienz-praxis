"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import {
  PlayCircle,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  FileCode,
  TestTube,
  Zap,
} from "lucide-react"

interface TestResult {
  id: string
  name: string
  status: "passed" | "failed" | "running" | "pending"
  duration?: number
  error?: string
  category: string
}

interface TestSuite {
  name: string
  description: string
  tests: TestResult[]
}

const testCategories = [
  {
    id: "api",
    name: "API Tests",
    description: "Teste alle API Endpunkte",
    icon: Zap,
  },
  {
    id: "database",
    name: "Datenbank Tests",
    description: "Teste Datenbankverbindungen und Queries",
    icon: FileCode,
  },
  {
    id: "auth",
    name: "Authentifizierung Tests",
    description: "Teste Authentifizierungs- und Autorisierungslogik",
    icon: TestTube,
  },
]

export default function UnitTestsPanel() {
  const { toast } = useToast()
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<TestSuite[]>([])

  const runUnitTests = async (category?: string) => {
    setIsRunning(true)
    setTestResults([])

    try {
      const response = await fetch("/api/super-admin/testing/unit-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: category || "all" }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.details || errorData.error || "Fehler beim Ausführen der Tests"
        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (!data.results || !Array.isArray(data.results)) {
        throw new Error("Ungültiges Response-Format von der Test-API")
      }

      setTestResults(data.results)

      const totalTests = data.results.reduce((acc: number, suite: TestSuite) => acc + suite.tests.length, 0)
      const passedTests = data.results.reduce(
        (acc: number, suite: TestSuite) => acc + suite.tests.filter((t: TestResult) => t.status === "passed").length,
        0,
      )
      const failedTests = data.results.reduce(
        (acc: number, suite: TestSuite) => acc + suite.tests.filter((t: TestResult) => t.status === "failed").length,
        0,
      )

      toast({
        title: "Tests abgeschlossen",
        description: `${passedTests}/${totalTests} Tests bestanden${failedTests > 0 ? `, ${failedTests} fehlgeschlagen` : ""}`,
        variant: failedTests > 0 ? "destructive" : "default",
      })
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Tests konnten nicht ausgeführt werden",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "running":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      passed: "default",
      failed: "destructive",
      running: "secondary",
      pending: "outline",
    }
    return (
      <Badge variant={variants[status]} className="capitalize">
        {status === "passed" ? "Bestanden" : status === "failed" ? "Fehlgeschlagen" : "Läuft"}
      </Badge>
    )
  }

  const totalTests = testResults.reduce((acc, suite) => acc + suite.tests.length, 0)
  const passedTests = testResults.reduce(
    (acc, suite) => acc + suite.tests.filter((t) => t.status === "passed").length,
    0,
  )
  const failedTests = testResults.reduce(
    (acc, suite) => acc + suite.tests.filter((t) => t.status === "failed").length,
    0,
  )
  const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0

  return (
    <div className="space-y-6">
      {testResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gesamt Tests</CardTitle>
              <TestTube className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTests}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bestanden</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{passedTests}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fehlgeschlagen</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{failedTests}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Erfolgsquote</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
              <Progress value={successRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Unit Tests ausführen</CardTitle>
          <CardDescription>Führen Sie Unit Tests für das System aus</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testCategories.map((category) => {
              const Icon = category.icon
              return (
                <Card key={category.id} className="hover:border-primary transition-colors">
                  <CardHeader className="space-y-1 pb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-sm">{category.name}</CardTitle>
                    </div>
                    <CardDescription className="text-xs">{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => runUnitTests(category.id)}
                      disabled={isRunning}
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Läuft...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Ausführen
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="flex justify-center pt-4">
            <Button size="lg" onClick={() => runUnitTests()} disabled={isRunning} className="min-w-[200px]">
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Tests laufen...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Alle Tests ausführen
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Ergebnisse</CardTitle>
            <CardDescription>Detaillierte Ergebnisse aller ausgeführten Tests</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {testResults.map((suite, idx) => (
                  <Card key={idx} className="border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{suite.name}</CardTitle>
                      <CardDescription className="text-sm">{suite.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {suite.tests.map((test) => (
                          <div
                            key={test.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {getStatusIcon(test.status)}
                              <div className="flex-1">
                                <p className="text-sm font-medium">{test.name}</p>
                                {test.error && <p className="text-xs text-red-500 mt-1">{test.error}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {test.duration && (
                                <span className="text-xs text-muted-foreground">{test.duration}ms</span>
                              )}
                              {getStatusBadge(test.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
