# 기능별 자동 커밋

변경된 파일을 분석해서 기능별로 묶어 커밋 메시지를 자동 작성하고 순차적으로 커밋합니다.

## 실행 순서

1. `git status`와 `git diff` 로 변경 사항 전체 파악
2. 파일 경로 기준으로 아래 그룹으로 분류:

   | 그룹 | 해당 경로 |
   |------|----------|
   | feat(identity) | `apps/api/src/modules/identity/` |
   | feat(relationship) | `apps/api/src/modules/relationship/` |
   | feat(communication) | `apps/api/src/modules/communication/`, `src/features/communication/`, `src/lib/chat.tsx`, `src/lib/socket.tsx` |
   | feat(attention) | `apps/api/src/modules/attention/`, `src/features/attention/` |
   | feat(catchup) | `apps/api/src/modules/catchup/`, `src/features/catchup/` |
   | feat(workspace) | `apps/api/src/modules/workspace/` |
   | feat(frontend) | `src/app/`, `src/features/` (위 그룹 미해당), `src/lib/`, `src/hooks/` |
   | feat(onboarding) | `src/app/onboarding/` |
   | feat(infra) | `apps/api/src/shared/`, `apps/api/src/app.module.ts` |
   | chore | `package.json`, `pnpm-lock.yaml`, `*.config.*`, `.env*` |
   | docs | `claudedocs/`, `*.md` |

3. 각 그룹별로:
   - 변경 내용 요약 (한국어, 1~2줄)
   - Conventional Commit 형식으로 메시지 작성:
     ```
     <type>(<scope>): <한국어 요약>
     
     Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
     ```
   - `type`은 `feat` / `fix` / `refactor` / `chore` / `docs` 중 선택
   - 해당 파일만 `git add` 후 커밋

4. 커밋 전 각 그룹의 파일 목록과 메시지를 보여주고 진행 여부 확인

## 규칙

- 빈 그룹은 스킵
- untracked 파일도 포함
- `.env`, `*.secret` 파일은 절대 커밋하지 않음 — 발견 시 경고
- 한 그룹에 너무 많은 파일(10개+)이면 세부 기능으로 추가 분할 고려
- 이미 staged된 파일이 있으면 먼저 사용자에게 알림
