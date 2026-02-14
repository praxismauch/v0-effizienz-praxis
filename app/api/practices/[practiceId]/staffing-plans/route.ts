import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

function isRateLimitError(error: any): boolean {
  const errorString = String(error?.message || error || "")
  return (
    error?.name === "SyntaxError" ||
    errorString.includes("Too Many") ||
    errorString.includes("Unexpected token") ||
    errorString.includes("is not valid JSON") ||
    errorString.includes("rate limit")
  )
}

export async function GET(req: NextRequest, context: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await context.params
    const supabase = await createAdminClient()

    let data = null
    let error = null

    try {
      const result = await supabase
        .from("staffing_plans")
        .select("*")
        .eq("practice_id", practiceId)
        .order("created_at", { ascending: false })

      data = result.data
      error = result.error
    } catch (queryError: any) {
      if (isRateLimitError(queryError)) {
        console.log("[API] staffing-plans GET - Rate limited, returning empty array")
        return NextResponse.json({ staffingPlans: [] })
      }
      throw queryError
    }

    if (error) {
      if (isRateLimitError(error)) {
        console.log("[API] staffing-plans GET - Rate limited (error object), returning empty array")
        return NextResponse.json({ staffingPlans: [] })
      }
      throw error
    }

    return NextResponse.json({ staffingPlans: data || [] })
  } catch (error: any) {
    console.error("[API] Error fetching staffing plans:", error)
    return NextResponse.json({ staffingPlans: [] })
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await context.params
    const body = await req.json()
    const supabase = await createAdminClient()

    const createdBy = body.created_by || body.createdBy
    if (!createdBy) {
      return NextResponse.json({ error: "created_by is required" }, { status: 400 })
    }

    let data = null
    let error = null

    try {
      const result = await supabase
        .from("staffing_plans")
        .insert({
          practice_id: practiceId,
          name: body.name,
          description: body.description,
          created_by: createdBy,
          is_active: true,
        })
        .select()
        .single()

      data = result.data
      error = result.error
    } catch (queryError: any) {
      if (isRateLimitError(queryError)) {
        return NextResponse.json({ error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." }, { status: 429 })
      }
      throw queryError
    }

    if (error) {
      if (isRateLimitError(error)) {
        return NextResponse.json({ error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." }, { status: 429 })
      }
      console.error("[API] Error creating staffing plan:", error)
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[API] Error in POST staffing plan:", error)
    return NextResponse.json({ error: error.message || "Failed to create plan" }, { status: 500 })
  }
}
