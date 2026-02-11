import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== "string") {
      return NextResponse.json({ status: 0, ok: false }, { status: 400 })
    }

    // Fetch the page with redirect: manual to detect redirects without following them
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      const res = await fetch(url, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": "EffizienzPraxis-ScreenshotChecker/1.0",
        },
      })

      clearTimeout(timeout)

      const redirectedTo = res.headers.get("location") || undefined

      return NextResponse.json({
        status: res.status,
        ok: res.status >= 200 && res.status < 400,
        redirectedTo,
      })
    } catch (fetchError: unknown) {
      clearTimeout(timeout)
      const message = fetchError instanceof Error ? fetchError.message : "Unknown error"
      if (message.includes("abort")) {
        return NextResponse.json({ status: 0, ok: false, error: "Timeout" })
      }
      return NextResponse.json({ status: 0, ok: false, error: message })
    }
  } catch {
    return NextResponse.json({ status: 0, ok: false }, { status: 500 })
  }
}
