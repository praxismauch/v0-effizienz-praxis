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

    // Inject practice_id into the URL
    const urlObj = new URL(url)
    if (!urlObj.searchParams.has("practice_id")) {
      urlObj.searchParams.set("practice_id", practiceId)
    }
    const targetUrl = urlObj.toString()
    const origin = urlObj.origin

    const size = VIEWPORT_SIZES[viewport] || VIEWPORT_SIZES.desktop

    // Forward the caller's auth cookies to Puppeteer so the browser session is authenticated
    const cookieHeader = request.headers.get("cookie") || ""

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

    // Parse and inject the caller's auth cookies into Puppeteer
    // This forwards the logged-in super admin's session to the headless browser
    const domain = new URL(origin).hostname
    const cookies = cookieHeader.split(";").map((c) => c.trim()).filter(Boolean)
    const puppeteerCookies = cookies.map((cookie) => {
      const [nameVal, ...rest] = cookie.split("=")
      return {
        name: nameVal.trim(),
        value: [rest.join("=")].join("").trim(),
        domain,
        path: "/",
        httpOnly: false,
        secure: domain !== "localhost",
        sameSite: "Lax" as const,
      }
    })

    if (puppeteerCookies.length > 0) {
      await page.setCookie(...puppeteerCookies)
    }

    // Navigate to the target page (now authenticated via forwarded cookies)
    // Use domcontentloaded first (fast), then wait for network to settle
    try {
      await page.goto(targetUrl, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      })
    } catch (navError) {
      // If even domcontentloaded fails, the page is truly unreachable
      await browser.close()
      return NextResponse.json({
        success: false,
        error: "Navigation fehlgeschlagen: " + (navError instanceof Error ? navError.message : String(navError))
      }, { status: 500 })
    }

    // Wait for network to become mostly idle (but don't fail if it doesn't fully settle)
    try {
      await page.waitForNetworkIdle({ idleTime: 1500, timeout: 15000 })
    } catch {
      // Some pages have long-running requests (SSE, analytics, etc.) -- that's OK
    }

    // Extra wait for client-side rendering / animations
    await new Promise((r) => setTimeout(r, 2000))

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
