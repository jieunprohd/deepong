# syntax=docker/dockerfile:1.7

# ===== base =====
# pnpm + Node 22 LTS 환경. corepack로 pnpm 버전 고정 (package.json의 packageManager 따름).
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /workspace

# ===== deps =====
# 워크스페이스 루트(deepong/)의 lockfile을 활용해 deterministic install
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @deepong/api...

# ===== builder =====
FROM base AS builder
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/apps/api/node_modules ./apps/api/node_modules
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api ./apps/api
RUN pnpm --filter @deepong/api build

# ===== prod-deps =====
# 운영 의존성만 별도 stage에서 깨끗하게 설치 (devDependencies 제외)
FROM base AS prod-deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod --filter @deepong/api...

# ===== runner =====
FROM node:22-alpine AS runner
RUN apk add --no-cache tini
WORKDIR /app

ENV NODE_ENV=production \
    PORT=4000

# 운영 의존성 + 빌드 산출물 복사
COPY --from=prod-deps /workspace/node_modules ./node_modules
COPY --from=prod-deps /workspace/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /workspace/apps/api/dist ./apps/api/dist
COPY --from=builder /workspace/apps/api/package.json ./apps/api/package.json

# non-root 유저로 전환
RUN addgroup -g 10001 -S app && adduser -S -u 10001 -G app app
USER app

EXPOSE 4000
WORKDIR /app/apps/api

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main"]
