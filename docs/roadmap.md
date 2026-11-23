# bob 프로젝트 로드맵

## Firebase 및 배포

- [x] Firebase 프로젝트 생성
- [x] Firebase 웹 앱 등록
- [x] `.env.local` 값 입력
- [x] Google 로그인 활성화
- [x] 로컬 승인 도메인 사용
- [x] Firestore Database 생성
- [x] Firestore 보안 규칙 적용
- [x] 로컬 로그인 및 데이터 저장 테스트
- [ ] Firebase Hosting 활성화
- [ ] Firebase 프로젝트 연결
- [ ] 첫 Hosting 배포
- [ ] 배포 도메인을 승인 도메인에 등록
- [ ] GitHub Secrets 등록
- [ ] `main` 푸시 시 자동 배포 확인

## 현재 다음 작업: Hosting 및 CI/CD

### 1. Firebase 프로젝트 연결
- 터미널에서 `npx firebase login`
- `npx firebase use --add` 실행
- 방금 만든 Firebase 프로젝트 선택
- 프로젝트 별칭을 `default`로 사용

### 2. Firebase Hosting 활성화
- Firebase 콘솔에서 Hosting 페이지 열기
- 시작하기 실행
- 로컬 설정은 저장소의 `firebase.json`으로 유지
- `dist/`를 Hosting 공개 폴더로 사용

### 3. 첫 배포
- `npm run build`
- `npm run deploy:hosting`
- 배포 주소 접속
- 배포 주소에서 구글 로그인 테스트

### 4. 배포 도메인 승인
- Firebase 콘솔의 Authentication → Settings → Authorized domains
- Firebase Hosting 배포 주소가 없으면 추가
- 커스텀 도메인을 사용할 경우 해당 도메인도 추가

### 5. GitHub Actions 자동 배포
GitHub 저장소 Settings → Secrets and variables → Actions에 다음 값 등록:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_ALLOWED_EMAIL_DOMAIN`
- `FIREBASE_SERVICE_ACCOUNT`

이후:
- `main` 브랜치에 작은 변경 또는 빈 커밋 푸시
- GitHub Actions 실행 확인
- 빌드 성공 후 Firebase Hosting 배포 확인

## 완료된 기능

- [x] 월 한도와 남은 영업일 계산
- [x] 내역 입력·수정·삭제
- [x] 카드 텍스트 가져오기
- [x] 휴일·쉬는 날 설정
- [x] 식사 추천
- [x] 식사 추천 새로 고르기
- [x] 엑셀 내보내기 초안
- [x] 제출자·계정과목·기간 필드 채우기 초안
- [x] Firebase SDK와 Auth/Firestore 연동
- [x] 파란 계열 디자인과 앱 메타 이름 `bob`
- [x] GitHub 및 Firebase Hosting 설정 초안

## 남은 기능

- [ ] 엑셀 내보내기 실제 검증
- [ ] 30건 초과 내역 처리
- [ ] 합계 수식과 템플릿 서식 검증
- [ ] 템플릿 비공개 Storage 전환
- [ ] 엑셀 가져오기
- [ ] PDF 가져오기
- [ ] 이미지/OCR 가져오기
- [ ] 공휴일 갱신 스크립트
- [ ] 연차 잔여 계산
- [ ] 내보내기 확인 화면
- [ ] 모바일 화면 최종 정리

## Git 규칙

- 커밋 형식: `gitmoji type: commit message`
- 커밋 후 바로 푸시
- 사용 금지: amend, force-push, rebase
