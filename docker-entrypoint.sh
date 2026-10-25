#!/bin/sh
set -e

echo "==> Applying database schema (Prisma db push)..."
node node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss

echo "==> Seeding demo users (if empty)..."
bun scripts/seed-demo.ts || echo "(seed skipped)"

echo "==> Starting server on port ${PORT:-3000}..."
exec node server.js
