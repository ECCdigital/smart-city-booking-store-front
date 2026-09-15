# 1) Dependencies
FROM node:22-slim AS deps
WORKDIR /app

# Make install deterministic
ENV NODE_ENV=development

COPY package*.json ./

# Avoid running postinstall (nuxt prepare) here
RUN npm ci --ignore-scripts

# 2) Build
FROM node:22-slim AS builder
WORKDIR /app
ENV NITRO_PRESET=node-server

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Nuxt build will run prepare as needed
RUN npm run build

# 3) Runtime
FROM node:22-slim AS runner
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