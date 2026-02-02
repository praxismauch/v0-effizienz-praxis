import { put, del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient, createAdminClient } from "@/lib/supabase/server"
import sharp from "sharp"
import { Redis } from "@upstash/redis"

// =============================================================================
// UNIFIED UPLOAD API
// Consolidates: /api/upload, /api/blob/upload, /api/public/chat-upload, 
// /api/ai-analysis/chat-upload, and practice-specific uploads
// =============================================================================

const UPLOAD_CONFIGS = {
  general: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      "image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    requiresAuth: true,
    compress: true,
  },
  chatImage: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    requiresAuth: true,
    compress: false,
  },
  publicChatImage: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    requiresAuth: false,
    compress: false,
    rateLimit: { window: 60, maxRequests: 5 },
  },
  deviceImage: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    requiresAuth: true,
    compress: false,
  },
  handbook: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    requiresAuth: true,
    compress: false,
  },
  avatar: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    requiresAuth: true,
    compress: true,
  },
} as const

type UploadType = keyof typeof UPLOAD_CONFIGS

// Image compression settings
const COMPRESSION = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 90,
}

// Security configuration for public uploads
const SECURITY = {
  abuseThreshold: 20,
  abuseWindow: 3600, // 1 hour
  blockDuration: 86400, // 24 hours
  suspiciousPatterns: [
    /\.php/i, /\.exe/i, /\.js$/i, /\.html$/i, /\.htm$/i, /\.asp/i, /\.jsp/i,
    /\.sh$/i, /\.bat$/i, /\.cmd$/i, /\.ps1$/i, /\.vbs$/i, /\.scr$/i, /\.pif$/i,
    /<script/i, /javascript:/i, /data:/i, /vbscript:/i,
  ],
  magicBytes: {
    "image/jpeg": [[0xff, 0xd8, 0xff]],
    "image/png": [[0x89, 0x50, 0x4e, 0x47]],
    "image/gif": [[0x47, 0x49, 0x46, 0x38]],
    "image/webp": [[0x52, 0x49, 0x46, 0x46]],
  } as Record<string, number[][]>,
}

// Initialize Redis for rate limiting (optional)
let redis: Redis | null = null
try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  }
} catch {
  console.warn("[Upload] Redis not available for rate limiting")
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getClientInfo(request: NextRequest): { ip: string; userAgent: string } {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  const userAgent = request.headers.get("user-agent") || "unknown"
  return { ip, userAgent }
}

async function checkRateLimit(ip: string, config: typeof UPLOAD_CONFIGS.publicChatImage): Promise<{ allowed: boolean; remaining: number }> {
  if (!redis || !config.rateLimit) return { allowed: true, remaining: 999 }
  
  const key = `upload-rate:${ip}`
  try {
    const current = (await redis.get<number>(key)) || 0
    if (current >= config.rateLimit.maxRequests) {
      return { allowed: false, remaining: 0 }
    }
    await redis.incr(key)
    if (current === 0) {
      await redis.expire(key, config.rateLimit.window)
    }
    return { allowed: true, remaining: config.rateLimit.maxRequests - current - 1 }
  } catch {
    return { allowed: true, remaining: config.rateLimit.maxRequests }
  }
}

async function isIpBlocked(ip: string): Promise<boolean> {
  if (!redis) return false
  try {
    return !!(await redis.get<boolean>(`blocked:ip:${ip}`))
  } catch {
    return false
  }
}

async function trackAbuse(ip: string): Promise<boolean> {
  if (!redis) return false
  try {
    const key = `abuse:${ip}`
    const attempts = await redis.incr(key)
    if (attempts === 1) await redis.expire(key, SECURITY.abuseWindow)
    if (attempts >= SECURITY.abuseThreshold) {
      await redis.set(`blocked:ip:${ip}`, true, { ex: SECURITY.blockDuration })
      return true
    }
    return false
  } catch {
    return false
  }
}

async function validateMagicBytes(file: File): Promise<boolean> {
  try {
    const buffer = await file.slice(0, 12).arrayBuffer()
    const bytes = new Uint8Array(buffer)
    const expectedMagic = SECURITY.magicBytes[file.type]
    if (!expectedMagic) return true // Allow non-image types
    return expectedMagic.some((magic) => magic.every((byte, index) => bytes[index] === byte))
  } catch {
    return false
  }
}

function isSuspiciousFilename(filename: string): boolean {
  return SECURITY.suspiciousPatterns.some((pattern) => pattern.test(filename))
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, "_")
    .replace(/^\.+/, "")
    .substring(0, 100)
}

async function compressImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
    return buffer
  }
  try {
    let sharpInstance = sharp(buffer)
    const metadata = await sharpInstance.metadata()
    
    if ((metadata.width && metadata.width > COMPRESSION.maxWidth) || 
        (metadata.height && metadata.height > COMPRESSION.maxHeight)) {
      sharpInstance = sharpInstance.resize(COMPRESSION.maxWidth, COMPRESSION.maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
    }
    
    if (mimeType === "image/jpeg") {
      return await sharpInstance.jpeg({ quality: COMPRESSION.quality }).toBuffer()
    } else if (mimeType === "image/png") {
      return await sharpInstance.png({ quality: COMPRESSION.quality, compressionLevel: 9 }).toBuffer()
    } else if (mimeType === "image/webp") {
      return await sharpInstance.webp({ quality: COMPRESSION.quality }).toBuffer()
    }
    return buffer
  } catch (error) {
    console.error("[Upload] Compression error:", error)
    return buffer
  }
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  const { ip, userAgent } = getClientInfo(request)
  
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const uploadType = (formData.get("type") as UploadType) || "general"
    const oldFileUrl = formData.get("oldFileUrl") as string | null
    const practiceId = formData.get("practiceId") as string | null
    
    // Validate upload type
    const config = UPLOAD_CONFIGS[uploadType]
    if (!config) {
      return NextResponse.json({ error: "Invalid upload type" }, { status: 400 })
    }
    
    // Check for blocked IP (public uploads only)
    if (!config.requiresAuth && await isIpBlocked(ip)) {
      return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 })
    }
    
    // Rate limiting for public uploads
    if (!config.requiresAuth && 'rateLimit' in config) {
      const { allowed, remaining } = await checkRateLimit(ip, config as typeof UPLOAD_CONFIGS.publicChatImage)
      if (!allowed) {
        return NextResponse.json(
          { error: "Zu viele Anfragen. Bitte warten Sie eine Minute." },
          { status: 429, headers: { "Retry-After": "60" } }
        )
      }
    }
    
    // Authentication check
    let userId: string | null = null
    if (config.requiresAuth) {
      const supabase = await createServerClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
      }
      userId = user.id
    }
    
    // File validation
    if (!file) {
      return NextResponse.json({ error: "Keine Datei bereitgestellt" }, { status: 400 })
    }
    
    if (file.size > config.maxSize) {
      const maxMB = Math.round(config.maxSize / (1024 * 1024))
      return NextResponse.json({ error: `Datei ist zu groß (max. ${maxMB}MB)` }, { status: 400 })
    }
    
    if (!config.allowedTypes.includes(file.type)) {
      if (!config.requiresAuth) await trackAbuse(ip)
      return NextResponse.json({ error: "Ungültiges Dateiformat" }, { status: 400 })
    }
    
    // Security checks for public uploads
    if (!config.requiresAuth) {
      if (isSuspiciousFilename(file.name)) {
        await trackAbuse(ip)
        return NextResponse.json({ error: "Ungültiger Dateiname" }, { status: 400 })
      }
      
      if (file.type.startsWith("image/") && !(await validateMagicBytes(file))) {
        await trackAbuse(ip)
        return NextResponse.json({ error: "Dateiinhalt stimmt nicht mit dem Dateityp überein" }, { status: 400 })
      }
    }
    
    // Delete old file if provided
    if (oldFileUrl && oldFileUrl.includes("blob.vercel-storage.com")) {
      try {
        await del(oldFileUrl)
      } catch (e) {
        console.error("[Upload] Error deleting old file:", e)
      }
    }
    
    // Process file
    let fileBuffer = Buffer.from(await file.arrayBuffer())
    let finalFileName = file.name
    let finalMimeType = file.type
    
    // Compress images if configured
    if (config.compress && file.type.startsWith("image/") && 
        file.type !== "image/svg+xml" && file.type !== "image/gif") {
      const originalSize = fileBuffer.length
      fileBuffer = await compressImage(fileBuffer, file.type)
      
      // Convert to JPEG for better compression (except PNG with potential transparency)
      if (file.type !== "image/png" && fileBuffer.length < originalSize) {
        finalMimeType = "image/jpeg"
        finalFileName = file.name.replace(/\.[^/.]+$/, ".jpg")
      }
    }
    
    // Generate path based on upload type
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 10)
    const sanitized = sanitizeFilename(file.name)
    
    let uploadPath: string
    switch (uploadType) {
      case "chatImage":
        uploadPath = `chat-images/${userId}/${timestamp}-${sanitized}`
        break
      case "publicChatImage":
        uploadPath = `public-chat-images/${timestamp}-${randomId}-${sanitized}`
        break
      case "deviceImage":
        uploadPath = `devices/${practiceId}/${timestamp}-${sanitized}`
        break
      case "handbook":
        uploadPath = `handbooks/${practiceId}/${timestamp}-${sanitized}`
        break
      case "avatar":
        uploadPath = `avatars/${userId}/${timestamp}-${sanitized}`
        break
      default:
        uploadPath = `uploads/${userId || "anonymous"}/${timestamp}-${sanitized}`
    }
    
    // Upload to Vercel Blob
    const blob = await put(uploadPath, fileBuffer, {
      access: "public",
      contentType: finalMimeType,
    })
    
    return NextResponse.json({
      url: blob.url,
      fileName: finalFileName,
      fileSize: fileBuffer.length,
      originalSize: file.size,
      fileType: finalMimeType,
      compressed: fileBuffer.length < file.size,
    })
    
  } catch (error) {
    console.error("[Upload] Error:", error)
    return NextResponse.json({ error: "Upload fehlgeschlagen" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }
    
    if (url.includes("blob.vercel-storage.com")) {
      await del(url)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Upload] Delete error:", error)
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
  }
}
