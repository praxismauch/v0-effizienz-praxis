import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// PUT - Update a practice-specific parameter
export async function PUT(request: NextRequest, { params }: { params: { practiceId: string; id: string } }) {
  try {
    const { practiceId, id } = params
    const supabase = await createClient()
    const body = await request.json()
    const { name, description, category, dataType, unit, interval } = body

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("analytics_parameters")
      .update({
        name,
        description: description || null,
        category,
        type: dataType,
        unit: unit || null,
        interval: interval || "monthly",
        updated_at: now,
      })
      .eq("id", id)
      .eq("practice_id", practiceId)
      .eq("is_global", false)
      .select()
      .single()

    if (error) {
      console.error("Supabase update error:", error)
      throw error
    }

    if (!data) {
      return NextResponse.json({ error: "Parameter not found or access denied" }, { status: 404 })
    }

    return NextResponse.json({ parameter: data })
  } catch (error) {
    console.error("Error updating practice parameter:", error)
    return NextResponse.json(
      {
        error: "Failed to update practice parameter",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// DELETE - Delete a practice-specific parameter
export async function DELETE(request: NextRequest, context: { params: { practiceId: string; id: string } }) {
  try {
    const { practiceId, id } = context.params
    const { searchParams } = new URL(request.url)
    const force = searchParams.get("force") === "true"
    const supabase = await createClient()

    // First check if there are any parameter values using this parameter
    const { data: values, error: valuesError } = await supabase
      .from("parameter_values")
      .select("id")
      .eq("parameter_id", id)
      .limit(1)

    if (valuesError) {
      console.error("Error checking parameter values:", valuesError)
      throw valuesError
    }

    if (values && values.length > 0 && !force) {
      // Get the count of values
      const { count } = await supabase
        .from("parameter_values")
        .select("*", { count: "exact", head: true })
        .eq("parameter_id", id)

      return NextResponse.json(
        {
          error: "Cannot delete parameter with existing data entries",
          hint: "This parameter has data entries. Delete them first or use force delete.",
          hasValues: true,
          valueCount: count || 0,
        },
        { status: 400 },
      )
    }

    if (force && values && values.length > 0) {
      const { error: deleteValuesError } = await supabase.from("parameter_values").delete().eq("parameter_id", id)

      if (deleteValuesError) {
        console.error("Error deleting parameter values:", deleteValuesError)
        throw deleteValuesError
      }
    }

    // Delete the parameter
    const { error } = await supabase
      .from("analytics_parameters")
      .delete()
      .eq("id", id)
      .eq("practice_id", practiceId)
      .eq("is_global", false)

    if (error) {
      console.error("Supabase delete error:", error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting practice parameter:", error)
    return NextResponse.json(
      {
        error: "Failed to delete practice parameter",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
