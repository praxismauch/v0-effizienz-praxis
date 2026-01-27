import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = await createAdminClient()

    const { data, error } = await adminClient
      .from("arbeitsmittel")
      .select("*")
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching arbeitsmittel:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error("Error in arbeitsmittel GET:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = await createAdminClient()

    const { data, error } = await adminClient
      .from("arbeitsmittel")
      .insert({
        name: body.name,
        type: body.type,
        serial_number: body.serial_number || null,
        status: body.status || "available",
        condition: body.condition || null,
        assigned_to: body.assigned_to || null,
        purchase_date: body.purchase_date || null,
        purchase_price: body.purchase_price || null,
        warranty_until: body.warranty_until || null,
        notes: body.notes || null,
        practice_id: practiceId,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating arbeitsmittel:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error in arbeitsmittel POST:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
