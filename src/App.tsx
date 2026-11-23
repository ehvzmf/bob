import { buildExportWorkbook } from './export/fillTemplate'
import { useEffect, useRef, useState } from 'react'
import { load, save } from './storage'
import { GUIDES } from './config/guides'
import { pickMealSuggestion } from './config/recommendations'
import { applyImport, classify, fromYmd, holidayName, md, offReason, p2, parseCardText, planImport, remainingDays, toYmd, uid, won, WEEK } from './lib'
import type { CardRow, Entry, Leave, LeaveKind, PlanRow, State } from './lib'
import type { User } from 'firebase/auth'
import { firebaseReady, isAllowedCompanyEmail, loadRemoteState, loginWithGoogle, logoutGoogle, observeAuth, saveRemoteState } from './firebase'
import { parseExcelFile, parsePdfFile, parseImageFile } from './importFiles'

type Tab = 'home' | 'ledger' | 'import' | 'settings'
type Sheet = { k: 'entry'; id?: string } | { k: 'leave'; date: string } | { k: 'card' } | null
type Set = (f: (s: State) => State) => void

const byDate = (a: Entry, b: Entry) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)
const sum = (es: Entry[]) => es.reduce((a, e) => a + e.amount, 0)

export default function App() {
  const [st, setSt] = useState<State>(load)
  const [tab, setTab] = useState<Tab>('home')
  const [sheet, setSheet] = useState<Sheet>(null)
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [remoteReady, setRemoteReady] = useState(false)

  useEffect(() => save(st), [st])
  useEffect(() => observeAuth(async (nextUser) => {
    if (nextUser && !isAllowedCompanyEmail(nextUser.email)) {
      await logoutGoogle()
      setUser(null)
      setRemoteReady(false)
      setAuthReady(true)
      alert('회사 계정 이메일로만 로그인할 수 있어요.')
      return
    }
    setUser(nextUser)
    setAuthReady(true)
    if (nextUser) {
      setRemoteReady(false)
      try {
        const remote = await loadRemoteState(nextUser.uid)
        if (remote) setSt(remote)
      } finally {
        setRemoteReady(true)
      }
    } else {
      setRemoteReady(false)
    }
  }), [])
  useEffect(() => {
    if (!user || !remoteReady) return
    saveRemoteState(user.uid, st).catch(() => undefined)
  }, [st, user, remoteReady])

  const today = toYmd(new Date())
  const tabs: [Tab, string][] = [['home', '홈'], ['ledger', '내역'], ['import', '가져오기'], ['settings', '설정']]
  return (
    <div className="app">
      <main>
        {tab === 'home' && <Home st={st} today={today} open={setSheet} />}
        {tab === 'ledger' && <Ledger st={st} today={today} open={setSheet} />}
        {tab === 'import' && <Import st={st} set={setSt} />}
        {tab === 'settings' && <Settings st={st} set={setSt} open={setSheet} user={user} authReady={authReady} />}
      </main>
      <nav>{tabs.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</nav>
      {sheet && (
        <div className="veil" onClick={() => setSheet(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            {sheet.k === 'entry' && <EntrySheet st={st} set={setSt} id={sheet.id} today={today} close={() => setSheet(null)} />}
            {sheet.k === 'leave' && <LeaveSheet st={st} set={setSt} date={sheet.date} close={() => setSheet(null)} />}
            {sheet.k === 'card' && <CardSheet st={st} set={setSt} today={today} close={() => setSheet(null)} />}
          </div>
        </div>
      )}
    </div>
  )
}

function Home({ st, today, open }: { st: State; today: string; open: (s: Sheet) => void }) {
  const month = today.slice(0, 7)
  const cardUsed = st.card?.month === month ? st.card.used : 0
  const appSum = sum(st.entries.filter((e) => e.date.startsWith(month) && !e.reflected))
  const used = cardUsed + appSum
  const left = st.settings.limit - used
  const days = remainingDays(today, st.settings, st.leaves)
  const per = days > 0 ? Math.floor(left / days) : left
  const pct = Math.min(100, Math.max(0, (used / st.settings.limit) * 100))
  const recent = st.entries.filter((e) => e.date.startsWith(month)).sort(byDate).slice(0, 4)
  const off = offReason(today, st.settings)
  const leaveAhead = st.leaves.filter((l) => l.date >= today && l.date.startsWith(month) && !l.useCard).length
  const [seed, setSeed] = useState(0)
  const mealSuggestion = pickMealSuggestion(Math.max(per, 0), st.entries, seed)
  return (
    <>
      <h1 className="month">{Number(month.slice(5))}월 {off ? `· 오늘은 ${off}` : ''}</h1>
      <section className="hero">
        <p className="cap">오늘 쓸 수 있는 금액</p>
        <p className="big">{won(Math.max(per, 0))}</p>
        <p className="sub">{left < 0 ? `한도를 ${won(-left)} 넘었어요` : `잔액 ${won(left)} ÷ 남은 영업일 ${days}일`}</p>
        <div className="bar"><i style={{ width: pct + '%' }} /></div>
        <p className="sub">한도 {won(st.settings.limit)} 중 {won(used)} 사용{leaveAhead ? ` · 쉬는 날 ${leaveAhead}일 제외` : ''}</p>
      </section>
      <div className="row split">
        <span className="sub">카드 앱 {won(cardUsed)} + 앱 입력 {won(appSum)}</span>
        <button className="ghost" onClick={() => open({ k: 'card' })}>카드 금액 맞추기</button>
      </div>
      <button className="main" onClick={() => open({ k: 'entry' })}>+ 내역 입력</button>
      <h2>오늘의 식사 제안</h2>
      <section className="suggestion-card">
        <div className="row split"><p className="cap">{mealSuggestion.tier}한 예산</p><button className="icon-btn" aria-label="다른 추천" onClick={() => setSeed((n) => n + 1)}>↻</button></div>
        <p className="suggestion-msg">{mealSuggestion.message}</p>
        <p className="sub">추천 메뉴: {mealSuggestion.menu}</p>
      </section>
      <h2>최근 내역</h2>
      {recent.length === 0 && <p className="empty">아직 내역이 없어요. 첫 내역을 입력해보세요.</p>}
      {recent.map((e) => <EntryRow key={e.id} e={e} onClick={() => open({ k: 'entry', id: e.id })} />)}
    </>
  )
}

function EntryRow({ e, onClick }: { e: Entry; onClick: () => void }) {
  return (
    <button className="item" onClick={onClick}>
      <span><b>{e.merchant || '직접 입력'}</b><small>{md(e.date)} · {e.src === 'card' ? '카드 확인' : '내 입력'}{e.reflected ? ' · 카드 금액에 포함' : ''}</small></span>
      <span className="r"><em className={e.item === '음료' ? 'tag b' : 'tag'}>{e.item}</em><b>{won(e.amount)}</b></span>
    </button>
  )
}

function Ledger({ st, today, open }: { st: State; today: string; open: (s: Sheet) => void }) {
  const [month, setMonth] = useState(today.slice(0, 7))
  const [templateFile, setTemplateFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const shift = (n: number) => { const d = fromYmd(month + '-01'); d.setMonth(d.getMonth() + n); setMonth(toYmd(d).slice(0, 7)) }
  const list = st.entries.filter((e) => e.date.startsWith(month)).sort(byDate)
  const exportTemplate = async () => {
    if (!templateFile) {
      alert('회사 양식 파일을 선택해 주세요. 비공개 파일이어야 합니다.')
      return
    }
    if (!st.settings.submitterName.trim()) {
      alert('설정에서 제출자 이름을 먼저 입력해 주세요.')
      return
    }
    try {
      await buildExportWorkbook(list, templateFile, { month, submitterName: st.settings.submitterName, accountTitle: st.settings.accountTitle }, `corp-card-${month}.xlsx`)
    } catch (e) {
      alert(e instanceof Error ? e.message : '내보내기 중 문제가 발생했어요.')
    }
  }
  return (
    <>
      <div className="row split"><button className="ghost" onClick={() => shift(-1)}>이전</button><h1 className="month">{month.replace('-', '년 ')}월</h1><button className="ghost" onClick={() => shift(1)}>다음</button></div>
      <p className="sub">{list.length}건 · 내역 합계 {won(sum(list))}</p>
      {list.length === 0 && <p className="empty">이 달에는 내역이 없어요.</p>}
      {list.map((e) => <EntryRow key={e.id} e={e} onClick={() => open({ k: 'entry', id: e.id })} />)}
      <div className="row split" style={{ marginTop: 12 }}>
        <input ref={fileRef} type="file" accept=".xlsx" style={{ display: 'none' }} onChange={(e) => setTemplateFile(e.target.files?.[0] ?? null)} />
        <button className="main soft" onClick={() => fileRef.current?.click()}>회사 양식 선택</button>
        <button className="main" onClick={exportTemplate} disabled={!templateFile}>내보내기</button>
      </div>
    </>
  )
}

function Guide({ files }: { files: string[] }) {
  const [bad, setBad] = useState<Record<string, boolean>>({})
  return (
    <div>
      {files.map((f) => bad[f]
        ? <div key={f} className="ph">여기에 <code>{f}</code>를 넣어주세요<br />public/guides/{f}</div>
        : <img key={f} className="guide" src={`${import.meta.env.BASE_URL}guides/${f}`} alt="입력 방법 안내" onError={() => setBad((b) => ({ ...b, [f]: true }))} />)}
    </div>
  )
}

const LABEL = { new: '새 내역', merge: '내 입력과 합침', dup: '이미 있어요', maybe: '확인 필요' }

function Import({ st, set }: { st: State; set: Set }) {
  const [step, setStep] = useState<'choose' | 'paste' | 'preview'>('choose')
  const [text, setText] = useState('')
  const [plan, setPlan] = useState<PlanRow[]>([])
  const [missing, setMissing] = useState<Entry[]>([])
  const [info, setInfo] = useState<string[]>([])
  const [undo, setUndo] = useState<Entry[] | null>(null)
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [fileKind, setFileKind] = useState<'excel' | 'pdf' | 'image'>('excel')

  const openFile = (kind: 'excel' | 'pdf' | 'image') => {
    setFileKind(kind)
    setMsg('')
    window.setTimeout(() => fileRef.current?.click(), 0)
  }

  const previewRows = (rows: CardRow[], label: string) => {
    if (!rows.length) {
      setInfo([`${label}에서 인식된 내역이 없어요. 캡처는 더 선명하게, 엑셀/PDF는 목록을 포함한 파일로 선택해 주세요.`])
      setStep('preview')
      return
    }
    const p = planImport(rows, st.entries)
    setPlan(p.plan)
    setMissing(p.missing)
    setInfo([`${label}에서 ${rows.length}건을 인식했어요. 반영 전에 내역을 확인해 주세요.`])
    setStep('preview')
  }

  const processFile = async (file: File | undefined) => {
    if (!file) return
    try {
      setMsg('파일을 인식하고 있어요…')
      const rows = fileKind === 'excel'
        ? await parseExcelFile(file)
        : fileKind === 'pdf'
          ? await parsePdfFile(file)
          : await parseImageFile(file)
      previewRows(rows, fileKind === 'excel' ? '엑셀' : fileKind === 'pdf' ? 'PDF' : '이미지')
      setMsg('')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '파일을 인식하지 못했어요.')
    }
  }

  const recognize = () => {
    const r = parseCardText(text)
    if (!r.items.length) { setInfo(['인식된 내역이 없어요. 가맹점, 금액, 날짜가 세 줄씩 반복되는 텍스트인지 확인하세요.']); return }
    const p = planImport(r.items, st.entries)
    const notes = [...r.warnings]
    if (r.expected !== null) notes.push(r.expected === r.items.length ? `승인건수 ${r.expected}건과 일치해요.` : `승인건수 ${r.expected}건 중 ${r.items.length}건만 인식했어요. 빠진 내역을 확인하세요.`)
    setPlan(p.plan); setMissing(p.missing); setInfo(notes); setStep('preview')
  }
  const commit = () => {
    const prev = st.entries
    const n = plan.filter((p) => p.status !== 'dup').length
    set((s) => applyImport(s, plan))
    setUndo(prev); setText(''); setStep('choose'); setMsg(`${n}건을 반영했어요.`)
  }
  const join = (i: number, v: boolean) => setPlan((ps) => ps.map((p, j) => (j === i ? { ...p, join: v } : p)))

  if (step === 'paste') return (
    <>
      <button className="ghost" onClick={() => setStep('choose')}>뒤로</button>
      <h1 className="month">텍스트 붙여넣기</h1>
      <ol className="steps"><li>하나카드 기업 앱에서 사용 내역 화면을 열어요</li><li>내역 목록을 첫 줄부터 끝까지 드래그해서 복사해요</li><li>아래 칸에 붙여넣고 인식하기를 눌러요</li></ol>
      <Guide files={GUIDES.paste} />
      <p className="sub">“승인건수 N건” 줄까지 같이 복사하면 빠진 내역이 없는지 확인해줘요.</p>
      <textarea rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder="여기에 붙여넣기" />
      {info.map((t) => <p key={t} className="warn">{t}</p>)}
      <button className="main" onClick={recognize}>인식하기</button>
    </>
  )
  if (step === 'preview') return (
    <>
      <button className="ghost" onClick={() => setStep('choose')}>뒤로</button>
      <h1 className="month">가져오기 미리보기</h1>
      {info.map((t) => <p key={t} className="sub">{t}</p>)}
      {plan.map((p, i) => (
        <div key={i} className="item static">
          <span><b>{p.row.merchant}</b><small>{md(p.row.date)} · {LABEL[p.status]}</small>
            {p.status === 'maybe' && p.target && <label className="chk"><input type="checkbox" checked={p.join} onChange={(e) => join(i, e.target.checked)} /> 내 입력({md(p.target.date)} {won(p.target.amount)})과 같은 건</label>}
          </span><b>{won(p.row.amount)}</b>
        </div>
      ))}
      {missing.length > 0 && <p className="sub">카드에 없는 내 입력 {missing.length}건은 승인 전일 수 있어 그대로 둬요.</p>}
      <button className="main" onClick={commit}>반영하기</button>
    </>
  )
  const soon = (name: string) => () => setMsg(`${name} 가져오기는 샘플 파일을 확인한 뒤 추가돼요.`)
  return (
    <>
      <h1 className="month">어떻게 가져올까요</h1>
      <input
        ref={fileRef}
        type="file"
        accept={fileKind === 'excel' ? '.xlsx,.xls' : fileKind === 'pdf' ? '.pdf' : 'image/*'}
        style={{ display: 'none' }}
        onChange={(e) => processFile(e.target.files?.[0])}
      />
      <button className="opt on" onClick={() => { setMsg(''); setInfo([]); setStep('paste') }}><b>텍스트 붙여넣기</b><small>카드 앱 화면을 드래그해서 복사 · 가장 정확해요</small></button>
      <button className="opt on" onClick={() => openFile('image')}><b>이미지</b><small>캡처한 사진에서 글자를 인식해요</small></button>
      <button className="opt on" onClick={() => openFile('pdf')}><b>PDF</b><small>텍스트가 포함된 카드 내역 파일을 읽어요</small></button>
      <button className="opt on" onClick={() => openFile('excel')}><b>엑셀</b><small>카드사 내보내기 파일을 날짜·가맹점·금액으로 읽어요</small></button>
      {msg && <p className="sub">{msg}</p>}
      {undo && <button className="main soft" onClick={() => { set((s) => ({ ...s, entries: undo })); setUndo(null); setMsg('되돌렸어요.') }}>방금 가져온 내역 되돌리기</button>}
    </>
  )
}

function Settings({ st, set, open, user, authReady }: { st: State; set: Set; open: (s: Sheet) => void; user: User | null; authReady: boolean }) {
  const s = st.settings
  const patch = (p: Partial<State['settings']>) => set((x) => ({ ...x, settings: { ...x.settings, ...p } }))
  const [hd, setHd] = useState('')
  return (
    <>
      <h1 className="month">설정</h1>
      <h2>로그인과 동기화</h2>
      {!firebaseReady && <p className="sub">Firebase 환경변수를 넣으면 구글 로그인과 기기 간 동기화를 사용할 수 있어요.</p>}
      {firebaseReady && authReady && (user
        ? <><p className="sub">로그인됨: {user.email}</p><button className="main soft" onClick={() => logoutGoogle().catch(() => alert('로그아웃에 실패했어요.'))}>로그아웃</button></>
        : <button className="main" onClick={() => loginWithGoogle().catch((e) => alert(e instanceof Error ? e.message : '로그인에 실패했어요.'))}>구글로 로그인</button>)}
      <h2>내보내기 정보</h2>
      <label className="fld">제출자 이름<input type="text" defaultValue={s.submitterName} onBlur={(e) => patch({ submitterName: e.target.value.trim() })} /></label>
      <label className="fld">계정과목<input type="text" defaultValue={s.accountTitle} onBlur={(e) => patch({ accountTitle: e.target.value.trim() || '복리후생비' })} /></label>
      <h2>한도와 영업일</h2>
      <label className="fld">월 한도(원)<input type="number" inputMode="numeric" defaultValue={s.limit} onBlur={(e) => patch({ limit: Number(e.target.value) || s.limit })} /></label>
      <label className="chk"><input type="checkbox" checked={s.skipHoliday} onChange={(e) => patch({ skipHoliday: e.target.checked })} /> 공휴일과 회사 휴일 제외</label>
      <label className="chk"><input type="checkbox" checked={s.happyFriday} onChange={(e) => patch({ happyFriday: e.target.checked })} /> 해피프라이데이 제외 (매월 둘째 금요일)</label>
      <h2>쉬는 날</h2>
      <p className="sub">날짜를 눌러 연차, 반차, 시간차를 등록해요.</p>
      <Calendar st={st} open={(d) => open({ k: 'leave', date: d })} />
      <h2>추가 휴일</h2>
      <p className="sub">임시공휴일처럼 목록에 없는 휴일을 직접 추가해요.</p>
      <div className="row"><input type="date" value={hd} onChange={(e) => setHd(e.target.value)} /><button className="ghost" onClick={() => { if (hd && !s.extraHolidays.includes(hd)) { patch({ extraHolidays: [...s.extraHolidays, hd].sort() }); setHd('') } }}>추가</button></div>
      {s.extraHolidays.map((d) => <div key={d} className="row split"><span>{d}</span><button className="ghost" onClick={() => patch({ extraHolidays: s.extraHolidays.filter((x) => x !== d) })}>삭제</button></div>)}
      <h2>자동 분류</h2>
      <label className="fld">이 금액 이하는 음료(원)<input type="number" inputMode="numeric" defaultValue={s.drinkMax} onBlur={(e) => patch({ drinkMax: Number(e.target.value) || 0 })} /></label>
      <label className="fld">음료로 볼 가맹점 키워드 (쉼표로 구분)<input type="text" defaultValue={s.drinkWords.join(', ')} onBlur={(e) => patch({ drinkWords: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} /></label>
      <label className="fld">식대 기본 적요<input type="text" defaultValue={s.memos['식대']} onBlur={(e) => patch({ memos: { ...s.memos, 식대: e.target.value } })} /></label>
      <label className="fld">음료 기본 적요<input type="text" defaultValue={s.memos['음료']} onBlur={(e) => patch({ memos: { ...s.memos, 음료: e.target.value } })} /></label>
      <h2>기타</h2>
      <label className="fld">제출자 이름<input type="text" defaultValue={s.submitterName} onBlur={(e) => patch({ submitterName: e.target.value })} /></label>
      <label className="fld">계정과목<input type="text" defaultValue={s.accountTitle} onBlur={(e) => patch({ accountTitle: e.target.value })} /></label>
      <h2>계정</h2>
      {user ? (
        <>
          <p className="sub">{user.email}으로 로그인 중</p>
          <button className="main" onClick={() => logoutGoogle()}>로그아웃</button>
        </>
      ) : (
        authReady && <button className="main" onClick={() => loginWithGoogle()}>구글 계정으로 로그인</button>
      )}
    </>
  )
}

function Calendar({ st, open }: { st: State; open: (d: string) => void }) {
  const [off, setOff] = useState(0)
  const b = new Date()
  const first = new Date(b.getFullYear(), b.getMonth() + off, 1)
  const y = first.getFullYear(), m = first.getMonth()
  const cells: (string | null)[] = Array(first.getDay()).fill(null)
  for (let i = 1; i <= new Date(y, m + 1, 0).getDate(); i++) cells.push(`${y}-${p2(m + 1)}-${p2(i)}`)
  return (
    <div className="cal">
      <div className="row split"><button className="ghost" onClick={() => setOff(off - 1)}>이전</button><b>{y}년 {m + 1}월</b><button className="ghost" onClick={() => setOff(off + 1)}>다음</button></div>
      <div className="grid">
        {WEEK.map((w) => <span key={w} className="wk">{w}</span>)}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />
          const reason = offReason(d, st.settings)
          const weekend = reason === '주말'
          const lv = st.leaves.find((l) => l.date === d)
          return <button key={d} disabled={weekend} title={reason ?? ''} className={'day' + (reason ? ' off' : '') + (lv ? ' lv' : '')} onClick={() => open(d)}>{Number(d.slice(8))}{lv && <i />}</button>
        })}
      </div>
      <p className="sub">회색은 영업일에서 빠지는 날이에요. 점이 있으면 쉬는 날로 등록된 날이에요.</p>
    </div>
  )
}

function EntrySheet({ st, set, id, today, close }: { st: State; set: Set; id?: string; today: string; close: () => void }) {
  const cur = id ? st.entries.find((e) => e.id === id) : undefined
  const [amount, setAmount] = useState(cur ? String(cur.amount) : '')
  const [merchant, setMerchant] = useState(cur?.merchant ?? '')
  const [date, setDate] = useState(cur?.date ?? today)
  const [item, setItem] = useState(cur?.item ?? '식대')
  const [memo, setMemo] = useState(cur?.memo ?? st.settings.memos['식대'] ?? '')
  const [touched, setTouched] = useState(!!cur)
  const auto = (a: string, m: string) => {
    if (touched) return
    const c = classify(m, Number(a.replace(/,/g, '')) || 0, st.settings, st.memory)
    setItem(c.item); setMemo(c.memo)
  }
  const pick = (v: string) => { setTouched(true); setItem(v); setMemo(st.settings.memos[v] ?? v) }
  const amt = Number(amount.replace(/,/g, ''))
  const ok = amt > 0 && !!date
  const doSave = () => {
    if (!ok) return
    set((s) => {
      const memory = merchant.trim() && touched ? { ...s.memory, [merchant.trim()]: { item, memo } } : s.memory
      if (cur) return { ...s, memory, entries: s.entries.map((e) => (e.id === cur.id ? { ...e, amount: amt, merchant, date, item, memo } : e)) }
      const reflected = !!s.card && s.card.month === date.slice(0, 7) && date < s.card.at
      return { ...s, memory, entries: [...s.entries, { id: uid(), date, amount: amt, merchant, item, memo, src: 'manual', reflected }] }
    })
    close()
  }
  return (
    <>
      <div className="row split"><h2>{cur ? '내역 수정' : '내역 입력'}</h2><button className="ghost" onClick={close}>닫기</button></div>
      <label className="fld">금액<input type="number" inputMode="numeric" autoFocus value={amount} onChange={(e) => { setAmount(e.target.value); auto(e.target.value, merchant) }} /></label>
      <label className="fld">가맹점 (선택)<input type="text" value={merchant} onChange={(e) => { setMerchant(e.target.value); auto(amount, e.target.value) }} /></label>
      <label className="fld">날짜<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
      <div className="fld">항목<div className="seg">{['식대', '음료'].map((v) => <button key={v} className={item === v ? 'on' : ''} onClick={() => pick(v)}>{v}</button>)}</div></div>
      <label className="fld">적요<input type="text" value={memo} onChange={(e) => { setMemo(e.target.value); setTouched(true) }} /></label>
      <button className="main" onClick={doSave}>저장</button>
      {cur && <button className="ghost danger" onClick={() => { set((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== cur.id) })); close() }}>삭제</button>}
    </>
  )
}

function LeaveSheet({ st, set, date, close }: { st: State; set: Set; date: string; close: () => void }) {
  const cur = st.leaves.find((l) => l.date === date)
  const [kind, setKind] = useState<LeaveKind>(cur?.kind ?? 'full')
  const [hours, setHours] = useState(cur?.hours ?? 2)
  const [useCard, setUseCard] = useState(cur?.useCard ?? false)
  const kinds: [LeaveKind, string][] = [['full', '종일 연차'], ['am', '오전 반차'], ['pm', '오후 반차'], ['hours', '시간차']]
  const d = fromYmd(date)
  return (
    <>
      <div className="row split"><h2>{md(date)} ({WEEK[d.getDay()]}) {holidayName(date, st.settings) ?? ''}</h2><button className="ghost" onClick={close}>닫기</button></div>
      <div className="fld">종류<div className="seg two">{kinds.map(([k, l]) => <button key={k} className={kind === k ? 'on' : ''} onClick={() => { setKind(k); setUseCard(k !== 'full') }}>{l}</button>)}</div></div>
      {kind === 'hours' && <div className="row split"><span>시간 수</span><span className="step"><button onClick={() => setHours(Math.max(1, hours - 1))}>-</button><b>{hours}</b><button onClick={() => setHours(Math.min(8, hours + 1))}>+</button></span></div>}
      <label className="chk"><input type="checkbox" checked={useCard} onChange={(e) => setUseCard(e.target.checked)} /> 이 날 법카 사용</label>
      <p className="sub">종일 연차는 기본으로 꺼짐, 반차와 시간차는 켜짐. 켜면 영업일 1일로 계산해요.</p>
      <button className="main" onClick={() => { set((s) => ({ ...s, leaves: [...s.leaves.filter((l) => l.date !== date), { date, kind, hours, useCard }] })); close() }}>저장</button>
      {cur && <button className="ghost danger" onClick={() => { set((s) => ({ ...s, leaves: s.leaves.filter((l) => l.date !== date) })); close() }}>쉬는 날 삭제</button>}
    </>
  )
}

function CardSheet({ st, set, today, close }: { st: State; set: Set; today: string; close: () => void }) {
  const month = today.slice(0, 7)
  const [v, setV] = useState(st.card?.month === month ? String(st.card.used) : '')
  const n = Number(v.replace(/,/g, ''))
  return (
    <>
      <div className="row split"><h2>카드 금액 맞추기</h2><button className="ghost" onClick={close}>닫기</button></div>
      <p className="sub">카드 앱에 보이는 이번 달 사용금액을 입력하세요. 오늘 이전에 입력한 내역은 이미 포함된 것으로 보고 다시 빼지 않아요.</p>
      <label className="fld">카드 앱 사용금액<input type="number" inputMode="numeric" autoFocus value={v} onChange={(e) => setV(e.target.value)} /></label>
      <button className="main" onClick={() => {
        if (!(n >= 0) || v === '') return
        set((s) => ({ ...s, card: { month, used: n, at: today }, entries: s.entries.map((e) => (e.date.startsWith(month) && e.date < today ? { ...e, reflected: true } : e)) }))
        close()
      }}>맞추기</button>
    </>
  )
}
