# 1) Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# benötigte Libs für native Module
RUN apk add --no-cache \
  libc6-compat \
  python3 \
  make \
  g++

# nur package.json kopieren, KEIN package-lock.json
COPY package.json ./

# optional: falls du zur Sicherheit trotzdem lockfiles im Repo hast:
# RUN rm -f package-lock.json pnpm-lock.yaml yarn.lock

RUN npm install

# 2) Build
FROM node:20-alpine AS builder
WORKDIR /app
ENV NITRO_PRESET=node-server

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# sicherstellen, dass evtl. vorhandene Lockfiles hier nicht stören
RUN rm -f package-lock.json pnpm-lock.yaml yarn.lock || true

RUN npm run build

# 3) Runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NITRO_PRESET=node-server
ENV PORT=3000

RUN addgroup -g 1001 -S nodejs && adduser -S nuxt -u 1001

COPY --from=builder /app/package.json ./
COPY --from=builder /app/.output ./.output

# Prod-Dependencies für Runtime, auch hier ohne Lockfile
RUN rm -f package-lock.json pnpm-lock.yaml yarn.lock || true \
  && npm install --omit=dev || npm install --only=production || true

USER 1001
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]