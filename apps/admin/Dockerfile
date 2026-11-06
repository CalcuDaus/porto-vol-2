# Stage 1: Build application
FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY package.json bun.lock ./
COPY scripts ./scripts
COPY apps/admin/package.json ./apps/admin/

RUN bun install --frozen-lockfile

COPY apps/admin ./apps/admin

WORKDIR /app/apps/admin
ENV NODE_ENV=production
ENV DOCKER=true
RUN bun run build

# Stage 2: Production runner
FROM node:22-alpine AS runner
WORKDIR /app

COPY --from=builder /app/apps/admin/build ./build
COPY --from=builder /app/apps/admin/package.json ./package.json

ENV PORT=3001
ENV HOST=0.0.0.0
ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "build/index.js"]

