# Git 브랜치 전략

## 기본 구조

- `main`: 배포 가능한 상태만 유지
- `feature/*`: 기능 개발
- `fix/*`: 버그 수정
- `docs/*`: 문서 작업
- `chore/*`: 설정과 의존성 작업

## 작업 흐름

```text
main
  feature/name
    commit
    push
    pull request
  main으로 merge
  main 자동 배포
```

## 커밋 규칙

- 형식: `gitmoji type: commit message`
- 예: `✨ feat: improve receipt OCR preview`
- 의미 있는 작업 단위로 커밋
- 금지: amend, force-push, rebase
- 충돌은 normal merge commit으로 해결

## 배포

- `main` 푸시가 GitHub Actions 배포를 실행
- 기능 브랜치에서는 배포하지 않음
- 필요한 경우 PR 전에 빌드를 로컬에서 확인
