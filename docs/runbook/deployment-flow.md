# 배포 플로우 한눈에 보기

> 자세한 절차는 [`api-deploy.md`](./api-deploy.md), 이 문서는 **전체 그림**과 **현재 상태** 정리용.

---

## 1. 전체 아키텍처

```
┌──────────────┐  git push develop      ┌──────────────────────┐
│   로컬 맥    │ ─────────────────────▶ │  GitHub repo          │
│  (개발자)    │                        │  jieunprohd/deepong   │
└──────┬───────┘                        └──────────┬────────────┘
       │                                            │
       │ ssh -i ~/.ssh/gha_deepong                  │ Actions 트리거
       │                                            ▼
       │                                  ┌────────────────────┐
       │                                  │ GitHub Actions     │
       │                                  │ Deploy API 워크플로우│
       │                                  └─────────┬──────────┘
       │                                            │ SSH (DEPLOY_SSH_KEY)
       ▼                                            ▼
┌──────────────────────────────────────────────────────────────────┐
│  GCP VM     34.64.227.23                                          │
│  Debian 12  사용자: oje92453488   코드: ~/deepong                  │
│                                                                    │
│   외부          ┌──────────────────────────────────────────────┐  │
│   :80   ──────▶ │   Caddy 2-alpine (deepong-caddy)             │  │
│   :443  ──────▶ │   - 자동 Let's Encrypt (DOMAIN 있을 때)        │  │
│                 │   - HTTP→HTTPS 리다이렉트                       │  │
│                 │   - reverse_proxy api:4000                      │  │
│                 └────────────────┬─────────────────────────────┘  │
│                                   │ 컨테이너 네트워크 'deepong'      │
│                                   ▼                                │
│   ┌────────────────────────────────────────────────────────────┐  │
│   │   docker compose (prod) — 내부 네트워크                       │  │
│   │   ┌──────────┐    ┌──────────┐    ┌──────────┐              │  │
│   │   │   api    │    │  mysql   │    │  redis   │              │  │
│   │   │  :4000   │───▶│  :3306   │    │  :6379   │              │  │
│   │   │  내부    │    │  내부    │    │  내부    │              │  │
│   │   └──────────┘    └──────────┘    └──────────┘              │  │
│   └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
       ▲ HTTPS
       │
┌──────┴────────┐                ┌──────────────────────────┐
│ 클라이언트     │  ◀─ DNS A ───  │ DuckDNS 등 무료 DNS       │
│ 브라우저/프론트 │                 │ deepong-demo.duckdns.org │
└───────────────┘                └──────────────────────────┘
```

---

## 2. 컴포넌트별 역할

| 컴포넌트 | 위치 | 역할 |
|---------|------|------|
| **소스 코드** | GitHub `jieunprohd/deepong` (develop 브랜치) | 단일 진실 공급원 (SSOT) |
| **GitHub Actions** | `.github/workflows/deploy-api.yml` | develop 푸시 감지 → VM에 배포 자동화 |
| **GCP VM** | `34.64.227.23` (deepong-vm) | 빌드 + 컨테이너 호스팅 |
| **API 컨테이너** | VM 내 `deepong-api` | NestJS 서버, 외부 4000 노출 |
| **MySQL 컨테이너** | VM 내 `deepong-mysql` | DB. 외부 비공개, 컨테이너 네트워크에서만 접근 |
| **Redis 컨테이너** | VM 내 `deepong-redis` | 캐시·세션. 외부 비공개 |
| **`.env.production`** | VM 내 `~/deepong/.env.production` (gitignored) | 시크릿 보관소 (DB pw, JWT, OAuth) |

---

## 3. 자동 배포 한 사이클

`develop` 브랜치에 api 관련 커밋이 push되면:

```
[1] 로컬 맥
    │ git push origin develop
    ▼
[2] GitHub
    │ paths 매칭 (deepong/apps/api/**, docker-compose.prod.yml, .env.production.example)
    │ Actions 트리거
    ▼
[3] GHA 러너 (ubuntu-latest)
    │ 3-1. webfactory/ssh-agent 로 DEPLOY_SSH_KEY 등록
    │ 3-2. ssh-keyscan 으로 VM 호스트키 신뢰
    │ 3-3. ssh DEPLOY_USER@DEPLOY_HOST << 'REMOTE'
    │        cd ~/deepong
    │        git fetch origin develop
    │        git reset --hard origin/develop
    │        docker compose -f docker-compose.prod.yml \
    │          --env-file .env.production up -d --build
    │      REMOTE
    │ 3-4. health check: curl http://VM:4000/api/v1
    ▼
[4] VM
    │ Docker BuildKit 으로 이미지 재빌드 (캐시 적극 활용)
    │ 컨테이너 무중단 교체 (api만)
    │ mysql/redis 는 그대로 유지
    ▼
[5] 클라이언트
    │ http://34.64.227.23:4000/api/v1 으로 호출 가능
```

수동 트리거: GitHub → Actions → **Deploy API** → **Run workflow**.

---

## 4. 인증 키 흐름

```
[로컬 맥]
  ~/.ssh/gha_deepong         ← 비밀키 (절대 공개 금지)
  ~/.ssh/gha_deepong.pub     ← 공개키
       │
       │ 비밀키 내용 통째로
       ▼
[GitHub Secrets]
  DEPLOY_SSH_KEY             ← GHA 러너가 ssh-agent에 적재해 사용
       │
       │ ssh -i (자동) 접속 시
       ▼
[VM]
  /home/oje92453488/.ssh/authorized_keys  ← 위 공개키가 등록돼야 인증 통과
```

체크리스트:
- ✅ 로컬에 비밀키/공개키 존재 (`ls ~/.ssh/gha_deepong*`)
- ✅ GitHub Secret `DEPLOY_SSH_KEY`에 비밀키 통째로 등록
- ✅ VM의 `oje92453488` 홈에 `authorized_keys` 만들고 공개키 등록
- ✅ VM 권한: `.ssh` 700, `authorized_keys` 600

검증:
```bash
# 로컬에서
ssh -i ~/.ssh/gha_deepong oje92453488@34.64.227.23
# 비밀번호 묻지 않고 바로 들어가면 GHA도 동일하게 들어감
```

---

## 5. GitHub Secrets 매핑

| Secret | 값 | 사용처 |
|--------|------|--------|
| `DEPLOY_HOST` | `34.64.227.23` | ssh 접속 IP |
| `DEPLOY_USER` | `oje92453488` | ssh 로그인 사용자 |
| `DEPLOY_SSH_KEY` | `~/.ssh/gha_deepong` 비밀키 전문 | ssh-agent 등록 |
| `DEPLOY_SSH_PORT` | `22` (생략 시 기본값) | ssh 포트 |

---

## 6. 환경변수 매트릭스

### 프론트 (`.env.local`)
| Key | 로컬 개발 | 운영 |
|-----|---------|------|
| `NEXT_PUBLIC_API_BASE` | `http://localhost:4000/api/v1` | `https://your-domain.duckdns.org/api/v1` |

### 백엔드 (`.env.production` — VM에만 존재)
| Key | 설명 |
|-----|------|
| `DOMAIN` | 무료/본인 도메인 (`your-domain.duckdns.org`). 비워두면 IP+HTTP 폴백 |
| `MYSQL_ROOT_PASSWORD` | DB root 패스워드 (셸 특수문자 회피) |
| `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` | App용 DB 자격증명 |
| `JWT_SECRET` | `openssl rand -hex 32` 결과 |
| `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_PASSWORD` | Google OAuth |
| `OAUTH_CALLBACK_URL` | `https://your-domain.duckdns.org/api/v1/auth/google/callback` |
| `KAKAO_CLIENT_ID`, `KAKAO_CALLBACK_URL` | Kakao OAuth |
| `WEB_ORIGIN` | CORS 허용 origin (`*` / 단일 / 콤마 구분 다중) |

> ⚠️ **`.env.production.example`은 placeholder만**. 진짜 값은 VM의 `.env.production`(gitignored)에만.

---

## 7. 포트 / 방화벽

Caddy 도입 후 외부 노출은 80/443으로 단일화됩니다.

| 포트 | 용도 | GCP 방화벽 인그레스 |
|------|------|------------------|
| 22 | SSH (GHA + 개발자) | `0.0.0.0/0` (운영 시 좁히기 권장) |
| 80 | HTTP (Caddy → ACME challenge + redirect to 443) | `0.0.0.0/0` |
| 443 | HTTPS (Caddy → api 4000) | `0.0.0.0/0` |
| 4000 | API | ❌ 외부 차단 (Caddy 통해서만) |
| 3306 | MySQL | ❌ 외부 차단 |
| 6379 | Redis | ❌ 외부 차단 |

GCP CLI로 검증:
```bash
gcloud compute firewall-rules list --filter="direction=INGRESS"
```

외부에서 도달 가능 검증:
```bash
nc -zv 34.64.227.23 22
nc -zv 34.64.227.23 80
nc -zv 34.64.227.23 443
```

---

## 8. 현재 상태 (2026-05-08)

### ✅ 완료
- 백엔드 NestJS 모듈 구현 (Identity, Relationship, Workspace, Attention, Catchup) — Communication 제외
- 프론트 데모 사이트 구현 + API_BASE 환경변수화
- Dockerfile + docker-compose.prod.yml + .dockerignore
- GitHub Actions 워크플로우 (`.github/workflows/deploy-api.yml`)
- VM 생성 (deepong-vm @ 34.64.227.23, Debian 12)
- VM에 git, Docker 설치
- VM에 `oje92453488` 사용자로 코드 clone (`~/deepong/`)
- `.env.production` 작성

### 🔧 진행 중 / 점검 필요
- [ ] **GCP 방화벽 22번/4000번 인그레스 규칙 적용 확인** (`nc -zv` 통과해야 함)
- [ ] **VM `oje92453488` 사용자에 `authorized_keys` 등록**
- [ ] **GitHub Secrets 4개 등록** (`DEPLOY_HOST=34.64.227.23`, `DEPLOY_USER=oje92453488`, `DEPLOY_SSH_KEY`, `DEPLOY_SSH_PORT=22`)
- [ ] **`.env.production.example`에 들어간 진짜 시크릿을 placeholder로 복구** (현재 OAuth 시크릿/DB 비번 노출 상태)
- [ ] VM 디스크 30GB 이상으로 확장 (10GB는 IOPS·용량 모두 빠듯)
- [ ] 첫 docker compose up 성공
- [ ] GHA 자동 배포 1회 통과 검증

### ⏭️ 다음 단계 (배포 안정화 이후)
- 무료 도메인 발급 (DuckDNS 등) → `.env.production`의 `DOMAIN`에 입력 → Caddy 자동 HTTPS
- TypeORM `synchronize: true` → 마이그레이션으로 전환
- GHA에서 이미지 빌드 → GHCR push → VM은 pull만 하는 패턴 (VM 디스크/CPU 부담 0)
- Communication 컨텍스트 (채팅) 구현
- 프론트엔드 Vercel 배포 (NEXT_PUBLIC_API_BASE = https://your-domain/api/v1)

---

## 9. 자주 겪었던 이슈와 처방

| 증상 | 원인 | 해결 |
|------|------|------|
| `Permission denied (publickey)` | authorized_keys 미등록/권한 잘못 | 공개키 등록 + `.ssh` 700, `authorized_keys` 600 |
| `git: command not found` | git 미설치 | 부트스트랩 사용자(oje)로 `sudo apt-get install -y git` |
| `[sudo] password for deepong:` | deepong이 sudo 그룹 안 들어감 + 비번 없음 | sudo는 부트스트랩 사용자에서만. deepong에 sudo 부여 X |
| `404 download.docker.com/linux/ubuntu bookworm` | OS가 Debian인데 ubuntu URL | `$ID` 자동 감지로 `linux/debian` 사용 |
| `no space left on device` (BuildKit) | VM 부팅 디스크 10GB 부족 | 30GB로 확장 + `docker system prune -af` |
| GHA `Trust VM host key` 실패 | 22번 포트 외부 차단 | GCP 방화벽 인그레스 `tcp:22` `0.0.0.0/0` 추가 |
| GHA `cd /home/***/***: No such file or directory` | DEPLOY_USER가 deepong이지만 deepong 홈에 코드 없음 | DEPLOY_USER를 `oje92453488`로 |
| GHA `Error loading key in libcrypto` | DEPLOY_SSH_KEY 형식 깨짐 | `cat ~/.ssh/gha_deepong | pbcopy` 후 재등록 (CRLF 회피) |
| 빌드 너무 느림 | 디스크 IOPS 한계 (10GB pd-balanced) | 30GB로 확장하면 IOPS 3배 |
| 첫 빌드 5~10분 | mysql:8.0 (600MB) + pnpm install 정상 | 정상 범위 — 두 번째 빌드부터 빠름 |
| `OAuth2Strategy requires a clientID option` | `.env.production`에 `OAUTH_CLIENT_ID` 비어있음 | env 채우기 또는 Strategy 조건부 등록으로 패치 |
| `Access denied for user 'deepong'@'...'` | mysql 데이터 볼륨이 옛 비번으로 만들어짐 | `docker compose down -v && up` (데이터 초기화) |
| 헬스체크 timeout (`http://VM:4000/`) | Caddy 도입 후 4000은 외부 비공개 | 헬스체크 URL을 `http://VM/api/v1` 또는 도메인으로 |
| 인증서 발급 실패 (Caddy logs) | 80번 포트 외부 차단 또는 도메인 A record 미반영 | 80/443 방화벽 + DNS 전파 대기 |

---

## 10. 운영 명령 cheat sheet

VM에 SSH 접속한 상태에서 (`oje92453488` 또는 `deepong`):

```bash
cd ~/deepong

# 컨테이너 상태
docker compose -f docker-compose.prod.yml ps

# 로그 (api만)
docker compose -f docker-compose.prod.yml logs -f --tail=200 api

# 재시작
docker compose -f docker-compose.prod.yml restart api

# 전체 재기동
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# DB 접속
source .env.production
docker compose -f docker-compose.prod.yml exec mysql \
  mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME"

# Redis CLI
docker compose -f docker-compose.prod.yml exec redis redis-cli

# 디스크 상태
df -h /
docker system df

# 청소
docker system prune -af
docker builder prune -af
```

---

## 11. 핵심 파일 인덱스

| 경로 | 역할 |
|------|------|
| `docs/runbook/api-deploy.md` | 처음부터 끝까지 따라하는 절차 (본 문서의 디테일 버전) |
| `docs/runbook/deployment-flow.md` | 본 문서 (전체 그림) |
| `.github/workflows/deploy-api.yml` | GHA 자동 배포 워크플로우 |
| `docker-compose.prod.yml` | 운영용 compose 정의 (caddy + api + mysql + redis) |
| `Caddyfile` | Caddy 리버스 프록시 + 자동 HTTPS 설정 |
| `.env.production.example` | env 템플릿 (placeholder만 들어갈 것) |
| `deepong/apps/api/Dockerfile` | API 멀티스테이지 빌드 정의 |
| `deepong/.dockerignore` | 빌드 컨텍스트에서 제외할 파일 |
| `deepong/src/lib/config.ts` | 프론트 API_BASE 단일 소스 |
| `deepong/.env.example` | 프론트 env 템플릿 |
