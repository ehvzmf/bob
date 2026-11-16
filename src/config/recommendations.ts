export type BudgetTier = {
  id: string
  label: string
  min: number
  max: number | null
  messagePool: string[]
  menuPool: string[]
}

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

export function pickMealSuggestion(amount: number) {
  const tier = resolveTier(amount)
  const message = tier.messagePool[Math.floor(Math.random() * tier.messagePool.length)]
  const menu = tier.menuPool[Math.floor(Math.random() * tier.menuPool.length)]
  return {
    title: fallbackMealSuggestion.title,
    summary: fallbackMealSuggestion.summary,
    tier: tier.label,
    message,
    menu,
  }
}
