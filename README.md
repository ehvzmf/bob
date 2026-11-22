# bob — 법인카드 계산기

법인카드 월 한도와 영업일을 기준으로 오늘 쓸 수 있는 금액을 계산하고, 내역을 입력하거나 카드 텍스트로 가져와 제출용 사용내역서로 내보내는 모바일 우선 앱입니다.

## 실행

1. Node.js 24 이상 권장
2. `npm install`
3. `npm run dev`

## 주요 상태

- 완료: 예산 계산, 내역 관리, 휴일·쉬는 날 설정, 카드 텍스트 가져오기
- 완료: 식사 추천과 추천 새로 고르기
- 구현됨: 엑셀 양식 선택 후 제출 필드 채우기
- 구현됨: Firebase Auth/Firestore 연동 기반과 localStorage 폴백
- 진행 예정: 엑셀 실제 검증, 30행 초과 처리, OCR/PDF/엑셀 가져오기

## Firebase

- 실제 환경변수는 `.env.local`에 저장합니다.
- 설정 항목은 `.env.example`을 참고합니다.
- 상세 절차는 `docs/firebase-guide.md`를 확인합니다.
- 앱의 데이터는 로그인 후 `users/{uid}/state/main`에 저장됩니다.

## Firebase Hosting

- 로컬 배포: `npm run deploy:hosting`
- GitHub Actions: `main` 브랜치 푸시 시 Hosting 배포
- 배포 설정은 `firebase.json`과 `.github/workflows/deploy.yml`에 있습니다.

## 비공개 양식

- 실제 회사 양식은 공개 저장소에 올리지 않습니다.
- 로컬 템플릿은 `private/templates/`에 두고 Git에서 제외합니다.
- 내보내기 방식과 남은 검증 항목은 `docs/export-template-guide.md`에 있습니다.

## 문서

- `CLAUDE.md`: 프로젝트 규칙과 작업 인수인계
- `docs/roadmap.md`: 전체 로드맵과 남은 작업
- `docs/firebase-guide.md`: Firebase 설정 절차
- `docs/export-template-guide.md`: 엑셀 양식 내보내기 가이드
