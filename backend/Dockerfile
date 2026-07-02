# ---------- Builder stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./

# Full install only in builder
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma
COPY . .

RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Remove dev dependencies from node_modules
RUN npm prune --omit=dev

# Add Prisma CLI back for runtime migrations (small, explicit install)
RUN npm install prisma@6.19.2 --no-save --ignore-scripts

# ---------- Runtime stage ----------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache openssl libc6-compat netcat-openbsd

# Copy only what the app needs at runtime
COPY --from=builder /app ./

RUN chmod +x entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server.js"]