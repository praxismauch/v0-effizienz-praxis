import { NextRequest, NextResponse } from "next/server"
import { getApiClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await getApiClient()

    const { data: hygienePlans, error } = await supabase
      .from("hygiene_plans")
      .select("*")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching hygiene plans:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map DB column 'area' to 'category' for the UI
    const mappedPlans = (hygienePlans || []).map((plan) => ({
      ...plan,
      category: plan.area || "",
    }))

    return NextResponse.json({ hygienePlans: mappedPlans })
  } catch (error) {
    console.error("[v0] Error in hygiene plans GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await getApiClient()
    const body = await request.json()

    const { title, description, category, frequency, status, userId } = body

    const { data: hygienePlan, error } = await supabase
      .from("hygiene_plans")
      .insert({
        id: crypto.randomUUID(),
        practice_id: practiceId,
        title,
        description: description || "",
        area: category || "",
        frequency: frequency || "daily",
        responsible_user_id: userId || null,
        status: status || "active",
        ai_generated: false,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating hygiene plan:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ hygienePlan }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in hygiene plans POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
