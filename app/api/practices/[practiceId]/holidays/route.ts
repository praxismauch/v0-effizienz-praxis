import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year")

    let query = supabase
      .from("holidays")
      .select("*")
      .eq("practice_id", params.practiceId)
      .is("deleted_at", null)
      .order("date", { ascending: true })

    if (year) {
      query = query.eq("year", Number.parseInt(year))
    }

    const { data: holidays, error } = await query

    if (error) throw error

    return NextResponse.json({ holidays })
  } catch (error) {
    console.error("[v0] Error fetching holidays:", error)
    return NextResponse.json({ error: "Failed to fetch holidays" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, date, year, isRecurring } = body

    const { data: holiday, error } = await supabase
      .from("holidays")
      .insert({
        practice_id: params.practiceId,
        name,
        date,
        year,
        is_recurring: isRecurring || false,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ holiday }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating holiday:", error)
    return NextResponse.json({ error: "Failed to create holiday" }, { status: 500 })
  }
}
