# Firebase 설정 가이드

## 목표
- 구글 로그인
- 회사 계정 도메인 제한
- 로그인한 사용자별 Firestore 상태 저장
- 로그인 전에는 기존 localStorage 사용
- 카드 내역과 양식은 공개 저장소에 올리지 않는다

## Firebase 콘솔 작업
1. Firebase 프로젝트를 만든다.
2. Authentication에서 Google 로그인 제공자를 활성화한다.
3. 승인된 도메인에 배포 도메인과 로컬 주소를 등록한다.
4. Firestore Database를 만든다.
5. 프로젝트 설정의 일반 탭에서 웹 앱을 등록한다.
6. 앱 설정값을 `.env.local`에 넣는다.

## 환경변수

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_ALLOWED_EMAIL_DOMAIN=example.com
```

- `VITE_ALLOWED_EMAIL_DOMAIN`은 회사 계정 도메인이다. 예: `company.com`
- 도메인을 비워두면 모든 구글 계정 로그인이 허용된다.
- 실제 값은 `.env.local`에만 넣고 git에 커밋하지 않는다.

## Firestore 데이터 구조

```text
users/{uid}/state/main
  state: { entries, leaves, settings, card, memory }
  updatedAt: ISO 문자열
```

## Firestore 보안 규칙

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

회사 도메인 제한은 앱 코드와 함께 인증 서버에서도 운영해야 한다. 가능하면 Custom Claims 또는 Firebase Auth의 사전 승인 설정을 추가한다.

## 동기화 방식
- 로그인 전: `localStorage` 사용
- 로그인 후: Firestore에서 `users/{uid}/state/main` 로드
- 로그인 후 상태 변경: Firestore에 저장
- 로그인 후에도 localStorage는 최신 로컬 복사본으로 유지
- 다음 기기에서 로그인하면 동일 uid의 상태를 불러온다

## 현재 상태

- [x] Firebase 프로젝트 생성
- [x] 웹 앱 등록
- [x] 환경변수 입력
- [ ] Google 로그인 활성화
- [ ] 승인 도메인 등록
- [ ] Firestore Database 생성
- [ ] 보안 규칙 적용
- [ ] 로컬 로그인 테스트

현재 프로젝트의 Firebase SDK와 Firebase CLI는 이미 설치돼 있다.
별도 npm 설치는 필요 없다.

## 다음 단계
- 템플릿 파일은 Firestore가 아니라 별도 비공개 Firebase Storage에 둔다.
- Storage 보안 규칙은 로그인한 사용자 본인만 읽도록 제한한다.
- Hosting 배포 후 도메인을 Authentication 승인 목록에 넣는다.
