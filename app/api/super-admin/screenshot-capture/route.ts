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
    const { url, viewport = "desktop", pageName = "page", practiceId = "1" } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL ist erforderlich" }, { status: 400 })
    }

    // Inject practice_id into the URL so app pages load with the correct practice context
    const urlObj = new URL(url)
    if (!urlObj.searchParams.has("practice_id")) {
      urlObj.searchParams.set("practice_id", practiceId)
    }
    const targetUrl = urlObj.toString()

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

    // Navigate to the page with practice_id injected
    await page.goto(targetUrl, {
      waitUntil: "networkidle2",
      timeout: 25000,
    })

    // Wait a bit for any animations/lazy content
    await new Promise((r) => setTimeout(r, 1500))

    // Scroll through the entire page to trigger lazy-loaded content
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0
        const distance = 400
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight
          window.scrollBy(0, distance)
          totalHeight += distance
          if (totalHeight >= scrollHeight) {
            clearInterval(timer)
            window.scrollTo(0, 0)
            resolve()
          }
        }, 100)
      })
    })

    // Wait for any lazy images/content triggered by scrolling
    await new Promise((r) => setTimeout(r, 1000))

    // Take full-page screenshot as PNG buffer
    const screenshotBuffer = await page.screenshot({
      type: "png",
      fullPage: true,
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
