# ---- base ----
FROM node:20-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# 일부 Next 플러그인/이미지 최적화를 위해 필요할 수 있음
RUN apk add --no-cache libc6-compat

# ---- deps (devDeps 포함) ----
FROM base AS deps
# BuildKit 캐시 활용 (Docker 24+)
# syntax=docker/dockerfile:1.7-labs
# 위 주석을 Dockerfile 최상단에 넣으면 다음 캐시마운트 사용 가능
# RUN --mount=type=cache,target=/root/.npm
COPY package.json package-lock.json ./
RUN npm ci  # ❗ devDependencies 포함 설치 (빌드용)

# ---- builder ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 환경변수는 빌드 타임에도 필요시 지정 가능
# ENV NEXT_PUBLIC_API_BASE_URL=/api
RUN npm run build

# ---- runner (production) ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# 필요 시 타임존
# ENV TZ=Asia/Seoul

# 보안: 비루트 유저
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs
USER nextjs

# 정적 리소스
COPY --from=builder /app/public ./public

# standalone 런타임만 복사 (node_modules 포함됨)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# static은 별도로 필요
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 프리렌더 캐시/런타임 쓰기 디렉터리
RUN mkdir -p .next && chown nextjs:nodejs .next

EXPOSE 3000
ENV PORT=3000
# ENV HOSTNAME "0.0.0.0"  # 없어도 됨

# standalone에 포함된 server.js 기준
CMD ["node", "server.js"]

# (옵션) 헬스체크 – /health 엔드포인트 있을 때
# HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
#   CMD wget -qO- http://localhost:3000/health || exit 1

# (옵션) 메타데이터
# LABEL org.opencontainers.image.source="https://example.com/repo"
# LABEL org.opencontainers.image.description="Next.js 15 prod image" 