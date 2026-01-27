export interface BankTransaction {
  id: string
  transaction_date: string
  amount: number
  sender_receiver: string
  description: string
  category: string
  currency: string
}

export interface WorkflowCategory {
  id: string
  name: string
  color: string
  icon: string
  description?: string
  is_active?: boolean
}

export interface CSVMapping {
  dateIndex: number
  categoryIndex: number
  senderIndex: number
  descriptionIndex: number
  amountIndex: number
}

export interface UploadStats {
  total: number
  new: number
  skipped: number
  errors?: any[]
}

export type FilterType = "all" | "income" | "expense"
export type TimeSpan = "all" | "week" | "month" | "year"
export type SortDirection = "asc" | "desc"
