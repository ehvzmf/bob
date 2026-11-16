// 저장 계층. 나중에 Firestore로 바꿀 때 이 파일만 교체하면 됩니다.
import { defaultState } from './lib'
import type { State } from './lib'

const KEY = 'corp-card-calc:v1'

export function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw)
      const d = defaultState()
      return { ...d, ...s, settings: { ...d.settings, ...s.settings } }
    }
  } catch {
    /* 저장된 값이 없거나 깨졌으면 기본값 사용 */
  }
  return defaultState()
}

export function save(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* 저장 실패는 무시 */
  }
}
