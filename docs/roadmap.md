# bob 프로젝트 로드맵

## 현재 상태

### 완료
- Vite + React + TypeScript 모바일 우선 앱
- 월 한도와 남은 영업일 기준 하루 사용 가능 금액 계산
- 내역 입력/수정/삭제와 월별 내역
- 휴일, 회사 휴일, 해피프라이데이, 쉬는 날 설정
- 카드 앱 사용금액 맞추기
- 카드 텍스트 붙여넣기 가져오기와 미리보기/합치기/되돌리기
- 예산 티어 기반 식사 추천과 최근 내역 기반 보완
- 식사 추천 새로 고르기 아이콘
- 파란 계열 색상과 `bob` 메타 정보
- 엑셀 내보내기 초안 및 제출 필드 채우기 구현
- Firebase SDK/Auth/Firestore 상태 동기화 초안
- GitHub 원격 배포 기반 구조 준비

### 구현됐지만 실제 검증이 필요함
- 엑셀 양식 실제 다운로드 및 엑셀 호환성 검증
- 30행 초과 내역 처리
- 합계 수식, 서식, 병합, 인쇄 설정 보존
- 제출자 이름과 계정과목 실제 양식 위치 검증

## 우선순위 로드맵

### 1단계: Firebase 콘솔 연결
현재 코드와 문서는 준비됐지만 계정 설정값은 사용자 환경에 없다.

Firebase 콘솔에서 해야 할 것:
1. 프로젝트 생성 또는 기존 프로젝트 선택
2. Authentication → Sign-in method → Google 활성화
3. 승인된 도메인에 로컬 개발 주소와 배포 도메인 추가
4. Firestore Database 생성
5. Project settings → General에서 웹 앱 등록
6. 웹 앱 설정값을 `.env.local`에 저장
7. 회사 도메인이 있다면 `VITE_ALLOWED_EMAIL_DOMAIN`에 입력
8. Firestore 보안 규칙 적용

현재 환경변수 템플릿:
- `.env.example`
- 실제 값 파일: `.env.local`
- 실제 값은 절대 git에 커밋하지 않는다.

Firestore 규칙은 `request.auth.uid == uid`로 사용자 본인의 문서만 읽고 쓰도록 한다.

### 2단계: Hosting 및 CI/CD
현재 준비된 것:
- `firebase.json`
- `npm run deploy:hosting`
- `.github/workflows/deploy.yml`
- GitHub Actions 빌드/배포 자동화 초안

GitHub에서 설정할 Secrets:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_ALLOWED_EMAIL_DOMAIN`
- `FIREBASE_SERVICE_ACCOUNT`

Firebase Hosting 설정:
1. Firebase 콘솔에서 Hosting 활성화
2. 로컬에서 `npx firebase login`
3. `npx firebase use --add`로 프로젝트 연결
4. `npm run deploy:hosting`으로 첫 배포
5. GitHub Secrets 등록
6. `main` 브랜치 푸시 시 자동 배포 확인

주의:
- 실제 회사 양식은 Hosting의 `dist/`에 넣지 않는다.
- 템플릿은 로컬 비공개 파일 또는 Firebase Storage에만 둔다.
- Firebase 웹 설정값은 공개되어도 되는 클라이언트 설정이지만 프로젝트 설정의 보안 규칙이 중요하다.

### 3단계: 엑셀 내보내기 검증
내보내기 코드는 구현돼 있으므로 실제 제출 가능 여부를 검증한다.

검증 항목:
- 제목과 기간
- 제출자 이름
- 계정과목
- 연번과 승인일자
- 가맹점명과 금액
- 식대/음료 적요
- 합계 수식
- 서식과 병합 유지
- 인쇄 영역 유지
- 데이터가 30건을 넘는 경우 처리

권장 처리:
- 기본 템플릿은 30건이면 내보내기 차단 또는 경고
- 양식이 내역행을 확장할 수 있다면 행 복제와 합계 수식 범위 조정 지원
- 같은 날 여러 건은 내역 한 건당 한 행으로 유지

### 4단계: 템플릿 비공개 보관
- 지금은 사용자가 매번 `.xlsx`를 업로드한다.
- 로그인/Hosting이 안정되면 Firebase Storage로 전환한다.
- Storage 경로는 로그인한 사용자 본인만 읽도록 제한한다.
- 템플릿은 브라우저 메모리에서 읽고 새 복사본을 다운로드한다.
- 원본 템플릿은 앱이나 GitHub에 공개하지 않는다.

### 5단계: 가져오기 확장
우선순위:
1. 엑셀 가져오기
2. PDF 텍스트 가져오기
3. 이미지/OCR 가져오기

각 방식은 모두 기존 `CardRow[] → planImport → applyImport` 흐름에 연결한다.

### 6단계: 운영 보강
- 공휴일 갱신 스크립트
- 연차 잔여 계산
- 내보내기 확인 시트
- 템플릿 행 구조 확장
- 데이터 백업/복구 안내
- 모바일 홈 화면 정리

## 남은 작업 요약
- Firebase 콘솔 설정값 연결
- 구글 로그인 실제 테스트
- Firestore 보안 규칙 적용
- Firebase Hosting 첫 배포
- GitHub Secrets 등록 및 자동 배포
- 엑셀 실제 검증
- 30건 초과 내역 처리
- 템플릿 안전 보관 전환
- 가져오기 확장
- 공휴일 갱신과 연차 계산

## Git 작업 규칙
- 커밋 형식: `gitmoji type: commit message`
- 커밋 후 바로 푸시한다.
- 금지: amend, force-push, rebase
- 충돌 발생 시 병합 또는 정상적인 merge commit을 사용한다.
- 커밋 후 충돌이 없는 경우 `git push origin main`을 수행한다.

## 현재 문서 목록
- `CLAUDE.md`: 전체 작업 규칙과 상태
- `docs/export-template-guide.md`: 엑셀 양식 보안/내보내기 가이드
- `docs/firebase-guide.md`: Firebase 설정과 인증/저장 구조
- `docs/roadmap.md`: 전체 진행 순서와 남은 작업

## 단계별 설정 체크리스트

설정은 한 번에 여러 단계를 진행하지 말고 `docs/setup-checklist.md`의 체크리스트를 단계별로 확인한다.

- 현재 순서: 웹 앱 등록 → `.env.local` 입력 → Google 로그인 활성화 → 승인 도메인 → Firestore 규칙 → 로컬 로그인 테스트 → Hosting → GitHub Actions

Firebase 웹 앱 등록 화면에서는 `npm` 사용을 선택하면 된다.
현재 프로젝트에는 Firebase SDK와 Firebase CLI가 이미 설치돼 있으므로 콘솔 안내의 `npm install firebase`는 다시 실행하지 않아도 된다.
