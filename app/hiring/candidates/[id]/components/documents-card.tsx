"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, ExternalLink, Globe, LinkIcon, Eye, Download } from "lucide-react"
import type { Candidate, Document } from "../types"
import { formatDate } from "../utils"

interface DocumentsCardProps {
  candidate: Candidate
  onViewDocument: (doc: Document) => void
}

export function DocumentsCard({ candidate, onViewDocument }: DocumentsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Dokumente & Links
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* External Links */}
          {(candidate.resume_url || candidate.portfolio_url || candidate.linkedin_url) && (
            <div>
              <p className="text-sm text-muted-foreground mb-3">Externe Links</p>
              <div className="space-y-2">
                {candidate.resume_url && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Lebenslauf</p>
                        <p className="text-sm text-muted-foreground">Online Lebenslauf</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
                {candidate.portfolio_url && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Portfolio</p>
                        <p className="text-sm text-muted-foreground">Online Portfolio</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <a href={candidate.portfolio_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
                {candidate.linkedin_url && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <LinkIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">LinkedIn</p>
                        <p className="text-sm text-muted-foreground">LinkedIn Profil</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Uploaded Documents */}
          {candidate.documents && Array.isArray(candidate.documents) && candidate.documents.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-3">Hochgeladene Dokumente</p>
              <div className="space-y-2">
                {candidate.documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{doc.filename || doc.name || "Dokument"}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.size && `${(doc.size / 1024).toFixed(1)} KB`}
                          {doc.uploadedAt && ` • ${formatDate(doc.uploadedAt)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onViewDocument({
                            name: doc.filename || doc.name || "Dokument",
                            url: doc.url,
                            type: doc.type,
                          })
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={doc.url} download={doc.filename || doc.name}>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No documents message */}
          {!candidate.resume_url &&
            !candidate.portfolio_url &&
            !candidate.linkedin_url &&
            (!candidate.documents || candidate.documents.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">Keine Dokumente oder Links verfügbar</p>
            )}
        </div>
      </CardContent>
    </Card>
  )
}
