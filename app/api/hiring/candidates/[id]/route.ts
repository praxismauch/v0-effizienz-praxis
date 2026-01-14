import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createAdminClient()
    const { id } = await params
    const { data, error } = await supabase.from("candidates").select("*").eq("id", id).maybeSingle()

    if (error) {
      console.error("Error fetching candidate:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Kandidat nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error in candidate GET:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createAdminClient()
    const { id } = await params
    const body = await request.json()

    const { stage, ...validFields } = body

    const sanitizedFields = Object.keys(validFields).reduce((acc: any, key) => {
      const value = validFields[key]
      if ((key.includes("_date") || key.includes("_time") || key === "birthday") && value === "") {
        acc[key] = null
      } else {
        acc[key] = value
      }
      return acc
    }, {})

    const { data, error } = await supabase
      .from("candidates")
      .update({
        ...sanitizedFields,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Supabase error updating candidate:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error in candidate PUT:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createAdminClient()
    const { id } = await params
    const body = await request.json()

    const { stage, ...validFields } = body

    const sanitizedFields = Object.keys(validFields).reduce((acc: any, key) => {
      const value = validFields[key]
      if ((key.includes("_date") || key.includes("_time") || key === "birthday") && value === "") {
        acc[key] = null
      } else {
        acc[key] = value
      }
      return acc
    }, {})

    const { data, error } = await supabase
      .from("candidates")
      .update({
        ...sanitizedFields,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Supabase error updating candidate:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error in candidate PATCH:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createAdminClient()
    const { id } = await params

    const { data: existing, error: checkError } = await supabase
      .from("candidates")
      .select("id")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking candidate:", id, checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    if (!existing) {
      return NextResponse.json({ error: "Kandidat nicht gefunden" }, { status: 404 })
    }

    const { error: deleteError } = await supabase
      .from("candidates")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)

    if (deleteError) {
      console.error("Error deleting candidate:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in candidate DELETE:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
