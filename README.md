# 법카 계산기 (1단계)

월 한도에서 영업일 기준으로 하루 사용 가능 금액을 계산하고, 카드 내역을 붙여넣어 가져오는 앱입니다.

## 실행
1. Node.js 20 이상 (24 가능)
2. `npm install`
3. `npm run dev` → 터미널에 나오는 주소로 접속 (같은 Wi-Fi의 폰은 `Network` 주소로 접속)

## 직접 채워 넣을 것
- 안내 이미지: `public/guides/paste-guide.png`, `public/guides/image-guide.png` (파일명 목록은 `src/config/guides.ts`)
- 회사 휴일(창립기념일 등): `src/config/companyHolidays.ts`
- 공휴일 데이터(2026~2027): `src/holidays.ts` (임시공휴일은 설정 화면에서 추가 가능)

## 구조
- `src/lib.ts` 영업일 계산, 자동 분류, 카드 텍스트 파서, 가져오기 합치기 규칙
- `src/storage.ts` 저장 계층 (지금은 브라우저 저장소, 나중에 Firestore로 교체)
- `src/App.tsx` 화면 (홈, 내역, 가져오기, 설정, 입력 시트)

## 아직 없는 것
- 양식 엑셀 내보내기 (양식 파일을 받은 뒤)
- Firebase 로그인과 Firestore 저장
- 이미지(OCR), PDF, 엑셀 가져오기 (메뉴는 준비 중으로 표시)
- 공공데이터포털 공휴일 갱신 스크립트
- 데이터는 이 브라우저에만 저장됩니다. 다른 기기와 공유되지 않아요.
