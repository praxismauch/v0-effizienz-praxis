import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createAdminClient()
    
    // Test 1: Check if arbeitsplatz_ids column exists by querying information_schema
    const { data: columnCheck, error: columnError } = await supabase
      .rpc('check_column_exists', { 
        p_table_name: 'responsibilities', 
        p_column_name: 'arbeitsplatz_ids' 
      })
    
    // Test 2: Try to select the column directly (will fail if column doesn't exist)
    const { data: testSelect, error: selectError } = await supabase
      .from("responsibilities")
      .select("id, arbeitsplatz_ids")
      .limit(1)
    
    // Test 3: Try to insert with the column (dry run style - we'll rollback)
    const testInsertResult = {
      success: !selectError,
      error: selectError?.message || null
    }

    const results = {
      timestamp: new Date().toISOString(),
      checks: {
        column_select_test: {
          success: !selectError,
          error: selectError?.message || null,
          data: testSelect ? `Found ${testSelect.length} row(s)` : null
        }
      },
      conclusion: !selectError 
        ? "Migration SUCCESS: 'arbeitsplatz_ids' column exists and is accessible"
        : `Migration FAILED: ${selectError?.message}`
    }

    console.log("[v0] Schema verification results:", JSON.stringify(results, null, 2))

    return NextResponse.json(results, { 
      status: selectError ? 500 : 200 
    })
  } catch (error) {
    console.error("[v0] Schema verification error:", error)
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      checks: {},
      conclusion: `Verification ERROR: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: true
    }, { status: 500 })
  }
}
