import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const DEFAULT_PRACTICE_FORMS = [
  { id: "1", value: "einzelpraxis", label: "Einzelpraxis", display_order: 1, is_active: true },
  { id: "2", value: "bag", label: "Berufsausübungsgemeinschaft (BAG)", display_order: 2, is_active: true },
  { id: "3", value: "mvz", label: "Medizinisches Versorgungszentrum (MVZ)", display_order: 3, is_active: true },
  { id: "4", value: "praxisgemeinschaft", label: "Praxisgemeinschaft", display_order: 4, is_active: true },
  { id: "5", value: "facharzt", label: "Facharztpraxis", display_order: 5, is_active: true },
  { id: "6", value: "zahnarzt", label: "Zahnarztpraxis", display_order: 6, is_active: true },
  { id: "7", value: "other", label: "Sonstige", display_order: 7, is_active: true },
]

export async function GET() {
  try {
    const supabase = await createAdminClient()

    // First try with display_order, fall back to created_at if column doesn't exist
    let data, error
    const result = await supabase
      .from("practice_forms")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (result.error?.message?.includes("display_order")) {
      // Column doesn't exist, try without ordering by display_order
      const fallback = await supabase
        .from("practice_forms")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true })
      data = fallback.data
      error = fallback.error
    } else {
      data = result.data
      error = result.error
    }

    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
        return NextResponse.json(DEFAULT_PRACTICE_FORMS)
      }
      console.error("Error fetching practice forms:", error.message)
      return NextResponse.json(DEFAULT_PRACTICE_FORMS)
    }

    return NextResponse.json(data || DEFAULT_PRACTICE_FORMS)
  } catch (error: any) {
    console.error("Error fetching practice forms:", error)
    return NextResponse.json(DEFAULT_PRACTICE_FORMS)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()
    const { value, label } = body

    if (!value || !label) {
      return NextResponse.json({ error: "value and label are required" }, { status: 400 })
    }

    const { data: maxOrder } = await supabase
      .from("practice_forms")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1)
      .single()

    const newOrder = (maxOrder?.display_order || 0) + 1

    const { data, error } = await supabase
      .from("practice_forms")
      .insert({
        value: value.trim().toLowerCase().replace(/\s+/g, "-"),
        label: label.trim(),
        display_order: newOrder,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "42P01" || error.message.includes("Could not find the table")) {
        return NextResponse.json(
          { error: "Tabelle 'practice_forms' existiert noch nicht. Bitte Migration ausführen." },
          { status: 503 },
        )
      }
      if (error.code === "23505") {
        return NextResponse.json({ error: "Eine Praxisart mit diesem Wert existiert bereits." }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error creating practice form:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
