/**
 * Image compression and resizing utility
 * Compresses images to max 1920px width with 90% quality
 */

export interface CompressedImage {
  blob: Blob
  width: number
  height: number
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  mimeType?: "image/jpeg" | "image/png" | "image/webp"
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.9,
  mimeType: "image/jpeg",
}

/**
 * Compress and resize an image file
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise with compressed image blob and metadata
 */
export async function compressImage(file: File, options: CompressionOptions = {}): Promise<CompressedImage> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Skip compression for non-image files or SVGs
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return {
      blob: file,
      width: 0,
      height: 0,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      reject(new Error("Could not get canvas context"))
      return
    }

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img

      if (width > opts.maxWidth) {
        height = Math.round((height * opts.maxWidth) / width)
        width = opts.maxWidth
      }

      if (height > opts.maxHeight) {
        width = Math.round((width * opts.maxHeight) / height)
        height = opts.maxHeight
      }

      // Set canvas dimensions
      canvas.width = width
      canvas.height = height

      // Draw image with high quality
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to compress image"))
            return
          }

          // If compressed is larger than original (rare), use original
          const finalBlob = blob.size < file.size ? blob : file
          const compressedSize = finalBlob.size

          resolve({
            blob: finalBlob,
            width,
            height,
            originalSize: file.size,
            compressedSize,
            compressionRatio: file.size / compressedSize,
          })

          // Clean up
          URL.revokeObjectURL(img.src)
        },
        opts.mimeType,
        opts.quality,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error("Failed to load image"))
    }

    // Load image from file
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Compress image and return as File object with original name
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise with compressed File
 */
export async function compressImageToFile(file: File, options: CompressionOptions = {}): Promise<File> {
  const { blob } = await compressImage(file, options)

  // Determine the output extension based on mime type
  const mimeType = options.mimeType || DEFAULT_OPTIONS.mimeType
  const extension = mimeType === "image/png" ? ".png" : mimeType === "image/webp" ? ".webp" : ".jpg"

  // Create new filename with correct extension
  const baseName = file.name.replace(/\.[^/.]+$/, "")
  const newFileName = `${baseName}${extension}`

  return new File([blob], newFileName, { type: mimeType })
}

/**
 * Check if a file is an image that can be compressed
 */
export function isCompressibleImage(file: File): boolean {
  const compressibleTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  return compressibleTypes.includes(file.type)
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
