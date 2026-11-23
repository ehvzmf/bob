# bob 프로젝트 로드맵

## Firebase 및 배포

- [x] Firebase 프로젝트 생성
- [x] Firebase 웹 앱 등록
- [x] `.env.local` 값 입력
- [ ] Google 로그인 활성화
- [ ] 승인 도메인 등록
- [ ] Firestore Database 생성
- [ ] Firestore 보안 규칙 적용
- [ ] 로컬 로그인 테스트
- [ ] Firebase Hosting 활성화
- [ ] Firebase 프로젝트 연결
- [ ] 첫 Hosting 배포
- [ ] GitHub Secrets 등록
- [ ] `main` 푸시 시 자동 배포 확인

## 완료된 기능

- [x] 월 한도와 남은 영업일 계산
- [x] 내역 입력·수정·삭제
- [x] 카드 텍스트 가져오기
- [x] 휴일·쉬는 날 설정
- [x] 식사 추천
- [x] 식사 추천 새로 고르기
- [x] 엑셀 내보내기 초안
- [x] 제출자·계정과목·기간 필드 채우기 초안
- [x] Firebase SDK와 Auth/Firestore 연동 초안
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

## 현재 다음 작업

`Google 로그인 활성화`부터 진행한다.

## 주요 문서

- `CLAUDE.md`: 프로젝트 규칙과 작업 인수인계
- `docs/firebase-guide.md`: Firebase 설정 참고 문서
- `docs/export-template-guide.md`: 엑셀 양식 내보내기 가이드
- `docs/roadmap.md`: 전체 진행 체크리스트

## Git 규칙

- 커밋 형식: `gitmoji type: commit message`
- 커밋 후 바로 푸시
- 사용 금지: amend, force-push, rebase
