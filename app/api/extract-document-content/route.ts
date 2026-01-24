import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const { fileUrl, fileName, fileType } = await request.json()

    if (!fileUrl) {
      return NextResponse.json({ error: "File URL is required" }, { status: 400 })
    }

    let extractedText = ""
    let extractionMethod = "unknown"
    let metadata: Record<string, any> = { fileName, fileType, fileUrl }

    const extension = fileName.toLowerCase().split(".").pop()
    const detectedType = fileType || getFileTypeFromExtension(extension || "")

    if (detectedType.includes("pdf") || extension === "pdf") {
      extractionMethod = "ai-pdf-vision"
      const result = await extractPDFWithAI(fileUrl)
      extractedText = result.text
      metadata = { ...metadata, ...result.metadata }
    } else if (
      detectedType.includes("word") ||
      detectedType.includes("document") ||
      extension === "doc" ||
      extension === "docx"
    ) {
      extractionMethod = "ai-document-vision"
      const result = await extractDocumentWithAI(fileUrl)
      extractedText = result.text
      metadata = { ...metadata, ...result.metadata }
    } else if (detectedType.includes("image") || ["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
      extractionMethod = "ai-ocr"
      const result = await extractImageTextWithAI(fileUrl)
      extractedText = result.text
      metadata = { ...metadata, ...result.metadata }
    } else if (detectedType.includes("text") || extension === "txt") {
      extractionMethod = "direct-text"
      const response = await fetch(fileUrl)
      extractedText = await response.text()
    } else {
      extractionMethod = "ai-fallback"
      try {
        const result = await extractWithAIFallback(fileUrl, detectedType)
        extractedText = result.text
        metadata = { ...metadata, ...result.metadata }
      } catch (error) {
        console.error("Document extraction - Fallback failed:", error)
        extractedText = `[Unsupported file type: ${detectedType}]`
      }
    }

    return NextResponse.json({
      success: true,
      extractedText,
      extractionMethod,
      metadata,
      characterCount: extractedText.length,
      wordCount: extractedText.split(/\s+/).filter(Boolean).length,
    })
  } catch (error) {
    console.error("Document extraction - Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to extract document content",
        extractedText: "",
      },
      { status: 500 },
    )
  }
}

function getFileTypeFromExtension(ext: string): string {
  const typeMap: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    txt: "text/plain",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  }
  return typeMap[ext.toLowerCase()] || "application/octet-stream"
}

async function extractPDFWithAI(pdfUrl: string) {
  try {
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract ALL text content from this PDF document. Include:
- All visible text, headings, paragraphs, and sections
- Tables and their data (preserve structure where possible)
- Lists and bullet points
- Any numbers, dates, or financial information
- Headers, footers, and captions
- Maintain the reading order and logical structure

Format the output as clean, readable text. If there are multiple pages, separate them with [PAGE BREAK].
If any text is unclear or illegible, mark it as [UNCLEAR].`,
            },
            { type: "file", data: pdfUrl, mimeType: "application/pdf" },
          ],
        },
      ],
      maxOutputTokens: 4000,
    })

    return {
      text: text || "[No text extracted from PDF]",
      metadata: {
        extractedPages: (text.match(/\[PAGE BREAK\]/g) || []).length + 1,
        hasUnclearText: text.includes("[UNCLEAR]"),
      },
    }
  } catch (error) {
    console.error("PDF extraction failed:", error)
    return {
      text: `[PDF extraction failed: ${error instanceof Error ? error.message : "Unknown error"}]`,
      metadata: { error: true },
    }
  }
}

async function extractDocumentWithAI(docUrl: string) {
  try {
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract ALL text content from this Word document. Include:
- All text content, headings, and paragraphs
- Tables and their data
- Lists and formatting indicators
- Any embedded text or comments
- Maintain document structure

Format as clean readable text.`,
            },
            {
              type: "file",
              data: docUrl,
              mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            },
          ],
        },
      ],
      maxOutputTokens: 4000,
    })

    return { text: text || "[No text extracted from document]", metadata: { hasContent: text.length > 0 } }
  } catch (error) {
    console.error("Document extraction failed:", error)
    return {
      text: `[Document extraction failed: ${error instanceof Error ? error.message : "Unknown error"}]`,
      metadata: { error: true },
    }
  }
}

async function extractImageTextWithAI(imageUrl: string) {
  try {
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract ALL visible text from this image using OCR. Include:
- All readable text, labels, and headings
- Numbers, dates, and financial amounts
- Table data if present
- Any handwritten text (if legible)
- Preserve layout and structure where meaningful

Return the text in reading order. If text is unclear or illegible, mark it as [UNCLEAR].
If the image contains no readable text, state "No text found in image".`,
            },
            { type: "image", image: imageUrl },
          ],
        },
      ],
      maxOutputTokens: 4000,
    })

    return {
      text: text || "[No text extracted from image]",
      metadata: {
        hasText: text.length > 0 && !text.includes("No text found"),
        hasUnclearText: text.includes("[UNCLEAR]"),
      },
    }
  } catch (error) {
    console.error("Image OCR failed:", error)
    return {
      text: `[Image OCR failed: ${error instanceof Error ? error.message : "Unknown error"}]`,
      metadata: { error: true },
    }
  }
}

async function extractWithAIFallback(fileUrl: string, fileType: string) {
  try {
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      messages: [
        {
          role: "user",
          content: `Attempt to extract any readable content from this file (type: ${fileType}). Extract all visible text, data, or information that can be read. If the file cannot be processed, explain why.`,
        },
      ],
      maxOutputTokens: 2000,
    })

    return { text: text || `[Could not extract content from ${fileType}]`, metadata: { attemptedFallback: true } }
  } catch (error) {
    throw new Error(`Fallback extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
