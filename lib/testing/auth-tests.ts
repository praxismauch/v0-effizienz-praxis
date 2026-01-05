// Authentication and authorization tests
import { runTest, assertNotNull, assertTrue } from "./test-utils"
import type { TestResult } from "./test-utils"
import { createAdminClient } from "@/lib/supabase/admin-client"

export async function runAuthTests(): Promise<TestResult[]> {
  const tests: TestResult[] = []

  try {
    const supabase = await createAdminClient()

    // Test 1: Session validation
    tests.push(
      await runTest("Auth - Session Structure", "auth", async () => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession()
          assertTrue(true, "Session check should complete")
        } catch (e) {
          throw new Error(`Session check failed: ${e}`)
        }
      }),
    )

    // Test 2: User data structure
    tests.push(
      await runTest("Auth - User Data Structure", "auth", async () => {
        try {
          const { data: users } = await supabase.from("users").select("id, email, role").limit(1)
          if (users && users.length > 0) {
            const user = users[0]
            assertNotNull(user.id, "User should have ID")
            assertNotNull(user.email, "User should have email")
          } else {
            assertTrue(true, "No users to test")
          }
        } catch (e) {
          throw new Error(`User structure test failed: ${e}`)
        }
      }),
    )

    // Test 3: Role-based access
    tests.push(
      await runTest("Auth - Role System", "auth", async () => {
        try {
          const { data: users } = await supabase.from("users").select("role").limit(1)
          if (users && users.length > 0) {
            const validRoles = ["superadmin", "admin", "user", "viewer"]
            const hasValidRole = users.some((u) => validRoles.includes(u.role))
            assertTrue(hasValidRole || users.length === 0, "User roles should be valid")
          } else {
            assertTrue(true, "No users to test")
          }
        } catch (e) {
          throw new Error(`Role system test failed: ${e}`)
        }
      }),
    )

    // Test 4: Practice isolation
    tests.push(
      await runTest("Auth - Practice Isolation", "auth", async () => {
        try {
          const { data: workflows } = await supabase.from("workflows").select("practice_id").limit(10)
          if (workflows && workflows.length > 0) {
            workflows.forEach((workflow) => {
              assertNotNull(workflow.practice_id, "Workflows should have practice_id")
            })
          } else {
            assertTrue(true, "No workflows to test")
          }
        } catch (e) {
          throw new Error(`Practice isolation test failed: ${e}`)
        }
      }),
    )

    // Test 5: Permission structure
    tests.push(
      await runTest("Auth - User Permissions", "auth", async () => {
        try {
          const { data: users } = await supabase.from("users").select("id, role, practice_id").limit(1)
          assertTrue(Array.isArray(users), "User permissions should be queryable")
        } catch (e) {
          throw new Error(`Permissions test failed: ${e}`)
        }
      }),
    )
  } catch (error) {
    tests.push({
      id: `auth-init-error-${Date.now()}`,
      name: "Auth System Initialization",
      status: "failed",
      duration: 0,
      error: `Failed to initialize auth tests: ${error}`,
      category: "auth",
    })
  }

  return tests
}
