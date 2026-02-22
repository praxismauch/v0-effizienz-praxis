import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {

  try {
    const groqApiKey = process.env.GROQ_API_KEY
    const openaiApiKey = process.env.OPENAI_API_KEY

    // Determine which API to use
    const useGroq = !!groqApiKey
    const apiKey = useGroq ? groqApiKey : openaiApiKey
    const apiUrl = useGroq
      ? "https://api.groq.com/openai/v1/audio/transcriptions"
      : "https://api.openai.com/v1/audio/transcriptions"
    const modelName = useGroq ? "whisper-large-v3" : "whisper-1"

    if (!apiKey) {
      console.error("[v0] No API key configured for transcription (neither GROQ_API_KEY nor OPENAI_API_KEY)")
      return NextResponse.json(
        {
          error: "Transkription nicht konfiguriert. Bitte kontaktieren Sie den Administrator.",
          details: "Missing API key for transcription service",
        },
        { status: 500 },
      )
    }

    const formData = await req.formData()
    const audioFile = formData.get("audio") as File | null

    if (!audioFile) {
      console.error("[v0] No audio file provided in request")
      return NextResponse.json({ error: "Keine Audiodatei vorhanden" }, { status: 400 })
    }

    const language = (formData.get("language") as string) || "de"

    if (audioFile.size > 25 * 1024 * 1024) {
      console.error("[v0] Audio file too large:", audioFile.size, "bytes")
      return NextResponse.json({ error: "Audiodatei zu groß. Maximum ist 25MB." }, { status: 400 })
    }

    if (audioFile.size === 0) {
      console.error("[v0] Audio file is empty")
      return NextResponse.json({ error: "Audiodatei ist leer. Bitte nehmen Sie zuerst Audio auf." }, { status: 400 })
    }

    const transcriptionFormData = new FormData()
    transcriptionFormData.append("file", audioFile, audioFile.name || "audio.webm")
    transcriptionFormData.append("model", modelName)
    transcriptionFormData.append("language", language.split("-")[0])
    transcriptionFormData.append("response_format", "json")

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: transcriptionFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData: any = {}
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }

      console.error("[v0] API response error:", response.status, JSON.stringify(errorData, null, 2))

      // Try fallback to OpenAI if Groq fails and OpenAI key exists
      if (useGroq && openaiApiKey && (response.status === 401 || response.status === 500)) {

        const fallbackFormData = new FormData()
        fallbackFormData.append("file", audioFile, audioFile.name || "audio.webm")
        fallbackFormData.append("model", "whisper-1")
        fallbackFormData.append("language", language.split("-")[0])
        fallbackFormData.append("response_format", "json")

        const fallbackResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: fallbackFormData,
        })

        if (fallbackResponse.ok) {
          const result = await fallbackResponse.json()
          const transcribedText = result.text || ""
          return NextResponse.json({ text: transcribedText })
        }
      }

      // Return appropriate error messages in German
      if (response.status === 401) {
        return NextResponse.json(
          {
            error: "API-Schlüssel ungültig. Bitte kontaktieren Sie den Administrator.",
          },
          { status: 401 },
        )
      }
      if (response.status === 429) {
        return NextResponse.json(
          {
            error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut.",
          },
          { status: 429 },
        )
      }

      return NextResponse.json(
        { error: errorData.error?.message || "Transkription fehlgeschlagen", details: errorText },
        { status: response.status },
      )
    }

    const result = await response.json()
    const transcribedText = result.text || ""

    return NextResponse.json({ text: transcribedText })
  } catch (error) {
    console.error("[v0] ===== Transcription Error =====")
    console.error("[v0] Error details:", error)

    let errorMessage = "Transkription fehlgeschlagen"

    if (error instanceof Error) {
      if (error.message.includes("API key") || error.message.includes("Incorrect API key")) {
        errorMessage = "API-Schlüssel ungültig"
      } else if (error.message.includes("rate limit")) {
        errorMessage = "Zu viele Anfragen. Bitte später erneut versuchen."
      } else if (error.message.includes("audio") || error.message.includes("format")) {
        errorMessage = "Ungültiges Audioformat. Bitte erneut aufnehmen."
      }
    }

    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
