# ---------- build stage ----------
FROM node:20-slim AS builder
WORKDIR /app

COPY package.json bun.lock ./
RUN npm install --legacy-peer-deps

COPY . .

# prisma generate needs DATABASE_URL to be set (value doesn't matter at build time)
ENV DATABASE_URL=file:/tmp/build.db
RUN npx prisma generate

# standalone production build (copies static + public per package.json build script)
RUN npm run build

# ---------- runtime stage ----------
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# persistent SQLite location (mount a volume here!)
ENV DATABASE_URL=file:/app/db/custom.db

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl curl \
 && rm -rf /var/lib/apt/lists/*

# copy the standalone server
COPY --from=builder /app/.next/standalone ./

# prisma client (generated) + CLI (needed for db push at startup) + engine lib
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# schema + seed script
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

# bun runtime (used by seed script)
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# SQLite lives here — mount a persistent volume on this path
RUN mkdir -p /app/db
VOLUME /app/db

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD curl -fsS http://127.0.0.1:${PORT}/api/online || exit 1

CMD ["sh", "/app/docker-entrypoint.sh"]
