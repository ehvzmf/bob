const apiKey = process.env.HOLIDAY_API_KEY
const year = Number(process.argv[2] ?? new Date().getFullYear())

if (!apiKey) {
  console.error('HOLIDAY_API_KEY 환경변수가 필요해요.')
  process.exit(1)
}

const endpoint = 'http://apis.data.go.kr/B090041/openapi/service/RestDeInfoService/getRestDeInfo'
const params = new URLSearchParams({ ServiceKey: apiKey, solYear: String(year), numOfRows: '100' })
const response = await fetch(`${endpoint}?${params}`)
const xml = await response.text()
const entries = [...xml.matchAll(/<item>(.*?)<\/item>/gs)].map((match) => {
  const locdate = match[1].match(/<locdate>(.*?)<\/locdate>/)?.[1]
  const dateName = match[1].match(/<dateName>(.*?)<\/dateName>/)?.[1]
  return locdate && dateName ? [locdate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'), dateName] : null
}).filter(Boolean)

if (!entries.length) {
  console.error(`${year}년 공휴일을 가져오지 못했어요. 인증키와 엔드포인트를 확인하세요.`)
  process.exit(1)
}

console.log(`export const HOLIDAYS: Record<string, string> = ${JSON.stringify(Object.fromEntries(entries), null, 2)}\n`)
console.log('위 내용을 src/holidays.ts에 병합하거나 생성 출력으로 덮어써요.')
