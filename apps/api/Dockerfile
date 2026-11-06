FROM oven/bun:1-alpine AS runner
WORKDIR /app

# Copy package manifests for workspace
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code and default data
COPY apps/api ./apps/api

WORKDIR /app/apps/api

ENV PORT=3002
ENV NODE_ENV=production

EXPOSE 3002

CMD ["bun", "src/index.ts"]

