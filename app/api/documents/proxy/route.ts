import { NextRequest, NextResponse } from "next/server"

/**
 * Server-side proxy for document preview.
 * Fetches documents (PDFs, images, etc.) server-side to avoid CORS issues
 * when embedding Vercel Blob URLs in iframes/object tags.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 })
  }

  // Validate URL - only allow Vercel Blob storage domains
  try {
    const parsedUrl = new URL(url)
    const hostname = parsedUrl.hostname
    
    // Allow any *.blob.vercel-storage.com or *.public.blob.vercel-storage.com subdomain
    const isVercelBlob = hostname.endsWith(".blob.vercel-storage.com") || 
                         hostname === "blob.vercel-storage.com"
    // Also allow Supabase storage
    const isSupabaseStorage = hostname.endsWith(".supabase.co") || 
                              hostname.endsWith(".supabase.in")
    
    if (!isVercelBlob && !isSupabaseStorage) {
      return NextResponse.json(
        { error: "URL host not allowed" },
        { status: 403 }
      )
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "*/*",
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${response.status}` },
        { status: response.status }
      )
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream"
    const contentLength = response.headers.get("content-length")
    const body = response.body

    if (!body) {
      return NextResponse.json({ error: "Empty response body" }, { status: 502 })
    }

    const headers = new Headers({
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    })

    if (contentLength) {
      headers.set("Content-Length", contentLength)
    }

    // For PDFs, set Content-Disposition to inline so the browser renders them
    if (contentType.includes("pdf")) {
      headers.set("Content-Disposition", "inline")
    }

    return new NextResponse(body, {
      status: 200,
      headers,
    })
  } catch (error: any) {
    console.error("[v0] Document proxy error:", error?.message)
    return NextResponse.json(
      { error: `Proxy fetch failed: ${error?.message}` },
      { status: 502 }
    )
  }
}
