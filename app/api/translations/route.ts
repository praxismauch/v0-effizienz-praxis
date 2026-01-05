import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import Logger from "@/lib/logger"

export async function GET() {
  try {
    Logger.info("api", "Fetching translations", { route: "/api/translations" })

    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("translations")
      .select("*")
      .order("category", { ascending: true })
      .order("key", { ascending: true })

    if (error) {
      Logger.error("api", "Supabase query error", error, {
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      return NextResponse.json({ translations: [] }, { status: 200 })
    }

    Logger.info("api", "Translations fetched successfully", { count: data?.length || 0 })

    return NextResponse.json({ translations: data || [] })
  } catch (error) {
    Logger.error("api", "Error fetching translations", error)
    return NextResponse.json({ translations: [] }, { status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()

    Logger.info("api", "Creating translation", { key: body.key, category: body.category })

    const { data, error } = await supabase
      .from("translations")
      .insert({
        key: body.key,
        english: body.english,
        german: body.german,
        category: body.category,
        description: body.description,
      })
      .select()
      .single()

    if (error) {
      Logger.error("api", "Error creating translation", error)
      throw error
    }

    Logger.info("api", "Translation created successfully", { id: data?.id })
    return NextResponse.json({ translation: data })
  } catch (error) {
    Logger.error("api", "Error in translation POST", error)
    return NextResponse.json({ error: "Failed to create translation" }, { status: 500 })
  }
}
