import JSZip from 'jszip'
import type { Entry } from '../lib'

export async function buildExportWorkbook(entries: Entry[], file: File, filename = 'corp-card-export.xlsx') {
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const sheet = zip.file('xl/worksheets/sheet1.xml')
  if (!sheet) throw new Error('템플릿 시트를 찾을 수 없어요.')

  const xml = await sheet.async('string')
  const start = xml.indexOf('<x:row r="5"')
  const end = xml.indexOf('<x:row r="35"')
  if (start < 0 || end < 0) throw new Error('템플릿 구조를 찾지 못했어요. 다른 양식 파일을 선택해 주세요.')

  const rows = entries.slice(0, 30).map((entry, idx) => {
    const rowNo = idx + 5
    const seq = idx + 1
    const dateValue = toExcelDateNumber(entry.date)
    const merchant = escapeXml(entry.merchant || '직접 입력')
    const item = escapeXml(entry.item || '식대')
    const memo = escapeXml(entry.memo || '')
    return [
      `<x:row r="${rowNo}">`,
      `<x:c r="B${rowNo}" s="6"><x:v>${seq}</x:v></x:c>`,
      `<x:c r="C${rowNo}" s="7"><x:v>${dateValue}</x:v></x:c>`,
      `<x:c r="D${rowNo}" s="8" t="inlineStr"><is><t>${merchant}</t></is></x:c>`,
      `<x:c r="E${rowNo}" s="9"><x:v>${entry.amount}</x:v></x:c>`,
      `<x:c r="F${rowNo}" s="10" t="inlineStr"><is><t>${item}</t></is></x:c>`,
      `<x:c r="G${rowNo}" s="10" t="inlineStr"><is><t>${item}</t></is></x:c>`,
      `<x:c r="H${rowNo}" s="11" t="inlineStr"><is><t>${memo}</t></is></x:c>`,
      `</x:row>`,
    ].join('')
  }).join('')

  const updated = xml.slice(0, start) + rows + xml.slice(end)
  zip.file('xl/worksheets/sheet1.xml', updated)

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

function toExcelDateNumber(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  return (Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
