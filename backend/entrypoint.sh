#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

echo "[ENTRYPOINT] Waiting for database to be ready..."

# Wait for postgres to be available
# We use the DATABASE_URL environment variable to extract the host and port
# However, a simpler way in Docker is to just try connecting with pg_isready if installed, 
# or use a simple loop with nc (netcat) which is usually in alpine.
until nc -z db 5432; do
  echo "[ENTRYPOINT] Database is unavailable - sleeping"
  sleep 1
done

echo "[ENTRYPOINT] Database is up - executing migrations"

# Run Prisma migrations
# 'migrate deploy' is best for production-like environments if migrations exist
# 'migrate dev' is better for development if we want to also sync schema changes
if [ "$NODE_ENV" = "development" ]; then
  echo "[ENTRYPOINT] Running prisma db push"
  npx prisma db push --skip-generate --accept-data-loss
else
  echo "[ENTRYPOINT] Running prisma migrate deploy"
  npx prisma migrate deploy
fi

echo "[ENTRYPOINT] Running database seed"
npx prisma db seed

echo "[ENTRYPOINT] Migrations and seeding completed - starting application"

# Execute the main command (CMD from Dockerfile)
exec "$@"
