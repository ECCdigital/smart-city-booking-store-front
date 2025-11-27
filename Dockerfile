# 1) Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache \
  libc6-compat \
  python3 \
  make \
  g++

COPY package.json ./

RUN npm install

# 2) Build
FROM node:20-alpine AS builder
WORKDIR /app
ENV NITRO_PRESET=node-server

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# vorsichtshalber Lockfiles entfernen, falls im Repo
RUN rm -f package-lock.json pnpm-lock.yaml yarn.lock || true

RUN npm run build

RUN npm prune --omit=dev

# 3) Runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NITRO_PRESET=node-server
ENV PORT=3000

RUN addgroup -g 1001 -S nodejs && adduser -S nuxt -u 1001

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./


USER 1001
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]