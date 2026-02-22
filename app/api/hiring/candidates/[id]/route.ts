import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createAdminClient()

    const { id } = await params

    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle()

    if (error) {
      console.error("[v0] Candidate GET: Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Kandidat nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Candidate GET: Exception:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createAdminClient()
    const { id } = await params
    const body = await request.json()

    const { stage, ...validFields } = body

    // Check for duplicate if name is being changed
    const firstName = validFields.first_name
    const lastName = validFields.last_name
    const practiceId = validFields.practice_id

    if (firstName && lastName && practiceId) {
      const { data: existingCandidates, error: checkError } = await supabase
        .from("candidates")
        .select("id, first_name, last_name")
        .eq("practice_id", practiceId)
        .ilike("first_name", firstName.trim())
        .ilike("last_name", lastName.trim())
        .is("deleted_at", null)
        .neq("id", id) // Exclude current candidate
        .limit(1)

      if (!checkError && existingCandidates && existingCandidates.length > 0) {
        return NextResponse.json(
          { 
            error: `Ein Kandidat mit dem Namen "${firstName} ${lastName}" existiert bereits.`,
            code: "DUPLICATE_CANDIDATE"
          }, 
          { status: 409 }
        )
      }
    }

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
      .maybeSingle()

    if (error) {
      console.error("Supabase error updating candidate:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Kandidat nicht gefunden" }, { status: 404 })
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

    // Check for duplicate if name is being changed
    const firstName = validFields.first_name
    const lastName = validFields.last_name
    
    if (firstName || lastName) {
      // Get current candidate to check practice_id and fill in missing name parts
      const { data: currentCandidate } = await supabase
        .from("candidates")
        .select("practice_id, first_name, last_name")
        .eq("id", id)
        .maybeSingle()

      if (currentCandidate) {
        const checkFirstName = firstName || currentCandidate.first_name
        const checkLastName = lastName || currentCandidate.last_name

        const { data: existingCandidates, error: checkError } = await supabase
          .from("candidates")
          .select("id, first_name, last_name")
          .eq("practice_id", currentCandidate.practice_id)
          .ilike("first_name", checkFirstName.trim())
          .ilike("last_name", checkLastName.trim())
          .is("deleted_at", null)
          .neq("id", id)
          .limit(1)

        if (!checkError && existingCandidates && existingCandidates.length > 0) {
          return NextResponse.json(
            { 
              error: `Ein Kandidat mit dem Namen "${checkFirstName} ${checkLastName}" existiert bereits.`,
              code: "DUPLICATE_CANDIDATE"
            }, 
            { status: 409 }
          )
        }
      }
    }

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
      .maybeSingle()

    if (error) {
      console.error("Supabase error updating candidate:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Kandidat nicht gefunden" }, { status: 404 })
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
