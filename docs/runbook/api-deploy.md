# API 배포 운영 가이드

대상 VM: **34.64.243.38** (GCP Compute Engine)
구조: API + MySQL + Redis가 같은 VM에서 docker compose로 동작

---

## 1. 최초 1회 — VM 세팅

VM에 SSH로 접속한 뒤 아래 절차를 한 번만 실행합니다.

### 1-1. Docker 설치 (Ubuntu 기준)

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# sudo 없이 docker 사용
sudo usermod -aG docker $USER
newgrp docker
```

### 1-2. 배포용 사용자 + SSH 키 등록

```bash
# 배포 전용 사용자 생성 (선택)
sudo adduser --disabled-password --gecos '' deepong
sudo usermod -aG docker deepong

# GitHub Actions가 사용할 SSH 키페어 생성 (로컬 머신에서)
ssh-keygen -t ed25519 -C 'gha-deepong-deploy' -f ~/.ssh/gha_deepong -N ''

# 공개키를 VM의 deepong 유저에 등록
ssh-copy-id -i ~/.ssh/gha_deepong.pub deepong@34.64.243.38
# 또는 VM에서 직접:
#   sudo -u deepong mkdir -p /home/deepong/.ssh
#   sudo -u deepong tee /home/deepong/.ssh/authorized_keys < ~/.ssh/gha_deepong.pub
#   sudo chmod 700 /home/deepong/.ssh && sudo chmod 600 /home/deepong/.ssh/authorized_keys
```

비밀키(`~/.ssh/gha_deepong`) 전체를 GitHub repo Settings → Secrets에 `DEPLOY_SSH_KEY`로 등록.

### 1-3. 코드 클론

```bash
sudo -u deepong -i

# Github SSH 키 또는 deploy key를 등록한 상태에서
git clone git@github.com:jieunprohd/deepong.git ~/deepong
cd ~/deepong
git checkout develop
```

> Github에 deploy 전용 SSH 키를 등록하거나, 토큰 기반 HTTPS clone을 사용해도 됩니다.

### 1-4. 운영 환경변수 작성

```bash
cd ~/deepong
cp .env.production.example .env.production
chmod 600 .env.production

# 강한 시크릿 생성 예시
openssl rand -hex 32  # JWT_SECRET 등에 사용

vim .env.production    # 실제 값으로 채우기
```

### 1-5. 방화벽 규칙

GCP 콘솔 → VPC Network → Firewall에서 인그레스 규칙 추가:

| 이름 | 대상 | 소스 IP | 포트 |
|------|------|---------|------|
| allow-deepong-api | 인스턴스 태그 | 0.0.0.0/0 | tcp:4000 |
| allow-ssh | 인스턴스 태그 | (조직 IP만 권장) | tcp:22 |

> MySQL(3306), Redis(6379)는 외부에 절대 열지 않습니다. compose 내부 네트워크로만 접근.

### 1-6. 첫 기동

```bash
cd ~/deepong
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api
```

브라우저/curl로 `http://34.64.243.38:4000/api/v1` 접근 확인.

---

## 2. GitHub Actions Secrets 등록

Repo → Settings → Secrets and variables → Actions → New repository secret:

| Name | 값 예시 |
|------|---------|
| `DEPLOY_HOST` | `34.64.243.38` |
| `DEPLOY_USER` | `deepong` |
| `DEPLOY_SSH_KEY` | `~/.ssh/gha_deepong` 비밀키 전체 (BEGIN/END 줄 포함) |
| `DEPLOY_SSH_PORT` | `22` (기본 그대로면 생략 가능) |

---

## 3. 배포 흐름

1. develop 브랜치에 push → `Deploy API` 워크플로우 자동 트리거 (api 관련 변경시에만)
2. GHA 러너가 VM에 SSH 접속 → `git fetch && git reset --hard origin/develop`
3. `.env.production` 존재 검증 후 `docker compose up -d --build`
4. 헬스 체크: `http://VM:4000/api/v1` 응답 확인

수동 트리거: GitHub Actions 탭에서 `Deploy API` → `Run workflow`.

---

## 4. 자주 쓰는 운영 명령

```bash
# 컨테이너 상태
docker compose -f docker-compose.prod.yml ps

# 로그 (api 만)
docker compose -f docker-compose.prod.yml logs -f --tail=200 api

# 재시작
docker compose -f docker-compose.prod.yml restart api

# 전체 재기동
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# DB 접속 (컨테이너 내부)
docker compose -f docker-compose.prod.yml exec mysql \
  mysql -u root -p$MYSQL_ROOT_PASSWORD deepong

# Redis CLI
docker compose -f docker-compose.prod.yml exec redis redis-cli
```

---

## 5. 트러블슈팅

### 5-1. API가 DB에 연결 안 됨
- `docker compose logs mysql` 로 MySQL이 정상 시작했는지
- `docker compose logs api` 에서 ECONNREFUSED인지 확인
- compose의 `depends_on.condition: service_healthy`가 동작하는지 healthcheck 확인

### 5-2. 빌드 시 OOM
- VM 메모리가 작은 경우(< 2GB) 빌드 단계에서 멈출 수 있음
- 임시로 swapfile 추가:
  ```bash
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  ```

### 5-3. TypeORM synchronize로 데이터 손실
- 현재 `synchronize: true`라 엔티티 변경 시 자동 ALTER
- 데모 단계 외 운영 본격화 전에 마이그레이션으로 전환 필요
- 임시 백업: `docker compose exec mysql mysqldump -uroot -p<pw> deepong > backup-$(date +%F).sql`

### 5-4. 도메인 + HTTPS 추가
- 도메인 발급 후 A record로 34.64.243.38 매핑
- compose에 caddy 또는 nginx + certbot 컨테이너 추가
- 추후 별도 PR
