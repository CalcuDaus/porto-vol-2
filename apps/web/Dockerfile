# Stage 1: Build application
FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY package.json bun.lock ./
COPY scripts ./scripts
COPY apps/web/package.json ./apps/web/

RUN bun install --frozen-lockfile

COPY apps/web ./apps/web

WORKDIR /app/apps/web
ENV NODE_ENV=production
ENV DOCKER=true
RUN bun run build

# Stage 2: Production runner
FROM node:22-alpine AS runner
WORKDIR /app

COPY --from=builder /app/apps/web/build ./build
COPY --from=builder /app/apps/web/package.json ./package.json

ENV PORT=3000
ENV HOST=0.0.0.0
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "build/index.js"]

