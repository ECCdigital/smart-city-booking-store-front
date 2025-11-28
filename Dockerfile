# 1) Dependencies
FROM node:20-slim AS deps
WORKDIR /app

# Optional: make install a bit quieter and deterministic
ENV NODE_ENV=development

# libc already glibc-based here, no musl issues
COPY package*.json ./

# Avoid postinstall (nuxt prepare) here
RUN npm ci --ignore-scripts \
  && npm install --no-save \
    @oxc-parser/binding-linux-x64-musl@0.94.0 \
    @oxc-minify/binding-linux-x64-musl@0.94.0 \
    @oxc-transform/binding-linux-x64-musl@0.94.0

# 2) Build
FROM node:20-slim AS builder
WORKDIR /app
ENV NITRO_PRESET=node-server

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# If you want to be explicit:
# RUN npx nuxt prepare && npm run build
RUN npm run build

# 3) Runtime
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NITRO_PRESET=node-server
ENV PORT=3000

# Non-root user
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -M nuxt

COPY --from=builder /app/package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.output ./.output

USER 1001
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]