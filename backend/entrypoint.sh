#!/bin/sh
set -e

echo "[ENTRYPOINT] Waiting for database to be ready..."

if [ -n "$DATABASE_URL" ]; then
  DB_HOST=$(node -e "try { const u = new URL(process.env.DATABASE_URL); process.stdout.write(u.hostname) } catch (e) { process.exit(1) }")
  DB_PORT=$(node -e "try { const u = new URL(process.env.DATABASE_URL); process.stdout.write(u.port || '5432') } catch (e) { process.exit(1) }")

  until nc -z "$DB_HOST" "$DB_PORT"; do
    echo "[ENTRYPOINT] Database is unavailable - sleeping"
    sleep 1
  done
fi

echo "[ENTRYPOINT] Database is up - running migrations"
npx prisma migrate deploy

if [ "$RUN_SEED" = "true" ]; then
  echo "[ENTRYPOINT] Running database seed"
  npx prisma db seed
fi

echo "[ENTRYPOINT] Starting application"
exec "$@"