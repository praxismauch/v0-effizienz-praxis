import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMIT_WINDOW: 60, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 5, // Max 5 uploads per minute per IP

  // Abuse protection
  ABUSE_THRESHOLD: 20, // Block IP after 20 failed attempts in 1 hour
  ABUSE_WINDOW: 3600, // 1 hour
  BLOCK_DURATION: 86400, // 24 hour block for abusive IPs

  // File restrictions
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_EXTENSIONS: ["jpg", "jpeg", "png", "gif", "webp"],
  ALLOWED_MIME_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],

  // Magic bytes for file type validation
  MAGIC_BYTES: {
    "image/jpeg": [[0xff, 0xd8, 0xff]],
    "image/png": [[0x89, 0x50, 0x4e, 0x47]],
    "image/gif": [[0x47, 0x49, 0x46, 0x38]],
    "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  } as Record<string, number[][]>,

  // Suspicious patterns
  SUSPICIOUS_FILENAMES: [
    /\.php/i,
    /\.exe/i,
    /\.js$/i,
    /\.html$/i,
    /\.htm$/i,
    /\.asp/i,
    /\.jsp/i,
    /\.sh$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.ps1$/i,
    /\.vbs$/i,
    /\.scr$/i,
    /\.pif$/i,
    /<script/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
  ],
}

// Redis client for rate limiting and abuse tracking
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

interface SecurityEvent {
  type: "rate_limit" | "abuse" | "blocked" | "invalid_file" | "suspicious" | "success"
  ip: string
  userAgent?: string
  filename?: string
  reason?: string
  timestamp: number
}

async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    const key = `security:events:${new Date().toISOString().split("T")[0]}`
    await redis.lpush(key, JSON.stringify(event))
    await redis.expire(key, 7 * 24 * 60 * 60) // Keep logs for 7 days

    // Alert on suspicious activity
    if (event.type === "abuse" || event.type === "blocked" || event.type === "suspicious") {
      console.warn(`[Security Alert] ${event.type}: IP=${event.ip}, reason=${event.reason}`)
    }
  } catch (error) {
    console.error("[Security] Failed to log event:", error)
  }
}

async function isIpBlocked(ip: string): Promise<boolean> {
  try {
    const blocked = await redis.get<boolean>(`blocked:ip:${ip}`)
    return !!blocked
  } catch {
    return false
  }
}

async function blockIp(ip: string, reason: string): Promise<void> {
  try {
    await redis.set(`blocked:ip:${ip}`, true, { ex: SECURITY_CONFIG.BLOCK_DURATION })
    await logSecurityEvent({ type: "blocked", ip, reason, timestamp: Date.now() })
  } catch (error) {
    console.error("[Security] Failed to block IP:", error)
  }
}

async function trackAbuse(ip: string): Promise<{ shouldBlock: boolean; attempts: number }> {
  try {
    const key = `abuse:${ip}`
    const attempts = await redis.incr(key)

    if (attempts === 1) {
      await redis.expire(key, SECURITY_CONFIG.ABUSE_WINDOW)
    }

    return { shouldBlock: attempts >= SECURITY_CONFIG.ABUSE_THRESHOLD, attempts }
  } catch {
    return { shouldBlock: false, attempts: 0 }
  }
}

async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const key = `public-chat-upload:${ip}`

  try {
    const current = (await redis.get<number>(key)) || 0

    if (current >= SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS) {
      // Track abuse for repeated rate limit hits
      const { shouldBlock } = await trackAbuse(ip)
      if (shouldBlock) {
        await blockIp(ip, "Repeated rate limit violations")
      }
      return { allowed: false, remaining: 0 }
    }

    await redis.incr(key)
    if (current === 0) {
      await redis.expire(key, SECURITY_CONFIG.RATE_LIMIT_WINDOW)
    }

    return { allowed: true, remaining: SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS - current - 1 }
  } catch (error) {
    console.error("[Public Chat Upload] Rate limit check failed:", error)
    return { allowed: true, remaining: SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS }
  }
}

async function validateMagicBytes(file: File): Promise<boolean> {
  try {
    const buffer = await file.slice(0, 12).arrayBuffer()
    const bytes = new Uint8Array(buffer)

    const expectedMagic = SECURITY_CONFIG.MAGIC_BYTES[file.type]
    if (!expectedMagic) return false

    return expectedMagic.some((magic) => magic.every((byte, index) => bytes[index] === byte))
  } catch {
    return false
  }
}

function isSuspiciousFilename(filename: string): boolean {
  return SECURITY_CONFIG.SUSPICIOUS_FILENAMES.some((pattern) => pattern.test(filename))
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_") // Only allow safe characters
    .replace(/\.{2,}/g, "_") // Prevent directory traversal
    .replace(/^\.+/, "") // Remove leading dots
    .substring(0, 100) // Limit length
}

function getClientInfo(request: NextRequest): { ip: string; userAgent: string } {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  const userAgent = request.headers.get("user-agent") || "unknown"
  return { ip, userAgent }
}

export async function POST(request: NextRequest) {
  const { ip, userAgent } = getClientInfo(request)

  try {
    if (await isIpBlocked(ip)) {
      await logSecurityEvent({
        type: "blocked",
        ip,
        userAgent,
        reason: "Previously blocked IP attempted access",
        timestamp: Date.now(),
      })
      return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 })
    }

    const { allowed, remaining } = await checkRateLimit(ip)
    if (!allowed) {
      await logSecurityEvent({
        type: "rate_limit",
        ip,
        userAgent,
        reason: "Rate limit exceeded",
        timestamp: Date.now(),
      })
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warten Sie eine Minute." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS.toString(),
            "X-RateLimit-Remaining": "0",
            "Retry-After": SECURITY_CONFIG.RATE_LIMIT_WINDOW.toString(),
          },
        },
      )
    }

    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      await trackAbuse(ip)
      return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 })
    }

    const file = formData.get("file") as File
    if (!file) {
      return NextResponse.json({ error: "Keine Datei bereitgestellt" }, { status: 400 })
    }

    if (!SECURITY_CONFIG.ALLOWED_MIME_TYPES.includes(file.type)) {
      const { shouldBlock } = await trackAbuse(ip)
      await logSecurityEvent({
        type: "invalid_file",
        ip,
        userAgent,
        filename: file.name,
        reason: `Invalid MIME type: ${file.type}`,
        timestamp: Date.now(),
      })
      if (shouldBlock) await blockIp(ip, "Repeated invalid file type attempts")
      return NextResponse.json({ error: "Nur Bilddateien sind erlaubt" }, { status: 400 })
    }

    if (file.size > SECURITY_CONFIG.MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Datei ist zu groß (max. 5MB)" }, { status: 400 })
    }

    const extension = file.name.split(".").pop()?.toLowerCase()
    if (!extension || !SECURITY_CONFIG.ALLOWED_EXTENSIONS.includes(extension)) {
      const { shouldBlock } = await trackAbuse(ip)
      await logSecurityEvent({
        type: "invalid_file",
        ip,
        userAgent,
        filename: file.name,
        reason: `Invalid extension: ${extension}`,
        timestamp: Date.now(),
      })
      if (shouldBlock) await blockIp(ip, "Repeated invalid file extension attempts")
      return NextResponse.json({ error: "Ungültiges Dateiformat. Erlaubt: JPG, PNG, GIF, WEBP" }, { status: 400 })
    }

    if (isSuspiciousFilename(file.name)) {
      const { shouldBlock } = await trackAbuse(ip)
      await logSecurityEvent({
        type: "suspicious",
        ip,
        userAgent,
        filename: file.name,
        reason: "Suspicious filename pattern detected",
        timestamp: Date.now(),
      })
      if (shouldBlock) await blockIp(ip, "Suspicious filename patterns")
      return NextResponse.json({ error: "Ungültiger Dateiname" }, { status: 400 })
    }

    const validMagicBytes = await validateMagicBytes(file)
    if (!validMagicBytes) {
      const { shouldBlock } = await trackAbuse(ip)
      await logSecurityEvent({
        type: "suspicious",
        ip,
        userAgent,
        filename: file.name,
        reason: "File content doesn't match declared type",
        timestamp: Date.now(),
      })
      if (shouldBlock) await blockIp(ip, "File type spoofing attempts")
      return NextResponse.json({ error: "Dateiinhalt stimmt nicht mit dem Dateityp überein" }, { status: 400 })
    }

    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 10)
    const sanitizedFilename = sanitizeFilename(file.name)
    const filename = `public-chat-images/${timestamp}-${randomId}-${sanitizedFilename}`

    const blob = await put(filename, file, {
      access: "public",
    })

    await logSecurityEvent({
      type: "success",
      ip,
      userAgent,
      filename: file.name,
      timestamp: Date.now(),
    })

    return NextResponse.json(
      {
        url: blob.url,
        filename: file.name,
        size: file.size,
        type: file.type,
      },
      {
        headers: {
          "X-RateLimit-Limit": SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
        },
      },
    )
  } catch (error) {
    console.error("[Public Chat Upload] Error:", error)
    return NextResponse.json({ error: "Bild-Upload fehlgeschlagen" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // This endpoint is for checking security stats - would need admin auth
  const { ip } = getClientInfo(request)

  try {
    const today = new Date().toISOString().split("T")[0]
    const events = await redis.lrange(`security:events:${today}`, 0, 100)

    const stats = {
      totalEvents: events.length,
      byType: events.reduce(
        (acc, e) => {
          const event = JSON.parse(e as string) as SecurityEvent
          acc[event.type] = (acc[event.type] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
      recentSuspicious: events
        .map((e) => JSON.parse(e as string) as SecurityEvent)
        .filter((e) => ["abuse", "blocked", "suspicious"].includes(e.type))
        .slice(0, 10),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("[Security Stats] Error:", error)
    return NextResponse.json({ error: "Failed to fetch security stats" }, { status: 500 })
  }
}
