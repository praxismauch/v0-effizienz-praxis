"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Application } from "../types"
import { getStatusBadge, formatDate } from "../utils"

interface ApplicationsCardProps {
  applications: Application[]
}

export function ApplicationsCard({ applications }: ApplicationsCardProps) {
  if (applications.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bewerbungsverlauf</CardTitle>
        <CardDescription>{applications.length} Bewerbung(en)</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stelle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Phase</TableHead>
              <TableHead>Bewerbungsdatum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{app.job_postings?.title}</p>
                    <p className="text-sm text-muted-foreground">{app.job_postings?.department}</p>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(app.status)}</TableCell>
                <TableCell>{app.stage || "-"}</TableCell>
                <TableCell>{formatDate(app.applied_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
