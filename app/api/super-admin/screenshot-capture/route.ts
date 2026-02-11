import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export const maxDuration = 60

const VIEWPORT_SIZES: Record<string, { width: number; height: number }> = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
}

export async function POST(request: NextRequest) {
  try {
    const { url, viewport = "desktop", pageName = "page" } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL ist erforderlich" }, { status: 400 })
    }

    const size = VIEWPORT_SIZES[viewport] || VIEWPORT_SIZES.desktop

    // Dynamic import to avoid bundling issues
    const chromium = await import("@sparticuz/chromium")
    const puppeteer = await import("puppeteer-core")

    // Launch headless browser
    const browser = await puppeteer.default.launch({
      args: chromium.default.args,
      defaultViewport: {
        width: size.width,
        height: size.height,
      },
      executablePath: await chromium.default.executablePath(),
      headless: true,
    })

    const page = await browser.newPage()

    // Set viewport
    await page.setViewport({
      width: size.width,
      height: size.height,
      deviceScaleFactor: 1,
    })

    // Navigate to the page
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 25000,
    })

    // Wait a bit for any animations/lazy content
    await new Promise((r) => setTimeout(r, 1500))

    // Take screenshot as PNG buffer
    const screenshotBuffer = await page.screenshot({
      type: "png",
      fullPage: false,
    })

    await browser.close()

    // Generate a clean filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const safeName = pageName.replace(/[^a-zA-Z0-9-]/g, "_").toLowerCase()
    const filename = `screenshots/${safeName}_${viewport}_${timestamp}.png`

    // Upload to Vercel Blob
    const blob = await put(filename, screenshotBuffer, {
      access: "public",
      contentType: "image/png",
    })

    return NextResponse.json({
      success: true,
      imageUrl: blob.url,
      viewport,
      pageName,
    })
  } catch (error: unknown) {
    console.error("[Screenshot Capture] Error:", error)
    const message = error instanceof Error ? error.message : "Screenshot-Erstellung fehlgeschlagen"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
