import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const supabase = await createServerClient()
    const { practiceId } = params

    const { data: subscriptions, error } = await supabase
      .from("external_calendar_subscriptions")
      .select("*")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error("Error fetching external calendar subscriptions:", error)
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const supabase = await createServerClient()
    const { practiceId } = params
    const body = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, ical_url, color } = body

    if (!name || !ical_url) {
      return NextResponse.json({ error: "Name and iCal URL are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("external_calendar_subscriptions")
      .insert({
        practice_id: practiceId,
        name,
        ical_url,
        color: color || "#3b82f6",
        created_by: user.id,
        sync_status: "pending",
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ subscription: data })
  } catch (error) {
    console.error("Error creating external calendar subscription:", error)
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
  }
}
