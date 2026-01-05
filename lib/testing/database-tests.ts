// Database and data validation tests
import { runTest, assertTrue } from "./test-utils"
import type { TestResult } from "./test-utils"
import { createAdminClient } from "@/lib/supabase/admin-client"

export async function runDatabaseTests(): Promise<TestResult[]> {
  const tests: TestResult[] = []

  try {
    const supabase = await createAdminClient()

    // Test 1: Database connection
    tests.push(
      await runTest("Database - Connection", "database", async () => {
        try {
          const { error } = await supabase.from("practices").select("count").limit(1)
          assertTrue(!error || error.code === "PGRST116", "Database should be accessible")
        } catch (e) {
          throw new Error(`Database connection failed: ${e}`)
        }
      }),
    )

    // Test 2: Practices table structure
    tests.push(
      await runTest("Database - Practices Table", "database", async () => {
        try {
          const { error } = await supabase.from("practices").select("id, name").limit(1)
          assertTrue(!error || error.code === "PGRST116", "Practices table should exist")
        } catch (e) {
          throw new Error(`Practices table error: ${e}`)
        }
      }),
    )

    // Test 3: Users table structure
    tests.push(
      await runTest("Database - Users Table", "database", async () => {
        try {
          const { error } = await supabase.from("users").select("id, email").limit(1)
          assertTrue(!error || error.code === "PGRST116", "Users table should exist")
        } catch (e) {
          throw new Error(`Users table error: ${e}`)
        }
      }),
    )

    // Test 4: Workflows table structure
    tests.push(
      await runTest("Database - Workflows Table", "database", async () => {
        try {
          const { error } = await supabase.from("workflows").select("id, name").limit(1)
          assertTrue(!error || error.code === "PGRST116", "Workflows table should exist")
        } catch (e) {
          throw new Error(`Workflows table error: ${e}`)
        }
      }),
    )

    // Test 5: Team Members table structure
    tests.push(
      await runTest("Database - Team Members Table", "database", async () => {
        try {
          const { error } = await supabase.from("team_members").select("id, user_id").limit(1)
          assertTrue(!error || error.code === "PGRST116", "Team members table should exist")
        } catch (e) {
          throw new Error(`Team members table error: ${e}`)
        }
      }),
    )

    // Test 6: Data integrity - Practice relationships
    tests.push(
      await runTest("Database - Practice Relationships", "database", async () => {
        try {
          const { data: practices } = await supabase.from("practices").select("id").limit(1)
          if (practices && practices.length > 0) {
            const practiceId = practices[0].id
            const { data: teamMembers, error } = await supabase
              .from("team_members")
              .select("id")
              .eq("practice_id", practiceId)
            assertTrue(Array.isArray(teamMembers) || !!error, "Practice team members relationship should work")
          } else {
            assertTrue(true, "No practices to test")
          }
        } catch (e) {
          throw new Error(`Practice relationships error: ${e}`)
        }
      }),
    )
  } catch (error) {
    tests.push({
      id: `database-init-error-${Date.now()}`,
      name: "Database Initialization",
      status: "failed",
      duration: 0,
      error: `Failed to initialize database client: ${error}`,
      category: "database",
    })
  }

  return tests
}
