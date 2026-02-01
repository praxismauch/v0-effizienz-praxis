import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

async function safeSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T; error: any }>,
): Promise<{ data: T | null; error: any }> {
  try {
    return await queryFn()
  } catch (error: any) {
    // Handle JSON parse errors from Supabase rate limiting
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      console.error("[v0] Supabase rate limit detected:", error.message)
      return { data: null, error: { message: "Rate limit exceeded", code: "RATE_LIMIT" } }
    }
    throw error
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createAdminClient()
    const { searchParams } = new URL(request.url)
    const practiceId = searchParams.get("practiceId")
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const excludeArchived = searchParams.get("excludeArchived")
    const withoutJobPosting = searchParams.get("withoutJobPosting")
    const jobPostingId = searchParams.get("jobPostingId")

    let query = supabase
      .from("candidates")
      .select(
        `
        id,
        first_name,
        last_name,
        email,
        phone,
        mobile,
        address,
        city,
        postal_code,
        country,
        date_of_birth,
        current_position,
        current_company,
        years_of_experience,
        education,
        portfolio_url,
        salary_expectation,
        source,
        notes,
        status,
        practice_id,
        created_by,
        documents,
        image_url,
        resume_url,
        linkedin_url,
        cover_letter,
        skills,
        languages,
        certifications,
        availability_date,
        rating,
        created_at,
        updated_at,
        weekly_hours,
        first_contact_date,
        applications!left(
          id,
          job_posting_id,
          status,
          job_postings(
            id,
            title,
            department
          )
        )
      `,
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (practiceId) {
      query = query.eq("practice_id", practiceId)
    }

    if (status) {
      query = query.eq("status", status)
    }

    if (excludeArchived === "true") {
      query = query.neq("status", "archived")
    }

    if (jobPostingId) {
      const { data: applicationsData } = await safeSupabaseQuery(() =>
        supabase
          .from("applications")
          .select("candidate_id")
          .eq("practice_id", practiceId || "")
          .eq("job_posting_id", jobPostingId),
      )

      const candidateIdsWithJobPosting = applicationsData?.map((app: any) => app.candidate_id) || []

      if (candidateIdsWithJobPosting.length > 0) {
        query = query.in("id", candidateIdsWithJobPosting)
      } else {
        return NextResponse.json([])
      }
    }

    if (withoutJobPosting === "true") {
      const { data: applicationsData } = await safeSupabaseQuery(() =>
        supabase
          .from("applications")
          .select("candidate_id")
          .eq("practice_id", practiceId || ""),
      )

      const candidateIdsWithApplications = applicationsData?.map((app: any) => app.candidate_id) || []

      if (candidateIdsWithApplications.length > 0) {
        query = query.not("id", "in", `(${candidateIdsWithApplications.join(",")})`)
      }
    }

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,current_position.ilike.%${search}%`,
      )
    }

    const { data, error } = await safeSupabaseQuery(() => query)

    if (error) {
      if (error.message.includes("Could not find the table") || error.code === "PGRST205") {
        return NextResponse.json([])
      }
      if (error.code === "RATE_LIMIT") {
        console.error("[v0] Rate limit exceeded, returning empty candidates")
        return NextResponse.json([])
      }
      console.error("[v0] Error fetching candidates:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error("[v0] Error in candidates GET:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()

    const createdBy = body.created_by || body.createdBy
    if (!createdBy) {
      return NextResponse.json({ error: "created_by is required" }, { status: 400 })
    }

    const practiceId = body.practice_id || body.practiceId
    if (!practiceId) {
      return NextResponse.json({ error: "practice_id is required" }, { status: 400 })
    }

    const firstName = body.first_name || body.firstName
    const lastName = body.last_name || body.lastName

    if (!firstName || !lastName) {
      return NextResponse.json({ error: "first_name and last_name are required" }, { status: 400 })
    }

    // Check for duplicate candidate with same name in the same practice
    const { data: existingCandidates, error: checkError } = await supabase
      .from("candidates")
      .select("id, first_name, last_name")
      .eq("practice_id", practiceId)
      .ilike("first_name", firstName.trim())
      .ilike("last_name", lastName.trim())
      .is("deleted_at", null)
      .limit(1)

    if (checkError) {
      console.error("[v0] Error checking for duplicate candidate:", checkError)
    }

    if (existingCandidates && existingCandidates.length > 0) {
      return NextResponse.json(
        { 
          error: `Ein Kandidat mit dem Namen "${firstName} ${lastName}" existiert bereits.`,
          code: "DUPLICATE_CANDIDATE"
        }, 
        { status: 409 }
      )
    }

    const candidateData: any = {
      first_name: body.first_name || body.firstName,
      last_name: body.last_name || body.lastName,
      email: body.email,
      phone: body.phone || null,
      mobile: body.mobile || null,
      address: body.address || null,
      city: body.city || null,
      postal_code: body.postal_code || body.postalCode || null,
      date_of_birth: body.date_of_birth || body.dateOfBirth || null,
      current_position: body.current_position || body.currentPosition || null,
      current_company: body.current_company || body.currentCompany || null,
      years_of_experience: body.years_of_experience || body.yearsOfExperience || null,
      education: body.education || null,
      portfolio_url: body.portfolio_url || body.portfolioUrl || null,
      salary_expectation: body.salary_expectation || body.salaryExpectation || null,
      source: body.source || null,
      notes: body.notes || null,
      status: body.status || "new",
      practice_id: practiceId,
      created_by: createdBy,
      image_url: body.image_url || body.imageUrl || null,
      resume_url: body.resume_url || body.resumeUrl || null,
      linkedin_url: body.linkedin_url || body.linkedinUrl || null,
      cover_letter: body.cover_letter || body.coverLetter || null,
      skills: body.skills || null,
      languages: body.languages || null,
      certifications: body.certifications || null,
      availability_date: body.availability_date || body.availabilityDate || null,
      rating: body.rating || null,
      weekly_hours: body.weekly_hours || body.weeklyHours || null,
      first_contact_date: body.first_contact_date || body.firstContactDate || null,
    }

    if (body.documents && Object.keys(body.documents).length > 0) {
      candidateData.documents = body.documents
    }

    const { data: insertData, error: insertError } = await supabase
      .from("candidates")
      .insert(candidateData)
      .select(
        `
        id,
        first_name,
        last_name,
        email,
        phone,
        mobile,
        address,
        city,
        postal_code,
        country,
        date_of_birth,
        current_position,
        current_company,
        years_of_experience,
        education,
        portfolio_url,
        salary_expectation,
        source,
        notes,
        status,
        practice_id,
        created_by,
        documents,
        image_url,
        resume_url,
        linkedin_url,
        cover_letter,
        skills,
        languages,
        certifications,
        availability_date,
        rating,
        created_at,
        updated_at,
        weekly_hours,
        first_contact_date
      `,
      )

    if (insertError) {
      if (insertError.message.includes("Could not find the table") || insertError.code === "PGRST205") {
        return NextResponse.json(
          { error: "Hiring tables not set up. Please run the SQL migration script." },
          { status: 503 },
        )
      }
      console.error("[v0] Error creating candidate:", insertError.message)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const newCandidate = Array.isArray(insertData) ? insertData[0] : insertData

    return NextResponse.json(newCandidate)
  } catch (error: any) {
    console.error("[v0] Error in candidates POST:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
