# syntax=docker/dockerfile:1

# ---- dependencies (production only) ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ---- runtime ----
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Run as an unprivileged user, never root.
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

USER nodejs
EXPOSE 8000

# Container-level liveness check hitting the app's /health endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||8000)+'/health',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# The API server. The queue worker overrides this via `command:` in compose.
CMD ["node", "src/app.js"]
