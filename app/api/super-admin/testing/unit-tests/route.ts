import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import { runAPITests } from "@/lib/testing/api-tests"
import { runDatabaseTests } from "@/lib/testing/database-tests"
import { runAuthTests } from "@/lib/testing/auth-tests"
import { runIntegrationTests } from "@/lib/testing/integration-tests"

export async function POST(req: NextRequest) {
  await cookies()

  try {
    const isDevMode =
      process.env.NEXT_PUBLIC_VERCEL_ENV !== "production" ||
      process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "true" ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!isDevMode) {
      const supabase = await createServerClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
      }

      const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

      if (!userData || (userData.role !== "superadmin" && userData.role !== "super_admin")) {
        return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
      }
    }

    const body = await req.json()
    const categories = Array.isArray(body.categories) ? body.categories : [body.category || "all"]

    const results = []

    // API Tests
    if (categories.includes("all") || categories.includes("api")) {
      try {
        const apiTests = await runAPITests()
        results.push({
          name: "API Tests",
          description: "Tests für alle API Endpunkte",
          tests: apiTests,
          totalTests: apiTests.length,
          passedTests: apiTests.filter((t: any) => t.status === "passed").length,
          failedTests: apiTests.filter((t: any) => t.status === "failed").length,
          skippedTests: apiTests.filter((t: any) => t.status === "skipped").length,
          duration: apiTests.reduce((sum: number, t: any) => sum + t.duration, 0),
        })
      } catch (error) {
        console.error("Error running API tests:", error)
        results.push({
          name: "API Tests",
          description: "Tests für alle API Endpunkte",
          tests: [
            {
              id: "api-init-error",
              name: "API Test Suite Initialization",
              status: "failed",
              duration: 0,
              category: "api",
              error: `Failed to run API tests: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          totalTests: 1,
          passedTests: 0,
          failedTests: 1,
          skippedTests: 0,
          duration: 0,
        })
      }
    }

    // Database Tests
    if (categories.includes("all") || categories.includes("database")) {
      try {
        const dbTests = await runDatabaseTests()
        results.push({
          name: "Datenbank Tests",
          description: "Tests für Datenbankverbindungen und Tabellenzugriffe",
          tests: dbTests,
          totalTests: dbTests.length,
          passedTests: dbTests.filter((t: any) => t.status === "passed").length,
          failedTests: dbTests.filter((t: any) => t.status === "failed").length,
          skippedTests: dbTests.filter((t: any) => t.status === "skipped").length,
          duration: dbTests.reduce((sum: number, t: any) => sum + t.duration, 0),
        })
      } catch (error) {
        console.error("Error running database tests:", error)
        results.push({
          name: "Datenbank Tests",
          description: "Tests für Datenbankverbindungen und Tabellenzugriffe",
          tests: [
            {
              id: "db-init-error",
              name: "Database Test Suite Initialization",
              status: "failed",
              duration: 0,
              category: "database",
              error: `Failed to run database tests: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          totalTests: 1,
          passedTests: 0,
          failedTests: 1,
          skippedTests: 0,
          duration: 0,
        })
      }
    }

    // Auth Tests
    if (categories.includes("all") || categories.includes("auth")) {
      try {
        const authTests = await runAuthTests()
        results.push({
          name: "Authentifizierung Tests",
          description: "Tests für Authentifizierungs- und Autorisierungslogik",
          tests: authTests,
          totalTests: authTests.length,
          passedTests: authTests.filter((t: any) => t.status === "passed").length,
          failedTests: authTests.filter((t: any) => t.status === "failed").length,
          skippedTests: authTests.filter((t: any) => t.status === "skipped").length,
          duration: authTests.reduce((sum: number, t: any) => sum + t.duration, 0),
        })
      } catch (error) {
        console.error("Error running auth tests:", error)
        results.push({
          name: "Authentifizierung Tests",
          description: "Tests für Authentifizierungs- und Autorisierungslogik",
          tests: [
            {
              id: "auth-init-error",
              name: "Auth Test Suite Initialization",
              status: "failed",
              duration: 0,
              category: "auth",
              error: `Failed to run auth tests: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          totalTests: 1,
          passedTests: 0,
          failedTests: 1,
          skippedTests: 0,
          duration: 0,
        })
      }
    }

    // Integration Tests
    if (categories.includes("all") || categories.includes("integration")) {
      try {
        const integrationTests = await runIntegrationTests()
        results.push({
          name: "Integration Tests",
          description: "Tests für externe Integrationen und Services",
          tests: integrationTests,
          totalTests: integrationTests.length,
          passedTests: integrationTests.filter((t: any) => t.status === "passed").length,
          failedTests: integrationTests.filter((t: any) => t.status === "failed").length,
          skippedTests: integrationTests.filter((t: any) => t.status === "skipped").length,
          duration: integrationTests.reduce((sum: number, t: any) => sum + t.duration, 0),
        })
      } catch (error) {
        console.error("Error running integration tests:", error)
        results.push({
          name: "Integration Tests",
          description: "Tests für externe Integrationen und Services",
          tests: [
            {
              id: "integration-init-error",
              name: "Integration Test Suite Initialization",
              status: "failed",
              duration: 0,
              category: "integration",
              error: `Failed to run integration tests: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          totalTests: 1,
          passedTests: 0,
          failedTests: 1,
          skippedTests: 0,
          duration: 0,
        })
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (error) {
    console.error("Error running unit tests:", error)
    return NextResponse.json(
      {
        error: "Fehler beim Ausführen der Tests",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
