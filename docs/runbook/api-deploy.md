# API 배포 운영 가이드

대상 VM: **34.64.227.23** (GCP Compute Engine)
구조: API + MySQL + Redis가 같은 VM에서 docker compose로 동작

이 문서는 **처음부터 끝까지 한 번에 따라할 수 있게** 순서대로 작성됐습니다. 중간에 시도하다 꼬였다면 [§0 초기화](#0-초기화-필요할-때만)부터 시작하세요.

---

## 0. 초기화 (필요할 때만)

이전에 deepong 사용자/키를 만들다 막혔다면 깨끗이 지우고 다시 시작합니다. **GCP Console의 브라우저 SSH로 접속**해서 본인 계정(`oje92453488` 같은 GCP 사용자)으로 실행하세요.

```bash
# deepong 사용자가 있다면 삭제 (홈 디렉터리도 함께 제거)
sudo userdel -r deepong 2>/dev/null || true

# Docker 그룹에 잘못된 매핑이 남아있을 수 있으니 정리
getent group docker && sudo gpasswd -d deepong docker 2>/dev/null || true

# 부트스트랩 사용자의 ssh-keygen 흔적 제거 (VM에 비밀키를 만든 적 있을 때)
rm -f ~/.ssh/gha_deepong ~/.ssh/gha_deepong.pub

# 기존 deepong-prod compose 스택이 있으면 정리
if [ -d ~/deepong ]; then
  cd ~/deepong && docker compose -f docker-compose.prod.yml down -v 2>/dev/null || true
  cd ~ && rm -rf ~/deepong
fi

# 컨테이너/이미지 잔여물 정리
docker system prune -af --volumes 2>/dev/null || true
```

> Docker 자체를 다시 깔고 싶으면:
`sudo apt-get purge -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin && sudo rm -rf /var/lib/docker /etc/docker`

---

## 1. VM에 git + Docker 설치 (부트스트랩 사용자로)

GCP 브라우저 SSH 또는 `gcloud compute ssh` 로 접속한 본인 계정(`oje92453488` 등)에서 실행합니다.

```bash
sudo apt-get update
sudo apt-get install -y git ca-certificates curl gnupg

# Docker 공식 저장소 등록 (Ubuntu/Debian 자동 감지)
sudo install -m 0755 -d /etc/apt/keyrings
. /etc/os-release
DOCKER_OS_DIR="$ID"   # 'ubuntu' 또는 'debian'
DOCKER_CODENAME="$VERSION_CODENAME"

curl -fsSL "https://download.docker.com/linux/${DOCKER_OS_DIR}/gpg" | \
  sudo gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/${DOCKER_OS_DIR} ${DOCKER_CODENAME} stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 설치 확인
git --version
docker --version
docker compose version
```

---

## 2. 로컬 맥에서 SSH 키쌍 생성 (절대 VM에서 만들지 말 것)

배포에 쓸 SSH 키쌍은 **본인 로컬 맥**에서 만듭니다. 비밀키가 VM에 남으면 보안상 위험.

```bash
# 로컬 맥 터미널
ssh-keygen -t ed25519 -C 'gha-deepong-deploy' -f ~/.ssh/gha_deepong -N ''

# 공개키 내용 출력 — 다음 단계에 붙여넣기 위해 복사해 둡니다
cat ~/.ssh/gha_deepong.pub
```

`~/.ssh/gha_deepong` (비밀키)는 두 곳에서 쓰입니다:

- 로컬 맥에서 `ssh -i ~/.ssh/gha_deepong deepong@...` 접속용
- GitHub Actions Secret `DEPLOY_SSH_KEY` 값 (이번 §6에서 등록)

---

## 3. 배포 전용 사용자 `deepong` 생성 (브라우저 SSH에서)

다시 GCP 브라우저 SSH(`oje92453488` 세션)로 돌아가 실행:

```bash
# 1) 사용자 생성 — 비밀번호 없이
sudo adduser --disabled-password --gecos '' deepong

# 2) docker 그룹에만 추가 (sudo는 일부러 부여 X)
sudo usermod -aG docker deepong

# 3) deepong의 .ssh 디렉터리 + authorized_keys 작성
sudo install -d -m 700 -o deepong -g deepong /home/deepong/.ssh

# ↓↓↓ 아래 'PASTE_PUBLIC_KEY_HERE' 자리에 §2에서 출력한 공개키 한 줄을 붙여넣기
sudo tee /home/deepong/.ssh/authorized_keys > /dev/null <<'EOF'
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOzmCUnon9GgiQ7QW5ueupZfDayKPc1Lvq5479UNF+rZ gha-deepong-deploy
EOF

sudo chown deepong:deepong /home/deepong/.ssh/authorized_keys
sudo chmod 600 /home/deepong/.ssh/authorized_keys

# 4) 확인
sudo cat /home/deepong/.ssh/authorized_keys
groups deepong   # docker 포함 확인
```

> 위 HEREDOC의 `'EOF'` 따옴표가 중요합니다 (변수 치환 방지).

---

## 4. 로컬 맥에서 SSH 접속 테스트

```bash
ssh -i ~/.ssh/gha_deepong deepong@34.64.227.23
```

성공하면 `deepong@deepong-vm:~$` 프롬프트가 보입니다. 이제부터는 **로컬 → 원격 deepong** 으로 작업합니다.

> 자주 쓰면 `~/.ssh/config`에 등록:
> ```
> Host deepong-prod
>   HostName 34.64.227.23
>   User deepong
>   IdentityFile ~/.ssh/gha_deepong
>   IdentitiesOnly yes
> ```
> 이후 `ssh deepong-prod` 만으로 접속 가능.

---

## 5. 코드 clone + GitHub deploy key

deepong 사용자로 접속한 상태에서.

### 5-1. (private repo인 경우) deploy key 생성·등록

```bash
# VM의 deepong 사용자로
ssh-keygen -t ed25519 -C 'deepong-vm-deploy' -f ~/.ssh/github_deploy -N ''
cat ~/.ssh/github_deploy.pub   # 출력 복사
```

GitHub: 해당 repo → Settings → **Deploy keys** → Add → 위 공개키 붙여넣고 **Read-only** 체크 → 저장.

```bash
# SSH config에 GitHub 키 매핑
cat >> ~/.ssh/config <<'EOF'
Host github.com
  IdentityFile ~/.ssh/github_deploy
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config

# 첫 호스트키 신뢰
ssh -T git@github.com
# "Hi jieunprohd/deepong! You've successfully authenticated" 메시지 확인
```

### 5-2. clone

```bash
git clone git@github.com:jieunprohd/deepong.git ~/deepong
cd ~/deepong
git checkout develop
```

> public repo면 `git clone https://github.com/jieunprohd/deepong.git ~/deepong`

---

## 6. 운영 환경변수 작성

```bash
cd ~/deepong
cp .env.production.example .env.production
chmod 600 .env.production

# 강한 시크릿 생성
openssl rand -hex 32   # JWT_SECRET 등에 사용

vim .env.production    # 실제 값으로 채우기
```

채워야 할 항목:

- `MYSQL_ROOT_PASSWORD`, `DB_PASSWORD` — 임의의 강한 패스워드
- `JWT_SECRET` — 위 openssl 출력
- `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_PASSWORD` — Google Cloud Console에서 OAuth 클라이언트 발급
- `KAKAO_CLIENT_ID` — 카카오 개발자 콘솔
- 콜백 URL은 IP 기반 그대로 두거나 도메인 확보 후 변경

---

## 7. GCP 방화벽 규칙

GCP Console → VPC Network → Firewall → 인그레스 규칙 추가 (또는 gcloud CLI):

| 이름                  | 대상              | 소스 IP       | 포트                  |
|----------------------|------------------|--------------|----------------------|
| `allow-ssh`          | All instances    | `0.0.0.0/0`  | `tcp:22`             |
| `allow-deepong-http` | All instances    | `0.0.0.0/0`  | `tcp:80,tcp:443`     |

```bash
gcloud compute firewall-rules create allow-ssh \
  --direction=INGRESS --action=ALLOW \
  --rules=tcp:22 --source-ranges=0.0.0.0/0

gcloud compute firewall-rules create allow-deepong-http \
  --direction=INGRESS --action=ALLOW \
  --rules=tcp:80,tcp:443 --source-ranges=0.0.0.0/0
```

> MySQL(3306), Redis(6379), API(4000)는 외부에 절대 열지 않습니다. 모두 Caddy 통해 80/443으로만 접근.

검증:
```bash
nc -zv 34.64.227.23 22
nc -zv 34.64.227.23 80
nc -zv 34.64.227.23 443
```

---

## 8. 첫 기동 (HTTP 모드)

도메인 없이 IP로 먼저 띄우는 단계.

```bash
cd ~/deepong
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api
```

5개 컨테이너가 모두 `Up`이면 정상:
- `deepong-caddy` (포트 80, 443)
- `deepong-api` (내부)
- `deepong-mysql` (healthy, 내부)
- `deepong-redis` (내부)

브라우저/curl로 접근 확인:
```bash
curl http://34.64.227.23/api/v1
```

---

## 9. 무료 도메인 + 자동 HTTPS 적용

DuckDNS, no-ip 등 **무료 서브도메인**으로 자동 HTTPS를 발급받습니다.

### 9-1. 도메인 발급

**DuckDNS 추천** (가장 단순):
1. https://www.duckdns.org 접속 → GitHub/Google 계정으로 로그인
2. 원하는 서브도메인 입력 (예: `deepong-demo`) → **add domain**
3. 발급된 도메인: `deepong-demo.duckdns.org`
4. 같은 페이지 **current ip** 칸에 `34.64.227.23` 입력 → **update ip**

> 다른 옵션:
> - https://www.no-ip.com (무료 30일마다 갱신 필요)
> - https://freedns.afraid.org (다양한 도메인 제공)
> - 본인 도메인 보유 시 그대로 사용

### 9-2. .env.production에 DOMAIN 추가

```bash
cd ~/deepong
nano .env.production
```

다음 줄 추가/수정:
```
DOMAIN=deepong-demo.duckdns.org
OAUTH_CALLBACK_URL=https://deepong-demo.duckdns.org/api/v1/auth/google/callback
KAKAO_CALLBACK_URL=https://deepong-demo.duckdns.org/api/v1/auth/kakao/callback
WEB_ORIGIN=https://your-frontend-domain.com
```

> CORS는 프론트엔드 origin과 정확히 일치해야 함. 프론트도 같은 도메인이거나 Vercel/Netlify URL이라면 그 값 입력. 데모면 `*` 유지.

### 9-3. 재기동 + 인증서 자동 발급

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
docker compose -f docker-compose.prod.yml logs -f caddy
```

Caddy 로그에서 다음 메시지 보이면 인증서 발급 성공:
```
certificate obtained successfully
```

(보통 30초~2분 소요. Let's Encrypt가 도메인의 80번 포트로 ACME challenge를 보내 검증.)

### 9-4. 검증

```bash
curl https://deepong-demo.duckdns.org/api/v1
# 또는 브라우저 접속 — 자물쇠 마크 확인
```

### 9-5. OAuth 콜백 등록

Google Cloud Console / 카카오 디벨로퍼에서 콜백 URL 화이트리스트에 추가:
- `https://deepong-demo.duckdns.org/api/v1/auth/google/callback`
- `https://deepong-demo.duckdns.org/api/v1/auth/kakao/callback`

---

## 10. GitHub Actions Secrets 등록

Repo → Settings → Secrets and variables → Actions → New repository secret:

| Name                  | 값                                                  |
|-----------------------|----------------------------------------------------|
| `DEPLOY_HOST`         | `34.64.227.23`                                     |
| `DEPLOY_USER`         | VM 사용자 (예: `oje92453488`)                          |
| `DEPLOY_SSH_KEY`      | 로컬 맥의 `~/.ssh/gha_deepong` 비밀키 전체 (BEGIN/END 줄 포함) |
| `DEPLOY_SSH_PORT`     | `22` (기본이면 생략 가능)                                  |
| `DEPLOY_HEALTH_URL`   | `https://deepong-demo.duckdns.org/api/v1` (도메인 적용 후) |

비밀키 내용 출력:

```bash
# 로컬 맥
cat ~/.ssh/gha_deepong
```

이후 `develop` 브랜치에 api/compose/Caddyfile 관련 변경을 푸시하면 자동 배포 트리거.

---

## 10. 자주 쓰는 운영 명령

```bash
# 컨테이너 상태
docker compose -f docker-compose.prod.yml ps

# 로그
docker compose -f docker-compose.prod.yml logs -f --tail=200 api

# 재시작 / 재기동
docker compose -f docker-compose.prod.yml restart api
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# DB 접속
source .env.production
docker compose -f docker-compose.prod.yml exec mysql \
  mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME"

# Redis CLI
docker compose -f docker-compose.prod.yml exec redis redis-cli
```

---

## 11. 트러블슈팅

### 11-1. `Permission denied (publickey)` — SSH 접속 안 됨

- 공개키가 `/home/deepong/.ssh/authorized_keys`에 정확히 들어갔는지 (BEGIN/END 줄 없는 한 줄)
- 권한: `.ssh` 700, `authorized_keys` 600, 소유자 `deepong:deepong`
- 로컬 키 지정: `ssh -i ~/.ssh/gha_deepong deepong@...` (잘못된 키가 자동 선택될 수 있음)

### 11-2. `[sudo] password for deepong:` 프롬프트

- deepong은 sudo 권한 자체가 필요 없습니다. sudo 명령을 쓰지 마세요.
- 시스템 작업(apt 설치 등)은 부트스트랩 사용자(`oje92453488` 등)에서 수행.

### 11-3. `git: command not found`

- §1을 부트스트랩 사용자로 다시 실행했는지 확인.

### 11-4. API가 DB에 연결 안 됨

- `docker compose logs mysql` 로 MySQL이 정상 시작했는지
- `docker compose logs api` 에서 ECONNREFUSED인지
- `.env.production`의 `DB_PASSWORD`/`DB_USERNAME`이 mysql 환경변수와 일치하는지

### 11-5. 빌드 시 OOM

- VM 메모리가 < 2GB면 swap 추가:
  ```bash
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  ```

### 11-6. TypeORM synchronize로 데이터 손실 위험

- 현재 `synchronize: true`라 엔티티 변경 시 자동 ALTER. 데모 단계 한정.
- 운영 본격화 전 마이그레이션 도입 필요.
- 백업: `docker compose exec mysql mysqldump -uroot -p"$PW" "$DB" > backup-$(date +%F).sql`

### 11-7. 도메인 + HTTPS 추가

- 도메인 발급 후 A record로 34.64.227.23 매핑
- compose에 caddy 또는 nginx + certbot 컨테이너 추가 (별도 PR)
