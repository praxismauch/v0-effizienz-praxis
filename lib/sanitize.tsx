/**
 * HTML Sanitization utilities to prevent XSS attacks
 * Used for any user-generated or AI-generated content that needs to be rendered as HTML
 */

// Characters that need to be escaped in HTML
const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
}

// Allowed HTML tags for formatted content
const ALLOWED_TAGS = new Set([
  "strong",
  "b",
  "em",
  "i",
  "code",
  "span",
  "br",
  "p",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "pre",
  "a",
  "div",
])

// Allowed attributes per tag
const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  "*": new Set(["class", "style"]),
  a: new Set(["class", "href", "target", "rel"]),
}

// Dangerous patterns to remove
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /vbscript:/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<form/gi,
  /<meta/gi,
  /<link/gi,
  /<style/gi,
  /expression\s*\(/gi,
  /url\s*\(\s*['"]?\s*data:/gi,
]

/**
 * Escape HTML special characters
 */
export function escapeHtml(str: string | null | undefined): string {
  if (str == null) return ""
  return String(str).replace(/[&<>"'/]/g, (char) => HTML_ESCAPE_MAP[char] || char)
}

/**
 * Sanitize HTML content by removing dangerous elements
 * Allows only safe formatting tags
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return ""

  let sanitized = String(html)

  // Remove dangerous patterns first
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, "")
  }

  // Remove data: URIs except for safe image types
  sanitized = sanitized.replace(/data:(?!image\/(png|jpeg|gif|webp|svg\+xml))[^"'\s)]+/gi, "")

  // Clean disallowed tags but keep content
  sanitized = sanitized.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag) => {
    const tagLower = tag.toLowerCase()
    if (ALLOWED_TAGS.has(tagLower)) {
      // Clean attributes from allowed tags
      return match.replace(/\s+([a-z-]+)\s*=\s*["'][^"']*["']/gi, (attrMatch, attrName) => {
        const attrLower = attrName.toLowerCase()
        const globalAllowed = ALLOWED_ATTRIBUTES["*"]
        const tagAllowed = ALLOWED_ATTRIBUTES[tagLower]

        if (globalAllowed?.has(attrLower) || tagAllowed?.has(attrLower)) {
          // For href attributes, validate the URL
          if (attrLower === "href") {
            const hrefMatch = attrMatch.match(/["']([^"']*)["']/)
            if (hrefMatch) {
              const url = hrefMatch[1].trim().toLowerCase()
              // Block dangerous protocols
              if (url.startsWith("javascript:") || url.startsWith("vbscript:") || url.startsWith("data:")) {
                return ""
              }
            }
          }
          return attrMatch
        }
        return ""
      })
    }
    return "" // Remove disallowed tags
  })

  return sanitized
}

/**
 * Sanitize content specifically for AI-generated markdown-to-HTML conversion
 * More permissive but still safe
 */
export function sanitizeAIContent(content: string | null | undefined): string {
  if (!content) return ""

  let sanitized = String(content)

  // Remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, "")
  }

  // Remove any remaining event handlers that might have been obfuscated
  sanitized = sanitized.replace(/\bon[a-z]+\s*=\s*["'][^"']*["']/gi, "")

  return sanitized
}

/**
 * Create safe HTML for dangerouslySetInnerHTML
 * This should be used as a wrapper around any content that needs innerHTML
 */
export function createSafeHtml(html: string | null | undefined): { __html: string } {
  return { __html: sanitizeHtml(html) }
}

/**
 * Validate and sanitize URL to prevent javascript: and data: URLs
 */
const SAFE_URL_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"])

export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return ""

  const trimmed = String(url).trim()

  // Handle relative URLs
  if (trimmed.startsWith("/") || trimmed.startsWith("#") || trimmed.startsWith("?")) {
    return trimmed
  }

  try {
    const parsed = new URL(trimmed, "https://placeholder.com")
    if (!SAFE_URL_PROTOCOLS.has(parsed.protocol)) {
      return "#"
    }
    return trimmed
  } catch {
    // If URL parsing fails, check for dangerous schemes manually
    const lower = trimmed.toLowerCase()
    if (
      lower.startsWith("javascript:") ||
      lower.startsWith("data:") ||
      lower.startsWith("vbscript:") ||
      lower.startsWith("file:")
    ) {
      return "#"
    }
    return trimmed
  }
}

/**
 * New utility for safe markdown-to-HTML inline formatting
 */
export function safeFormatInline(text: string): string {
  if (!text) return ""

  // First escape any raw HTML
  let safe = escapeHtml(text)

  // Then apply safe markdown transformations
  safe = safe
    // Bold text **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    // Inline code `code`
    .replace(/`([^`]+)`/g, '<code class="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    // Italic text *text* (but not if already part of bold)
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="italic">$1</em>')
    // Underscore italic _text_
    .replace(/_([^_]+)_/g, '<em class="italic text-foreground/80">$1</em>')

  return safe
}
