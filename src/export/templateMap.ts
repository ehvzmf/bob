import type { Entry } from '../lib'

export type ExportRow = {
  seq: number
  date: string
  merchant: string
  amount: number
  item: string
  memo: string
}

export const EXPORT_ROW_START = 5
export const EXPORT_COLUMNS = ['B', 'C', 'D', 'E', 'F', 'G', 'H'] as const

export function buildExportRows(entries: Entry[]): ExportRow[] {
  return entries
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((e, i) => ({
      seq: i + 1,
      date: e.date,
      merchant: e.merchant || '직접 입력',
      amount: e.amount,
      item: e.item || '식대',
      memo: e.memo || '',
    }))
}

export function toExcelDateNumber(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  const utc = Date.UTC(y, m - 1, d)
  return (utc - Date.UTC(1899, 11, 30)) / 86400000
}
