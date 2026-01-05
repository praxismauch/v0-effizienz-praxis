import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request, { params }: { params: { practiceId: string } }) {
  try {
    const { practiceId } = params

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    const isPreview = !user && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY

    const client = isPreview ? await createAdminClient() : supabase

    const { data, error } = await client
      .from("bank_transaction_categories")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (error) {
      console.error("Error fetching bank transaction categories:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error in GET bank transaction categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { practiceId: string } }) {
  try {
    const { practiceId } = params
    const body = await request.json()

    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("bank_transaction_categories")
      .insert({
        practice_id: practiceId,
        name: body.name,
        color: body.color || "#3b82f6",
        description: body.description || "",
        icon: body.icon || "",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating bank transaction category:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, {
      status: 201,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error in POST bank transaction category:", error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}
