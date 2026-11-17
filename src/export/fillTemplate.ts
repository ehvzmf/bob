import JSZip from 'jszip'
import type { Entry } from '../lib'

export type ExportMeta = { month: string; submitterName: string; accountTitle: string }

export async function buildExportWorkbook(entries: Entry[], file: File, meta: ExportMeta, filename = 'corp-card-export.xlsx') {
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const sheet = zip.file('xl/worksheets/sheet1.xml')
  if (!sheet) throw new Error('템플릿 시트를 찾을 수 없어요.')

  let xml = await sheet.async('string')
  const [year, month] = meta.month.split('-').map(Number)
  const monthName = `${month}월 법인카드 사용내역서`
  const period = `기     간   :    ${year} / ${String(month).padStart(2, '0')} / 01  ~  ${year} / ${String(month).padStart(2, '0')} / ${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`

  xml = replaceInlineString(xml, 'B2', monthName, '25')
  xml = replaceInlineString(xml, 'B3', meta.submitterName, '28')
  xml = replaceInlineString(xml, 'E3', period, '30')

  const sorted = entries.slice().sort((a, b) => a.date.localeCompare(b.date)).slice(0, 30)
  for (let rowNo = 5; rowNo <= 34; rowNo++) {
    const entry = sorted[rowNo - 5]
    xml = replaceRowValue(xml, rowNo, 'B', entry ? String(rowNo - 4) : '')
    xml = replaceRowValue(xml, rowNo, 'C', entry ? toExcelDateNumber(entry.date).toString() : '')
    xml = replaceInlineRowValue(xml, rowNo, 'D', entry?.merchant || '직접 입력')
    xml = replaceRowValue(xml, rowNo, 'E', entry ? String(entry.amount) : '')
    xml = replaceInlineRowValue(xml, rowNo, 'F', entry?.item || '')
    xml = replaceInlineRowValue(xml, rowNo, 'G', entry ? meta.accountTitle : '')
    xml = replaceInlineRowValue(xml, rowNo, 'H', '')
    xml = replaceInlineRowValue(xml, rowNo, 'I', entry?.memo || '')
  }

  zip.file('xl/worksheets/sheet1.xml', xml)
  const workbook = zip.file('xl/workbook.xml')
  if (workbook) {
    let workbookXml = await workbook.async('string')
    workbookXml = workbookXml.replace(/<x:sheet name="[^"]*"/, `<x:sheet name="${meta.month.replace('-', '')}"`)
    workbookXml = workbookXml.replace(/<x:calcPr([^>]*)>/, '<x:calcPr$1 fullCalcOnLoad="1"/>')
    zip.file('xl/workbook.xml', workbookXml)
  }

  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function replaceInlineString(xml: string, ref: string, text: string, style: string) {
  const pattern = new RegExp(`<x:c r="${ref}"[^>]*>(.*?)</x:c>`, 's')
  return xml.replace(pattern, `<x:c r="${ref}" s="${style}" t="inlineStr"><is><t>${escapeXml(text)}</t></is></x:c>`)
}

function replaceRowValue(xml: string, row: number, col: string, value: string) {
  const ref = `${col}${row}`
  const pattern = new RegExp(`<x:c r="${ref}"[^>]*(?:/>|>.*?</x:c>)`, 's')
  const style = getStyle(xml, ref)
  const cell = value
    ? `<x:c r="${ref}" s="${style}"><x:v>${value}</x:v></x:c>`
    : `<x:c r="${ref}" s="${style}"/>`
  return xml.replace(pattern, cell)
}

function getCellStart(xml: string, ref: string) {
  const pattern = new RegExp(`<x:c r="${ref}"[^>]*`, 's')
  return xml.match(pattern)?.[0]
}

function replaceInlineRowValue(xml: string, row: number, col: string, text: string) {
  const ref = `${col}${row}`
  const pattern = new RegExp(`<x:c r="${ref}"[^>]*(?:/>|>.*?</x:c>)`, 's')
  const start = getCellStart(xml, ref)
  if (!start) return xml
  const cleanStart = start.replace(/ t="[^"]*"/g, '')
  const value = text ? `<x:c r="${ref}" s="${getStyle(xml, ref)}" t="inlineStr"><is><t>${escapeXml(text)}</t></is></x:c>` : `${cleanStart}/>`
  return xml.replace(pattern, value)
}

function getStyle(xml: string, ref: string) {
  const start = getCellStart(xml, ref)
  return start?.match(/s="(\d+)"/)?.[1] ?? '10'
}

function toExcelDateNumber(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  return (Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000
}

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}
