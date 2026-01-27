"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Loader2, Sparkles, TrendingUp, Lightbulb } from "lucide-react"
import { useBankAccount } from "./bank-account-manager/use-bank-account"
import { TransactionsTab } from "./bank-account-manager/transactions-tab"
import { CategoriesTab } from "./bank-account-manager/categories-tab"
import { UploadTab } from "./bank-account-manager/upload-tab"

interface BankAccountManagerProps {
  practiceId: string
}

export function BankAccountManager({ practiceId }: BankAccountManagerProps) {
  const [activeTab, setActiveTab] = useState("transactions")
  
  const {
    // Data
    transactions,
    workflowCategories,
    filteredAndSortedTransactions,
    paginatedTransactions,
    totalPages,
    
    // Loading states
    loading,
    uploading,
    isLoading,
    
    // Filter/sort states
    searchQuery,
    setSearchQuery,
    sortColumn,
    sortDirection,
    filterType,
    setFilterType,
    timeSpan,
    setTimeSpan,
    
    // Pagination
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    
    // Upload states
    file,
    previewData,
    mapping,
    setMapping,
    uploadStats,
    setUploadStats,
    
    // AI Analysis
    showAiAnalysis,
    setShowAiAnalysis,
    aiAnalysisLoading,
    aiAnalysisResult,
    
    // Category dialog
    showCategoryDialog,
    setShowCategoryDialog,
    editingCategory,
    newCategoryName,
    setNewCategoryName,
    newCategoryColor,
    setNewCategoryColor,
    newCategoryDescription,
    setNewCategoryDescription,
    
    // Handlers
    fetchTransactions,
    updateTransactionCategory,
    handleSaveCategory,
    handleDeleteCategory,
    handleEditCategory,
    resetCategoryForm,
    handleDeleteAllTransactions,
    handleFileChange,
    handleUpload,
    handleAiAnalysis,
    handleSort,
  } = useBankAccount(practiceId)

  // Calculate summary stats
  const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const balance = totalIncome - totalExpense

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amount)
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Bankkonto-Manager</CardTitle>
          <CardDescription>
            Verwalten Sie Ihre Banktransaktionen und erhalten Sie KI-gestützte Analysen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Transaktionen</div>
                <div className="text-2xl font-bold">{transactions.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Einnahmen</div>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Ausgaben</div>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Bilanz</div>
                <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(balance)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="transactions">Transaktionen</TabsTrigger>
                <TabsTrigger value="categories">Kategorien</TabsTrigger>
                <TabsTrigger value="upload">CSV Import</TabsTrigger>
              </TabsList>
              
              <Button variant="outline" size="sm" onClick={fetchTransactions} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Aktualisieren
              </Button>
            </div>

            <TabsContent value="transactions">
              <TransactionsTab
                transactions={transactions}
                paginatedTransactions={paginatedTransactions}
                filteredCount={filteredAndSortedTransactions.length}
                workflowCategories={workflowCategories}
                loading={loading}
                isLoading={isLoading}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                filterType={filterType}
                setFilterType={setFilterType}
                timeSpan={timeSpan}
                setTimeSpan={setTimeSpan}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                totalPages={totalPages}
                aiAnalysisLoading={aiAnalysisLoading}
                onSort={handleSort}
                onCategoryUpdate={updateTransactionCategory}
                onAiAnalysis={handleAiAnalysis}
                onDeleteAll={handleDeleteAllTransactions}
              />
            </TabsContent>

            <TabsContent value="categories">
              <CategoriesTab
                categories={workflowCategories}
                showDialog={showCategoryDialog}
                setShowDialog={setShowCategoryDialog}
                editingCategory={editingCategory}
                categoryName={newCategoryName}
                setCategoryName={setNewCategoryName}
                categoryColor={newCategoryColor}
                setCategoryColor={setNewCategoryColor}
                categoryDescription={newCategoryDescription}
                setCategoryDescription={setNewCategoryDescription}
                onSave={handleSaveCategory}
                onEdit={handleEditCategory}
                onDelete={handleDeleteCategory}
                onReset={resetCategoryForm}
              />
            </TabsContent>

            <TabsContent value="upload">
              <UploadTab
                file={file}
                previewData={previewData}
                mapping={mapping}
                setMapping={setMapping}
                uploadStats={uploadStats}
                setUploadStats={setUploadStats}
                uploading={uploading}
                onFileChange={handleFileChange}
                onUpload={handleUpload}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* AI Analysis Dialog */}
      <Dialog open={showAiAnalysis} onOpenChange={setShowAiAnalysis}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              KI-Finanzanalyse
            </DialogTitle>
            <DialogDescription>
              Basierend auf {filteredAndSortedTransactions.length} Transaktionen
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {aiAnalysisLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
                <p className="text-muted-foreground">Analysiere Ihre Finanzdaten...</p>
              </div>
            ) : aiAnalysisResult ? (
              <div className="space-y-4">
                <div className="prose dark:prose-invert max-w-none">
                  <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap">
                    {aiAnalysisResult}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <span className="font-medium">Einnahmen</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">Empfehlung</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Kategorisieren Sie mehr Transaktionen für bessere Einblicke
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Keine Analyse verfügbar
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
