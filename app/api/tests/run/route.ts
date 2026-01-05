import { NextResponse } from "next/server"
import { runAllTests, formatTestResults } from "@/lib/testing/unit-tests"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const suites = await runAllTests()
    const formattedResults = formatTestResults(suites)

    const totalPassed = suites.reduce((sum, s) => sum + s.passed, 0)
    const totalTests = suites.reduce((sum, s) => sum + s.tests.length, 0)
    const allPassed = totalPassed === totalTests

    return NextResponse.json({
      success: allPassed,
      summary: {
        totalTests,
        totalPassed,
        totalFailed: totalTests - totalPassed,
        suites: suites.map((s) => ({
          name: s.name,
          passed: s.passed,
          failed: s.failed,
          duration: s.totalDuration,
        })),
      },
      formatted: formattedResults,
      details: suites,
    })
  } catch (error) {
    console.error("Error running tests:", error)
    return NextResponse.json(
      { error: "Failed to run tests", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
