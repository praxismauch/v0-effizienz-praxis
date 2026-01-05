import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Fetch annual discount percentage
export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "annual_discount_percentage")
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error fetching annual discount:", error.message)
      // Return default 20% if there's an error
      return NextResponse.json({ percentage: 20 })
    }

    // Parse value from the key-value pair
    const percentage = data?.value ? Number.parseInt(data.value) : 20

    return NextResponse.json({ percentage })
  } catch (error) {
    console.error("Error in annual discount GET:", error)
    return NextResponse.json({ percentage: 20 }) // Default to 20%
  }
}

// POST - Update annual discount percentage (Super Admin only)
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { percentage } = await request.json()

    if (typeof percentage !== "number" || percentage < 0 || percentage > 100) {
      return NextResponse.json({ error: "Invalid percentage value" }, { status: 400 })
    }

    const { error } = await supabase.from("system_settings").upsert(
      {
        key: "annual_discount_percentage",
        value: percentage.toString(),
        description: "Annual discount percentage for yearly subscriptions",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    )

    if (error) throw error

    return NextResponse.json({ success: true, percentage })
  } catch (error) {
    console.error("Error updating annual discount:", error)
    return NextResponse.json({ error: "Failed to update annual discount" }, { status: 500 })
  }
}
