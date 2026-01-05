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
    console.log("[v0] Starting unit tests execution")

    const isDevMode =
      process.env.NEXT_PUBLIC_VERCEL_ENV !== "production" ||
      process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "true" ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log("[v0] Auth mode check:", { isDevMode, vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV })

    if (!isDevMode) {
      const supabase = await createServerClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.log("[v0] Test execution failed: Not authenticated")
        return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
      }

      const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

      if (!userData || (userData.role !== "superadmin" && userData.role !== "super_admin")) {
        console.log("[v0] Test execution failed: Not authorized - role:", userData?.role)
        return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
      }

      console.log("[v0] User authorized as super admin, role:", userData.role)
    } else {
      console.log("[v0] Skipping auth check in dev mode")
    }

    const body = await req.json()
    const categories = Array.isArray(body.categories) ? body.categories : [body.category || "all"]

    console.log("[v0] Running tests for categories:", categories)

    const results = []

    // API Tests
    if (categories.includes("all") || categories.includes("api")) {
      try {
        console.log("[v0] Running API tests...")
        const apiTests = await runAPITests()
        results.push({
          name: "API Tests",
          description: "Tests für alle API Endpunkte",
          tests: apiTests,
          totalTests: apiTests.length,
          passedTests: apiTests.filter((t) => t.status === "passed").length,
          failedTests: apiTests.filter((t) => t.status === "failed").length,
          skippedTests: apiTests.filter((t) => t.status === "skipped").length,
          duration: apiTests.reduce((sum, t) => sum + t.duration, 0),
        })
        console.log("[v0] API tests completed:", apiTests.length, "tests")
      } catch (error) {
        console.error("[v0] Error running API tests:", error)
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
        console.log("[v0] Running database tests...")
        const dbTests = await runDatabaseTests()
        results.push({
          name: "Datenbank Tests",
          description: "Tests für Datenbankverbindungen und Tabellenzugriffe",
          tests: dbTests,
          totalTests: dbTests.length,
          passedTests: dbTests.filter((t) => t.status === "passed").length,
          failedTests: dbTests.filter((t) => t.status === "failed").length,
          skippedTests: dbTests.filter((t) => t.status === "skipped").length,
          duration: dbTests.reduce((sum, t) => sum + t.duration, 0),
        })
        console.log("[v0] Database tests completed:", dbTests.length, "tests")
      } catch (error) {
        console.error("[v0] Error running database tests:", error)
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
        console.log("[v0] Running auth tests...")
        const authTests = await runAuthTests()
        results.push({
          name: "Authentifizierung Tests",
          description: "Tests für Authentifizierungs- und Autorisierungslogik",
          tests: authTests,
          totalTests: authTests.length,
          passedTests: authTests.filter((t) => t.status === "passed").length,
          failedTests: authTests.filter((t) => t.status === "failed").length,
          skippedTests: authTests.filter((t) => t.status === "skipped").length,
          duration: authTests.reduce((sum, t) => sum + t.duration, 0),
        })
        console.log("[v0] Auth tests completed:", authTests.length, "tests")
      } catch (error) {
        console.error("[v0] Error running auth tests:", error)
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
        console.log("[v0] Running integration tests...")
        const integrationTests = await runIntegrationTests()
        results.push({
          name: "Integration Tests",
          description: "Tests für externe Integrationen und Services",
          tests: integrationTests,
          totalTests: integrationTests.length,
          passedTests: integrationTests.filter((t) => t.status === "passed").length,
          failedTests: integrationTests.filter((t) => t.status === "failed").length,
          skippedTests: integrationTests.filter((t) => t.status === "skipped").length,
          duration: integrationTests.reduce((sum, t) => sum + t.duration, 0),
        })
        console.log("[v0] Integration tests completed:", integrationTests.length, "tests")
      } catch (error) {
        console.error("[v0] Error running integration tests:", error)
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

    console.log("[v0] All tests completed, returning results")

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (error) {
    console.error("[v0] Error running unit tests:", error)
    return NextResponse.json(
      {
        error: "Fehler beim Ausführen der Tests",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
