export type BudgetTier = {
  id: string
  label: string
  min: number
  max: number | null
  messagePool: string[]
  menuPool: string[]
}

import type { Entry } from '../lib'

export const budgetTiers: BudgetTier[] = [
  {
    id: 'tight',
    label: '가볍게',
    min: 0,
    max: 4000,
    messagePool: [
      '편의점 갈까요?',
      '빵이나 먹죠.',
      '가볍게 컵라면이 정답이에요.',
    ],
    menuPool: ['컵라면', '김밥', '샌드위치', '빵', '편의점 도시락'],
  },
  {
    id: 'low',
    label: '저렴하게',
    min: 4000,
    max: 8000,
    messagePool: [
      '가성비 있게 한 끼 해결해볼까요?',
      '김밥이나 든든하게 먹는 날이네요.',
      '오늘은 무난한 한 끼로 가볍게 마무리해요.',
    ],
    menuPool: ['김밥', '컵밥', '샌드위치', '카레', '도시락'],
  },
  {
    id: 'mid',
    label: '무난하게',
    min: 8000,
    max: 15000,
    messagePool: [
      '오늘은 무난하게 든든한 한 끼가 좋겠어요.',
      '가성비 좋은 덮밥이나 한 번 먹어볼까요?',
      '오늘은 밥 한 공기와 반찬이 만족스러운 날이에요.',
    ],
    menuPool: ['제육볶음', '돈까스', '덮밥', '카레', '치킨마요'],
  },
  {
    id: 'high',
    label: '여유 있게',
    min: 15000,
    max: 25000,
    messagePool: [
      '오늘은 브런치로 한 번 달려볼까요?',
      '가볍고 만족스러운 한 끼를 선택해볼까요?',
      '오늘은 무난하지만 꽤 만족스러운 메뉴가 어울려요.',
    ],
    menuPool: ['브런치', '샐러드', '파스타', '돈까스', '쌈밥'],
  },
  {
    id: 'luxury',
    label: '충분히 즐기기',
    min: 25000,
    max: null,
    messagePool: [
      '오늘은 장어덮밥 어때요?',
      '오늘은 우아하게 브런치 어때요?',
      '오늘은 한 끼를 좀 더 만족스럽게 즐겨볼까요?',
    ],
    menuPool: ['장어덮밥', '브런치', '파스타', '스테이크', '정식'],
  },
]

export const fallbackMealSuggestion = {
  title: '오늘 뭐 먹을까요?',
  summary: '예산과 최근 식비 패턴을 기준으로 추천해요.',
}

export function resolveTier(amount: number): BudgetTier {
  return budgetTiers.find((tier) => amount >= tier.min && (tier.max === null || amount < tier.max)) ?? budgetTiers[budgetTiers.length - 1]
}

function recentPatterns(entries: Entry[]) {
  const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30)
  const cafeCount = recent.filter((e) => /카페|커피|coffee|cafe/i.test(e.merchant) || e.item === '음료').length
  const heartyCount = recent.filter((e) => /덮밥|돈까스|제육|김밥|카레|브런치|파스타|정식|쌈밥/i.test(e.merchant) || e.item === '식대').length
  const cafeNames = recent
    .filter((e) => /카페|커피|coffee|cafe/i.test(e.merchant))
    .map((e) => e.merchant.trim())
    .filter(Boolean)
  const topCafe = cafeNames.length ? [...new Set(cafeNames)].sort((a, b) => cafeNames.filter((x) => x === b).length - cafeNames.filter((x) => x === a).length)[0] : ''
  return { recent, cafeCount, heartyCount, topCafe }
}

export function pickMealSuggestion(amount: number, entries: Entry[] = [], seed = 0) {
  const tier = resolveTier(amount)
  const { cafeCount, heartyCount, topCafe } = recentPatterns(entries)
  const messagePool = [...tier.messagePool]
  const menuPool = [...tier.menuPool]

  if (cafeCount >= 3) {
    messagePool.unshift('최근 커피·카페가 많아서, 오늘은 든든한 한 끼가 좋겠어요.')
    menuPool.unshift('제육볶음', '김치찌개', '덮밥')
  }
  if (heartyCount >= 4) {
    messagePool.unshift('최근 푸짐한 식사 위주라서, 오늘은 가볍게 정리해볼까요?')
    menuPool.unshift('샐러드', '브런치', '김밥')
  }
  if (amount >= 25000 && tier.id !== 'luxury') {
    messagePool.unshift('오늘은 한 끼를 제대로 즐길 수 있는 날이에요.')
  }
  if (topCafe && tier.id !== 'tight') {
    messagePool.unshift(`최근 자주 가신 ${topCafe}에서의 여운이 남아있네요. 가볍게 한 끼 어때요?`)
    menuPool.unshift('샌드위치', '커피', '도시락')
  }
  if (heartyCount >= 2) {
    messagePool.unshift('밥을 든든하게 먹었어요. 커피 한 잔이 생각나는 날이에요.')
  }
  if (topCafe) {
    messagePool.push(`요즘 자주 가는 곳은 ${topCafe}예요. 오늘도 부담 없이 들러볼까요?`)
  }

  const index = Math.abs((seed + Math.round(amount)) % messagePool.length)
  const menuIndex = Math.abs((seed + Math.round(amount * 3)) % menuPool.length)

  return {
    title: fallbackMealSuggestion.title,
    summary: fallbackMealSuggestion.summary,
    tier: tier.label,
    message: messagePool[index],
    menu: menuPool[menuIndex],
    topCafe,
  }
}
