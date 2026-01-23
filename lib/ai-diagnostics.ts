/**
 * AI Diagnostics Utility
 * Helps diagnose why AI features might not be working
 */

export async function checkAIDiagnostics(practiceId?: string, userId?: string) {
  const diagnostics = {
    environmentVariables: {
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      groq: !!process.env.GROQ_API_KEY,
      googleAI: !!process.env.GOOGLE_AI_API_KEY,
    },
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    isPreview: process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development",
    aiEnabled: true,
    isSuperAdmin: false,
    errors: [] as string[],
  }

  // Check if we're in a preview/dev environment
  if (diagnostics.isPreview) {
    diagnostics.errors.push(
      "Running in preview/development environment. AI Gateway may have limited access.",
    )
  }

  // Check if any API keys are available
  const hasAnyApiKey = Object.values(diagnostics.environmentVariables).some((v) => v)
  if (!hasAnyApiKey) {
    diagnostics.errors.push("No AI API keys found in environment variables")
  }

  // Check practice-specific AI settings if practiceId and userId provided
  if (practiceId && userId) {
    try {
      const { createServerClient } = await import("@/lib/supabase/server")
      const supabase = await createServerClient()

      // Check user role
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .maybeSingle()

      diagnostics.isSuperAdmin = userData?.role === "super_admin" || userData?.role === "superadmin"

      // Check practice AI settings
      const { data: settingsData } = await supabase
        .from("practice_settings")
        .select("system_settings")
        .eq("practice_id", practiceId)
        .maybeSingle()

      const aiEnabledInSettings = settingsData?.system_settings?.aiEnabled ?? true
      diagnostics.aiEnabled = aiEnabledInSettings || diagnostics.isSuperAdmin

      if (!aiEnabledInSettings && !diagnostics.isSuperAdmin) {
        diagnostics.errors.push("AI features are disabled for this practice in practice_settings")
      }
    } catch (error) {
      diagnostics.errors.push(
        `Error checking practice settings: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  return diagnostics
}

/**
 * Test AI connectivity
 */
export async function testAIConnection(model: string = "openai/gpt-4o-mini") {
  try {
    const { generateText } = await import("ai")

    const startTime = Date.now()
    const { text } = await generateText({
      model,
      prompt: "Say 'AI is working' in German",
      maxTokens: 50,
    })
    const endTime = Date.now()

    return {
      success: true,
      model,
      responseTime: endTime - startTime,
      response: text,
    }
  } catch (error) {
    return {
      success: false,
      model,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
