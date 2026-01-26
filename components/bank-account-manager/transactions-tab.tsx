"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Calendar,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import type { BankTransaction, WorkflowCategory, FilterType, TimeSpan, SortDirection } from "./types"

interface TransactionsTabProps {
  transactions: BankTransaction[]
  paginatedTransactions: BankTransaction[]
  filteredCount: number
  workflowCategories: WorkflowCategory[]
  loading: boolean
  isLoading: boolean
  searchQuery: string
  setSearchQuery: (query: string) => void
  sortColumn: keyof BankTransaction | null
  sortDirection: SortDirection
  filterType: FilterType
  setFilterType: (type: FilterType) => void
  timeSpan: TimeSpan
  setTimeSpan: (span: TimeSpan) => void
  currentPage: number
  setCurrentPage: (page: number) => void
  itemsPerPage: number
  setItemsPerPage: (items: number) => void
  totalPages: number
  aiAnalysisLoading: boolean
  onSort: (column: keyof BankTransaction) => void
  onCategoryUpdate: (transactionId: string, category: string) => void
  onAiAnalysis: () => void
  onDeleteAll: () => void
}

export function TransactionsTab({
  transactions,
  paginatedTransactions,
  filteredCount,
  workflowCategories,
  loading,
  isLoading,
  searchQuery,
  setSearchQuery,
  sortColumn,
  sortDirection,
  filterType,
  setFilterType,
  timeSpan,
  setTimeSpan,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  totalPages,
  aiAnalysisLoading,
  onSort,
  onCategoryUpdate,
  onAiAnalysis,
  onDeleteAll,
}: TransactionsTabProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: currency || "EUR" }).format(amount)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch {
      return dateString
    }
  }

  const SortIcon = ({ column }: { column: keyof BankTransaction }) => {
    if (sortColumn !== column) return null
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Suche nach Partner, Verwendungszweck, Datum oder Betrag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={timeSpan} onValueChange={(value: TimeSpan) => setTimeSpan(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Zeiten</SelectItem>
                <SelectItem value="week">Letzte Woche</SelectItem>
                <SelectItem value="month">Letzter Monat</SelectItem>
                <SelectItem value="year">Letztes Jahr</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Transaktionen</SelectItem>
              <SelectItem value="income">Nur Einnahmen</SelectItem>
              <SelectItem value="expense">Nur Ausgaben</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={onAiAnalysis}
            disabled={transactions.length === 0 || aiAnalysisLoading}
            className="bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white"
          >
            {aiAnalysisLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span className="font-semibold ml-2">KI Analyse</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onDeleteAll}
            disabled={isLoading || transactions.length === 0}
            className="hover:text-destructive hover:bg-destructive/10"
            title="Alle Transaktionen löschen"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => onSort("transaction_date")}>
                <div className="flex items-center gap-1">
                  Datum
                  <SortIcon column="transaction_date" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => onSort("category")}>
                <div className="flex items-center gap-1">
                  Kategorie
                  <SortIcon column="category" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => onSort("sender_receiver")}>
                <div className="flex items-center gap-1">
                  Name
                  <SortIcon column="sender_receiver" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => onSort("description")}>
                <div className="flex items-center gap-1">
                  Verwendungszweck
                  <SortIcon column="description" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 text-right" onClick={() => onSort("amount")}>
                <div className="flex items-center gap-1 justify-end">
                  Betrag
                  <SortIcon column="amount" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Transaktionen werden geladen...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredCount === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {searchQuery || filterType !== "all" || timeSpan !== "all"
                    ? "Keine Transaktionen gefunden"
                    : "Noch keine Transaktionen vorhanden"}
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{formatDate(transaction.transaction_date)}</TableCell>
                  <TableCell>
                    <Select
                      value={transaction.category || "none"}
                      onValueChange={(value) => onCategoryUpdate(transaction.id, value)}
                    >
                      <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue placeholder="Kategorie wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Keine Kategorie</SelectItem>
                        {workflowCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{transaction.sender_receiver}</TableCell>
                  <TableCell className="max-w-xs truncate" title={transaction.description}>
                    {transaction.description}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <span className={transaction.amount >= 0 ? "text-green-600" : "text-red-600"}>
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredCount > 0 && (
        <div className="flex items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Einträge pro Seite:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[100px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="-1">Alle</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {itemsPerPage === -1
                ? `${filteredCount} von ${filteredCount}`
                : `${Math.min((currentPage - 1) * itemsPerPage + 1, filteredCount)}-${Math.min(currentPage * itemsPerPage, filteredCount)} von ${filteredCount}`}
            </span>
          </div>

          {itemsPerPage !== -1 && totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Zurück
              </Button>
              <span className="text-sm text-muted-foreground">
                Seite {currentPage} von {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Weiter
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
