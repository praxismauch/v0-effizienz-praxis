import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import type { OptimizationMetrics } from "./types"

interface SecurityTabProps {
  security: OptimizationMetrics["security"]
}

export function SecurityTab({ security }: SecurityTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Sicherheitsanalyse</CardTitle>
          <CardDescription>Sicherheitsstatus und Schwachstellen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">RLS Compliance</span>
              <span className="text-2xl font-bold">{security.rlsCompliance.toFixed(0)}%</span>
            </div>
            <Progress value={security.rlsCompliance} />
          </div>

          {security.functionSecurityIssues && security.functionSecurityIssues > 0 && (
            <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-orange-900 mb-2">Funktions-Sicherheit</h4>
                  <p className="text-sm text-orange-800 mb-2">
                    {security.functionSecurityIssues} Datenbankfunktionen haben keinen festen search_path
                    und sind anfällig für Manipulationsangriffe.
                  </p>
                  <code className="text-xs bg-orange-100 px-2 py-1 rounded">
                    scripts/fix-function-search-path-security.sql
                  </code>
                </div>
              </div>
            </div>
          )}

          {security.passwordProtectionEnabled === false && (
            <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 mb-2">Passwort-Schutz deaktiviert</h4>
                  <p className="text-sm text-red-800 mb-2">
                    Schutz vor kompromittierten Passwörtern (HaveIBeenPwned) ist nicht aktiviert. Aktivieren Sie
                    dies in der Supabase-Konsole unter Authentication - Policies.
                  </p>
                </div>
              </div>
            </div>
          )}

          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {security.vulnerabilities.length === 0 ? (
                <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-900">Keine Schwachstellen gefunden</h4>
                      <p className="text-sm text-green-800">Ihr System erfüllt alle Sicherheitsstandards.</p>
                    </div>
                  </div>
                </div>
              ) : (
                security.vulnerabilities.map((vuln, index) => (
                  <Card
                    key={index}
                    className={`border-l-4 ${
                      vuln.severity === "high"
                        ? "border-red-500"
                        : vuln.severity === "medium"
                          ? "border-orange-500"
                          : "border-yellow-500"
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{vuln.type}</CardTitle>
                        <Badge
                          variant={vuln.severity === "high" ? "destructive" : "secondary"}
                          className="capitalize"
                        >
                          {vuln.severity === "high" ? "Hoch" : vuln.severity === "medium" ? "Mittel" : "Niedrig"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{vuln.description}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
