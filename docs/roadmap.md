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
- [x] Firebase Hosting 활성화
- [x] Firebase 프로젝트 별칭 `bob` 연결
- [x] 첫 Hosting 배포
- [ ] 배포 도메인을 승인 도메인에 등록
- [ ] GitHub Repository secrets 등록 확인
- [ ] `main` 푸시 시 자동 배포 확인

## GitHub 자동 배포 보관 정보

Repository secrets에 등록한다.

- Firebase 클라이언트 설정 6개
- `VITE_ALLOWED_EMAIL_DOMAIN`은 도메인 제한을 쓰는 경우에만 설정한다.
- `FIREBASE_SERVICE_ACCOUNT`에는 Firebase 프로젝트 설정의 서비스 계정 JSON 전체를 넣는다.
- 서비스 계정 JSON과 실제 `.env.local` 값은 git에 커밋하지 않는다.
- `VITE_ALLOWED_EMAIL_DOMAIN`이 비어 있으면 도메인 제한 없이 구글 로그인한다.

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

## Git 규칙

- 커밋 형식: `gitmoji type: commit message`
- 커밋 후 바로 푸시
- 사용 금지: amend, force-push, rebase
