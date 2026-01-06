"use client"

import { useState, useCallback } from "react"
import {
  compressImage,
  compressImageToFile,
  isCompressibleImage,
  type CompressedImage,
  type CompressionOptions,
} from "@/lib/image-compression"

interface UseImageCompressionReturn {
  compressFile: (file: File, options?: CompressionOptions) => Promise<File>
  compressFiles: (files: File[], options?: CompressionOptions) => Promise<File[]>
  isCompressing: boolean
  compressionStats: CompressedImage | null
  error: string | null
}

/**
 * Hook for image compression with loading state
 */
export function useImageCompression(): UseImageCompressionReturn {
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionStats, setCompressionStats] = useState<CompressedImage | null>(null)
  const [error, setError] = useState<string | null>(null)

  const compressFile = useCallback(async (file: File, options?: CompressionOptions): Promise<File> => {
    setIsCompressing(true)
    setError(null)

    try {
      if (!isCompressibleImage(file)) {
        // Return original file if not compressible
        return file
      }

      const stats = await compressImage(file, options)
      setCompressionStats(stats)

      return await compressImageToFile(file, options)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Compression failed"
      setError(errorMessage)
      // Return original file on error
      return file
    } finally {
      setIsCompressing(false)
    }
  }, [])

  const compressFiles = useCallback(async (files: File[], options?: CompressionOptions): Promise<File[]> => {
    setIsCompressing(true)
    setError(null)

    try {
      const compressedFiles = await Promise.all(
        files.map(async (file) => {
          if (!isCompressibleImage(file)) {
            return file
          }
          return compressImageToFile(file, options)
        }),
      )
      return compressedFiles
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Compression failed"
      setError(errorMessage)
      return files
    } finally {
      setIsCompressing(false)
    }
  }, [])

  return {
    compressFile,
    compressFiles,
    isCompressing,
    compressionStats,
    error,
  }
}
