import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { isEmailConfigured } from "@/lib/email/send-email"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const healthCheck = {
      database: await checkDatabase(),
      api: checkAPI(),
      email: await checkEmail(),
      storage: checkStorage(),
    }

    return NextResponse.json(healthCheck)
  } catch (error) {
    console.error("Error in health check:", error)
    return NextResponse.json(
      {
        database: { status: "down", message: "Fehler bei der Überprüfung", timestamp: new Date().toISOString() },
        api: { status: "down", message: "Fehler bei der Überprüfung", timestamp: new Date().toISOString() },
        email: { status: "down", message: "Fehler bei der Überprüfung", timestamp: new Date().toISOString() },
        storage: { status: "down", message: "Fehler bei der Überprüfung", timestamp: new Date().toISOString() },
      },
      { status: 500 },
    )
  }
}

async function checkDatabase() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return {
        status: "down",
        message: "Supabase nicht konfiguriert",
        timestamp: new Date().toISOString(),
      }
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Simple query to test connection
    const { error } = await supabase.from("practices").select("id").limit(1)

    if (error) throw error

    return {
      status: "operational",
      message: "Datenbankverbindung erfolgreich (Supabase)",
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Database health check failed:", error)
    return {
      status: "down",
      message: "Keine Datenbankverbindung",
      timestamp: new Date().toISOString(),
    }
  }
}

function checkAPI() {
  return {
    status: "operational",
    message: "API-Server antwortet",
    timestamp: new Date().toISOString(),
  }
}

async function checkEmail() {
  const hasEmailConfig = await isEmailConfigured()

  if (hasEmailConfig) {
    return {
      status: "operational",
      message: "E-Mail-Service konfiguriert (SMTP)",
      timestamp: new Date().toISOString(),
    }
  }

  return {
    status: "degraded",
    message: "E-Mail-Service nicht konfiguriert",
    timestamp: new Date().toISOString(),
  }
}

function checkStorage() {
  const hasStorageConfig = !!process.env.BLOB_READ_WRITE_TOKEN

  if (hasStorageConfig) {
    return {
      status: "operational",
      message: "Speicher verfügbar",
      timestamp: new Date().toISOString(),
    }
  }

  return {
    status: "degraded",
    message: "Speicher nicht vollständig konfiguriert",
    timestamp: new Date().toISOString(),
  }
}
