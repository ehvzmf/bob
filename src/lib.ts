import { HOLIDAYS } from './holidays'
import { COMPANY_HOLIDAYS } from './config/companyHolidays'

export interface Entry { id: string; date: string; amount: number; merchant: string; item: string; memo: string; src: 'manual' | 'card'; reflected: boolean }
export type LeaveKind = 'full' | 'am' | 'pm' | 'hours'
export interface Leave { date: string; kind: LeaveKind; hours: number; useCard: boolean }
export interface Settings { limit: number; skipHoliday: boolean; happyFriday: boolean; drinkMax: number; drinkWords: string[]; memos: Record<string, string>; extraHolidays: string[] }
export interface CardBase { month: string; used: number; at: string }
export interface State { entries: Entry[]; leaves: Leave[]; settings: Settings; card: CardBase | null; memory: Record<string, { item: string; memo: string }> }

export const defaultState = (): State => ({
  entries: [], leaves: [], card: null, memory: {},
  settings: { limit: 300000, skipHoliday: true, happyFriday: true, drinkMax: 7000, drinkWords: ['카페', '커피', 'coffee', 'cafe'], memos: { 식대: '식대', 음료: '음료' }, extraHolidays: [] },
})

export const p2 = (n: number) => String(n).padStart(2, '0')
export const toYmd = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
export const fromYmd = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
export const won = (n: number) => n.toLocaleString('ko-KR') + '원'
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
export const md = (s: string) => `${Number(s.slice(5, 7))}/${Number(s.slice(8, 10))}`
export const WEEK = ['일', '월', '화', '수', '목', '금', '토']

export function holidayName(s: string, st: Settings): string | null {
  return HOLIDAYS[s] ?? COMPANY_HOLIDAYS.find((h) => h.date === s)?.name ?? (st.extraHolidays.includes(s) ? '추가 휴일' : null)
}

export function offReason(s: string, st: Settings): string | null {
  const d = fromYmd(s), w = d.getDay()
  if (w === 0 || w === 6) return '주말'
  if (st.skipHoliday) { const h = holidayName(s, st); if (h) return h }
  if (st.happyFriday && w === 5 && d.getDate() >= 8 && d.getDate() <= 14) return '해피프라이데이'
  return null
}

export function countsAsDay(s: string, st: Settings, leaves: Leave[]): boolean {
  if (offReason(s, st)) return false
  const l = leaves.find((x) => x.date === s)
  return l ? l.useCard : true
}

export function remainingDays(today: string, st: Settings, leaves: Leave[]): number {
  const d = fromYmd(today)
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  let n = 0
  for (let i = d.getDate(); i <= last; i++) if (countsAsDay(`${today.slice(0, 8)}${p2(i)}`, st, leaves)) n++
  return n
}

export function classify(merchant: string, amount: number, st: Settings, memory: State['memory']) {
  const m = memory[merchant.trim()]
  if (m) return m
  const low = merchant.toLowerCase()
  const drink = st.drinkWords.some((w) => w && low.includes(w.toLowerCase())) || (amount > 0 && amount <= st.drinkMax)
  const item = drink ? '음료' : '식대'
  return { item, memo: st.memos[item] ?? item }
}

export interface CardRow { date: string; merchant: string; amount: number }

export function parseCardText(text: string) {
  const lines = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
  const exp = text.match(/승인건수\s*(\d+)\s*건/)
  const items: CardRow[] = []
  for (let i = 1; i < lines.length - 1; i++) {
    const a = lines[i].match(/^(-?[\d,]+)\s*원$/)
    const d = lines[i + 1].match(/^(\d{4})\.(\d{2})\.(\d{2})$/)
    if (a && d) {
      items.push({ date: `${d[1]}-${d[2]}-${d[3]}`, merchant: lines[i - 1], amount: Number(a[1].replace(/,/g, '')) })
      i++
    }
  }
  const warnings: string[] = []
  if (/취소/.test(text) || items.some((x) => x.amount < 0)) warnings.push('취소 내역이 포함된 것 같아요. 금액을 확인하세요.')
  return { expected: exp ? Number(exp[1]) : null, items, warnings }
}

export type Status = 'new' | 'merge' | 'dup' | 'maybe'
export interface PlanRow { row: CardRow; status: Status; target?: Entry; join: boolean }

export function planImport(rows: CardRow[], entries: Entry[]) {
  const used = new Set<string>()
  const plan: PlanRow[] = []
  const gap = (a: string, b: string) => Math.abs(fromYmd(a).getTime() - fromYmd(b).getTime()) / 864e5
  for (const r of rows) {
    const dup = entries.find((e) => e.src === 'card' && !used.has(e.id) && e.date === r.date && e.amount === r.amount && e.merchant === r.merchant)
    if (dup) { used.add(dup.id); plan.push({ row: r, status: 'dup', join: false }); continue }
    const mg = entries.find((e) => e.src === 'manual' && !used.has(e.id) && e.date === r.date && e.amount === r.amount)
    if (mg) { used.add(mg.id); plan.push({ row: r, status: 'merge', target: mg, join: true }); continue }
    const mb = entries.find((e) => e.src === 'manual' && !used.has(e.id) && (e.date === r.date || (e.amount === r.amount && gap(e.date, r.date) <= 2)))
    if (mb) { used.add(mb.id); plan.push({ row: r, status: 'maybe', target: mb, join: false }); continue }
    plan.push({ row: r, status: 'new', join: false })
  }
  const ds = rows.map((r) => r.date).sort()
  const missing = rows.length ? entries.filter((e) => e.src === 'manual' && !used.has(e.id) && e.date >= ds[0] && e.date <= ds[ds.length - 1]) : []
  return { plan, missing }
}

// 카드 사용금액을 입력한 날짜(card.at)보다 이전 날짜의 내역은 이미 카드 금액에 포함된 것으로 봅니다.
export function applyImport(st: State, plan: PlanRow[]): State {
  let entries = st.entries.slice()
  for (const p of plan) {
    const r = p.row
    if (p.status === 'dup') continue
    if ((p.status === 'merge' || (p.status === 'maybe' && p.join)) && p.target) {
      const id = p.target.id
      entries = entries.map((e) => (e.id === id ? { ...e, date: r.date, amount: r.amount, merchant: r.merchant, src: 'card' as const } : e))
      continue
    }
    const c = classify(r.merchant, r.amount, st.settings, st.memory)
    const reflected = !!st.card && st.card.month === r.date.slice(0, 7) && r.date < st.card.at
    entries.push({ id: uid(), date: r.date, amount: r.amount, merchant: r.merchant, item: c.item, memo: c.memo, src: 'card', reflected })
  }
  return { ...st, entries }
}
