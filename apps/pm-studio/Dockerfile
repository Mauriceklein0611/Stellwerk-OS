# syntax=docker/dockerfile:1
#
# PM Studio (Next.js 16, standalone output) – Multi-Stage-Build.
# Build-Kontext ist das Repo-ROOT (npm-Workspaces müssen aufgelöst werden):
#   docker build -f apps/pm-studio/Dockerfile .
# Das Compose-Profil `pms` setzt den Kontext entsprechend.

# ---------- deps ----------
FROM node:22-bookworm-slim AS deps
WORKDIR /app
# Nur Manifeste + Lock: reproduzierbarer, gecachter Install-Layer.
COPY package.json package-lock.json ./
COPY apps/pm-studio/package.json apps/pm-studio/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN npm ci

# ---------- build ----------
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build -w @stellwerk/pm-studio

# ---------- runner ----------
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# Non-root.
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

# Standalone-Output behält das Monorepo-Layout (apps/pm-studio/server.js).
COPY --from=build --chown=nextjs:nodejs /app/apps/pm-studio/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/pm-studio/.next/static ./apps/pm-studio/.next/static
COPY --from=build --chown=nextjs:nodejs /app/apps/pm-studio/public ./apps/pm-studio/public

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["node", "apps/pm-studio/server.js"]
