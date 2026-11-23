import type { CardRow } from './lib'

function normalizeDate(raw: unknown): string | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const date = new Date(Date.UTC(1899, 11, 30 + raw))
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
  }
  const value = String(raw ?? '').trim()
  const iso = value.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/)
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`
  const dot = value.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/)
  if (dot) return `${dot[1]}-${dot[2].padStart(2, '0')}-${dot[3].padStart(2, '0')}`
  return null
}

function amountFrom(raw: unknown): number | null {
  const value = String(raw ?? '').replace(/원/g, '').replace(/,/g, '').trim()
  if (!/^[-]?\d+(?:\.\d+)?$/.test(value)) return null
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : null
}

function fromRows(rows: unknown[][]): CardRow[] {
  const result: CardRow[] = []
  for (const row of rows) {
    let date: string | null = null
    let amount: number | null = null
    let merchant = ''
    for (const cell of row) {
      if (!date) date = normalizeDate(cell)
      if (amount === null) amount = amountFrom(cell)
      if (typeof cell === 'string' && !normalizeDate(cell) && !amountFrom(cell)) {
        const text = cell.trim()
        if (text && !/승인|거래|금액|가맹점|날짜|일자|합계|원$/u.test(text)) merchant ||= text
      }
    }
    if (date && amount !== null) result.push({ date, merchant: merchant || '직접 입력', amount })
  }
  return result
}

export async function parseExcelFile(file: File): Promise<CardRow[]> {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true })
  const rows: unknown[][] = []
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    rows.push(...(XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][]))
  }
  return fromRows(rows)
}

export async function parsePdfFile(file: File): Promise<CardRow[]> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const lines: unknown[][] = []
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    const yLines = new Map<number, string[]>()
    for (const item of content.items) {
      if (!('str' in item)) continue
      const y = Math.round(item.transform[5])
      const values = yLines.get(y) ?? []
      values.push(item.str)
      yLines.set(y, values)
    }
    for (const values of yLines.values()) lines.push(values)
  }
  return fromRows(lines)
}

export async function parseImageFile(file: File): Promise<CardRow[]> {
  const { recognize } = await import('tesseract.js')
  const result = await recognize(file, 'kor+eng', { logger: () => undefined })
  const lines = result.data.text.split(/\r?\n/).map((line) => [line])
  const parsed = fromRows(lines)
  if (parsed.length) return parsed
  const merchantAmountDate = /(.+?)\s+(\d{1,3}(?:[,\d]*)원)\s+(\d{4}[.]\d{2}[.]\d{2})/g
  const fallback: CardRow[] = []
  let match: RegExpExecArray | null
  while ((match = merchantAmountDate.exec(result.data.text))) {
    const date = normalizeDate(match[3])
    const amount = amountFrom(match[2])
    if (date && amount !== null) fallback.push({ date, merchant: match[1].trim(), amount })
  }
  return fallback
}
