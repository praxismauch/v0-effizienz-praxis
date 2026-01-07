import { NextResponse } from "next/server"
import { requirePracticeAccess, handleApiError } from "@/lib/api-helpers"

export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { adminClient } = await requirePracticeAccess(practiceId)

    const { data, error } = await adminClient
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
    return handleApiError(error)
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { adminClient } = await requirePracticeAccess(practiceId)

    const body = await request.json()

    const { data, error } = await adminClient
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
    return handleApiError(error)
  }
}
