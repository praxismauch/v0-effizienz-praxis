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
    console.log("[v0] Screenshot capture - cookie header length:", cookieHeader.length)
    console.log("[v0] Screenshot capture - has cookies:", cookieHeader.length > 0)
    console.log("[v0] Screenshot capture - targetUrl:", targetUrl)

    // Dynamic import to avoid bundling issues
    let chromium: typeof import("@sparticuz/chromium")
    let puppeteer: typeof import("puppeteer-core")
    try {
      chromium = await import("@sparticuz/chromium")
      puppeteer = await import("puppeteer-core")
      console.log("[v0] Screenshot capture - chromium and puppeteer loaded successfully")
    } catch (importError) {
      console.error("[v0] Screenshot capture - failed to import chromium/puppeteer:", importError)
      return NextResponse.json({ 
        success: false, 
        error: "Chromium/Puppeteer konnte nicht geladen werden. Bitte überprüfen Sie die Abhängigkeiten." 
      }, { status: 500 })
    }

    // Launch headless browser
    let browser
    try {
      const execPath = await chromium.default.executablePath()
      console.log("[v0] Screenshot capture - chromium executablePath:", execPath)
      browser = await puppeteer.default.launch({
        args: chromium.default.args,
        defaultViewport: {
          width: size.width,
          height: size.height,
        },
        executablePath: execPath,
        headless: true,
      })
      console.log("[v0] Screenshot capture - browser launched successfully")
    } catch (launchError) {
      console.error("[v0] Screenshot capture - browser launch failed:", launchError)
      return NextResponse.json({ 
        success: false, 
        error: "Browser konnte nicht gestartet werden: " + (launchError instanceof Error ? launchError.message : String(launchError))
      }, { status: 500 })
    }

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
    console.log("[v0] Screenshot capture - navigating to:", targetUrl)
    try {
      await page.goto(targetUrl, {
        waitUntil: "networkidle2",
        timeout: 25000,
      })
      console.log("[v0] Screenshot capture - navigation successful, current URL:", page.url())
    } catch (navError) {
      console.error("[v0] Screenshot capture - navigation failed:", navError)
      await browser.close()
      return NextResponse.json({
        success: false,
        error: "Navigation fehlgeschlagen: " + (navError instanceof Error ? navError.message : String(navError))
      }, { status: 500 })
    }

    // Wait for any animations/lazy content
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
