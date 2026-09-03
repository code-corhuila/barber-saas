export type FinanceRecordType = 'INCOME' | 'EXPENSE';

export interface FinanceRecordRequest {
  type: FinanceRecordType;
  category: string;
  amount: number;
  description?: string;
  recordDate: string; // "YYYY-MM-DD"
}

export interface FinanceRecordResponse {
  id: number;
  type: FinanceRecordType;
  category: string;
  amount: number;
  description: string | null;
  recordDate: string;
}

export interface FinanceSummaryResponse {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
}
