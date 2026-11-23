# Firebase 및 배포 설정 체크리스트

이 문서는 한 번에 여러 단계를 보여주지 않고, 현재 해야 할 설정만 순서대로 확인하기 위한 체크리스트다.

## 현재 단계

### 단계 1: Firebase 웹 앱 등록
- [ ] Firebase 프로젝트를 열었다.
- [ ] Project settings → General로 이동했다.
- [ ] 내 앱에서 웹 앱 `</>`을 등록했다.
- [ ] Firebase 콘솔의 SDK 등록 화면에서 `npm` 옵션을 선택했다.
- [ ] 웹 앱 설정값을 확인했다.

앱 설정값은 이미 사용 중인 npm SDK와 연결된다.
현재 프로젝트에는 다음 패키지가 이미 설치돼 있다.

- `firebase`
- `firebase-tools`
- `jszip`

따라서 Firebase 콘솔의 npm 안내에서 별도로 `npm install firebase`를 다시 실행할 필요는 없다.

콘솔에서 복사한 값은 아래 항목으로 `.env.local`에 넣는다.

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_ALLOWED_EMAIL_DOMAIN=
```

- `VITE_ALLOWED_EMAIL_DOMAIN`에 회사 구글 계정 도메인을 넣는다. 예: `company.com`
- `.env.local`은 git에 커밋하지 않는다.
- 이 단계가 끝나면 앱을 다시 실행하고 설정 화면의 Firebase 상태를 확인할 수 있다.

### 단계 2: Google 로그인 활성화
- [ ] Firebase Console → Authentication으로 이동했다.
- [ ] Get started를 눌렀다.
- [ ] Sign-in method에서 Google을 선택했다.
- [ ] Google 로그인을 Enable했다.
- [ ] 지원 이메일을 선택했다.
- [ ] 저장했다.

아직 이 단계를 하지 않았다면 지금 멈추고 여기만 완료하면 된다.

### 단계 3: 승인 도메인 등록
- [ ] Authentication → Settings → Authorized domains를 열었다.
- [ ] 로컬 개발 주소 `localhost`가 등록돼 있다.
- [ ] 배포 후 Firebase Hosting 도메인을 등록한다.
- [ ] 커스텀 도메인이 있으면 그 도메인도 등록한다.

현재 단계에서는 Firebase Hosting 도메인을 아직 모르므로, 이 단계는 Hosting 첫 배포 이후에 해도 된다.

### 단계 4: Firestore 생성
- [ ] Firebase Console → Build → Firestore Database로 이동했다.
- [ ] 데이터베이스를 생성했다.
- [ ] 프로젝트 위치를 선택했다.
- [ ] 보안 규칙을 적용했다.

기본 보안 규칙 목표:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == uid;
    }
  }
}
```

이 규칙이 적용되기 전에는 로그인한 사용자의 데이터가 다른 사용자에게 노출될 수 있다.

### 단계 5: 로컬 로그인 테스트
- [ ] `.env.local` 값 입력을 끝냈다.
- [ ] `npm run dev`로 앱을 실행했다.
- [ ] 설정 화면에서 구글 로그인이 보인다.
- [ ] 회사 계정으로 로그인했다.
- [ ] 로그인 후 내역을 추가했다.
- [ ] 새로고침 후에도 데이터가 유지된다.

로그인 테스트가 성공하면 다음 단계로 진행한다.

### 단계 6: Firebase Hosting 활성화
- [ ] Firebase Console에서 Hosting을 활성화했다.
- [ ] 터미널에서 `npx firebase login`을 실행했다.
- [ ] `npx firebase use --add`로 프로젝트를 연결했다.
- [ ] `npm run deploy:hosting`으로 첫 배포했다.
- [ ] 배포된 주소가 정상적으로 열린다.

### 단계 7: GitHub 자동 배포
GitHub 저장소 Settings → Secrets and variables → Actions에 다음 Secrets를 추가한다.

- [ ] `VITE_FIREBASE_API_KEY`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN`
- [ ] `VITE_FIREBASE_PROJECT_ID`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `VITE_FIREBASE_APP_ID`
- [ ] `VITE_ALLOWED_EMAIL_DOMAIN`
- [ ] `FIREBASE_SERVICE_ACCOUNT`

Firebase 서비스 계정은 Firebase Console의 프로젝트 설정 → 서비스 계정에서 생성한다.
생성한 JSON 전체를 GitHub Secret에 넣는다.

- [ ] `main` 브랜치에 빈 또는 실제 변경을 푸시했다.
- [ ] GitHub Actions에서 빌드가 성공했다.
- [ ] Firebase Hosting 배포가 성공했다.
- [ ] 배포 주소에서 로그인 테스트를 다시 했다.

## 지금 멈출 지점

지금은 **단계 1**이다.
웹 앱 등록 화면에서 npm을 선택하고, 생성된 설정값을 `.env.local`에 넣으면 된다.
설정값은 문서나 채팅에 직접 붙여 넣기보다 파일에 저장하는 방식이 안전하다.

다음 질문은 아래 중 하나면 된다.

- “단계 1 완료했어. 다음에 뭐 해?”
- “단계 2 완료했어. 승인 도메인은 지금 뭐 등록해?”
- “단계 3 완료했어. Firestore 규칙 넣어줘.”
- “로그인 테스트가 안 돼.”
