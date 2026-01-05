import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

// Helper to extract text from PDF (using a simple approach)
async function extractTextFromPDF(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    // Note: In production, you'd use a library like pdf-parse
    // For now, we'll return a placeholder
    return "[PDF content - requires pdf-parse library for full extraction]"
  } catch (error) {
    return "[Error reading PDF]"
  }
}

// Helper to fetch document content
async function fetchDocumentContent(fileUrl: string, fileType: string): Promise<string> {
  try {
    // For text-based files, fetch directly
    if (fileType === "text/plain" || fileType === "txt") {
      const response = await fetch(fileUrl)
      return await response.text()
    }

    // For PDFs, extract text
    if (fileType === "application/pdf" || fileType === "pdf") {
      return await extractTextFromPDF(fileUrl)
    }

    // For other file types, return metadata only
    return `[${fileType} - Content extraction not supported yet]`
  } catch (error) {
    return `[Error fetching content: ${error instanceof Error ? error.message : "Unknown error"}]`
  }
}

export async function POST(request: NextRequest) {
  try {
    const { folderId, folderName, practiceId, allDocuments, allFolders } = await request.json()

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    const documentsWithContent = await Promise.all(
      allDocuments.map(async (doc: any) => {
        const content = doc.file_url ? await fetchDocumentContent(doc.file_url, doc.file_type) : null
        return {
          name: doc.name,
          type: doc.file_type,
          size: doc.file_size,
          created_at: doc.created_at,
          tags: doc.tags || [],
          content: content, // Add actual content
          description: doc.description,
        }
      }),
    )

    // Build folder structure recursively with content
    const buildFolderStructure = (currentFolderId: string | null, depth = 0): any => {
      const subfolders = allFolders.filter((f: any) => f.parent_folder_id === currentFolderId)
      const folderDocs = documentsWithContent.filter((d: any) => {
        const originalDoc = allDocuments.find((od: any) => od.name === d.name && od.type === d.type)
        return originalDoc?.folder_id === currentFolderId
      })

      return {
        documents: folderDocs,
        subfolders: subfolders.map((folder: any) => ({
          name: folder.name,
          description: folder.description,
          ...buildFolderStructure(folder.id, depth + 1),
        })),
      }
    }

    const structure = buildFolderStructure(folderId)
    const currentFolderName = folderName || "Hauptordner"

    const prompt = `Analysiere die folgenden Dokumente und deren INHALT für eine medizinische Praxis:

Ordner: ${currentFolderName}

Dokumentenstruktur mit Inhalten:
${JSON.stringify(structure, null, 2)}

WICHTIG: Konzentriere dich auf den INHALT der Dokumente, nicht nur auf die Ordnerstruktur!

Bitte analysiere:
1. Inhaltliche Analyse: Was für Informationen enthalten die Dokumente? Welche Themen werden behandelt?
2. Vollständigkeit: Fehlen wichtige Dokumente oder Informationen für eine Praxis?
3. Qualität: Sind die Dokumente aktuell und vollständig?
4. Compliance: Erfüllen die Dokumente rechtliche und medizinische Anforderungen?
5. Organisation: Wie gut sind die Inhalte strukturiert und auffindbar?
6. Empfehlungen: Konkrete Vorschläge basierend auf dem Inhalt der Dokumente
7. Risiken: Potenzielle Probleme bezüglich Inhalt, Aktualität oder fehlender Informationen

Gib eine detaillierte, professionelle Analyse auf Deutsch zurück, die sich auf den INHALT konzentriert.`

    let analysisText: string

    try {
      const { text } = await generateText({
        model: "openai/gpt-4o",
        prompt,
        temperature: 0.7,
        maxTokens: 3000,
      })
      analysisText = text
    } catch (error) {
      // Generate fallback analysis based on document structure
      const totalDocs = allDocuments.filter((d: any) => {
        const isInFolder = (docFolderId: string | null, targetId: string | null): boolean => {
          if (docFolderId === targetId) return true
          const parentFolder = allFolders.find((f: any) => f.id === docFolderId)
          if (!parentFolder || !parentFolder.parent_folder_id) return false
          return isInFolder(parentFolder.parent_folder_id, targetId)
        }
        return isInFolder(d.folder_id, folderId)
      }).length

      const totalSubfolders =
        allFolders.filter((f: any) => {
          const isSubfolder = (checkFolderId: string | null, targetId: string | null): boolean => {
            if (checkFolderId === targetId) return true
            const parentFolder = allFolders.find((f: any) => f.id === checkFolderId)
            if (!parentFolder || !parentFolder.parent_folder_id) return false
            return isSubfolder(parentFolder.parent_folder_id, targetId)
          }
          return f.parent_folder_id !== null && isSubfolder(f.parent_folder_id, folderId)
        }).length + allFolders.filter((f: any) => f.parent_folder_id === folderId).length

      const docTypes = [...new Set(allDocuments.map((d: any) => d.file_type))]

      analysisText = `# Analyse: ${currentFolderName}

## Übersicht
Dieser Ordner enthält **${totalDocs} Dokument(e)** in **${totalSubfolders} Unterordner(n)**.

## Dokumententypen
Die folgenden Dateitypen wurden gefunden: ${docTypes.join(", ")}.

## Struktur
${structure.subfolders.length > 0 ? `Der Ordner ist in ${structure.subfolders.length} Unterordner organisiert, was auf eine strukturierte Ablage hindeutet.` : "Es gibt keine Unterordner. Eine bessere Organisation durch Kategorisierung könnte hilfreich sein."}

## Empfehlungen
${totalDocs === 0 ? "⚠️ Dieser Ordner ist leer. Fügen Sie relevante Dokumente hinzu." : totalDocs < 5 ? "📋 Der Ordner enthält wenige Dokumente. Stellen Sie sicher, dass alle wichtigen Informationen vorhanden sind." : "✓ Der Ordner enthält eine gute Anzahl an Dokumenten."}

${structure.subfolders.length === 0 && totalDocs > 10 ? "💡 Bei mehr als 10 Dokumenten sollten Sie Unterordner zur besseren Organisation anlegen." : ""}

## Hinweis
Dies ist eine strukturbasierte Analyse. Für eine detaillierte inhaltliche Bewertung aktivieren Sie bitte die KI-gestützte Analyse.`
    }

    return NextResponse.json({
      analysis: analysisText,
      folderName: currentFolderName,
      stats: {
        totalDocuments: allDocuments.filter((d: any) => {
          const isInFolder = (docFolderId: string | null, targetId: string | null): boolean => {
            if (docFolderId === targetId) return true
            const parentFolder = allFolders.find((f: any) => f.id === docFolderId)
            if (!parentFolder || !parentFolder.parent_folder_id) return false
            return isInFolder(parentFolder.parent_folder_id, targetId)
          }
          return isInFolder(d.folder_id, folderId)
        }).length,
        totalFolders:
          allFolders.filter((f: any) => {
            const isSubfolder = (checkFolderId: string | null, targetId: string | null): boolean => {
              if (checkFolderId === targetId) return true
              const parentFolder = allFolders.find((f: any) => f.id === checkFolderId)
              if (!parentFolder || !parentFolder.parent_folder_id) return false
              return isSubfolder(parentFolder.parent_folder_id, targetId)
            }
            return f.parent_folder_id !== null && isSubfolder(f.parent_folder_id, folderId)
          }).length + allFolders.filter((f: any) => f.parent_folder_id === folderId).length,
      },
    })
  } catch (error) {
    console.error("Error analyzing folder:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze folder" },
      { status: 500 },
    )
  }
}
