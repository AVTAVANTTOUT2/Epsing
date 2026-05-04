# Stage 1: deps
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat python3 make g++
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: builder
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat python3 make g++
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG JWT_SECRET
ARG EPSI_REGISTRATION_CODE
ARG DATABASE_PATH=/app/data/epsing.db
ARG NEXT_PUBLIC_APP_NAME=Epsing

ENV JWT_SECRET=$JWT_SECRET
ENV EPSI_REGISTRATION_CODE=$EPSI_REGISTRATION_CODE
ENV DATABASE_PATH=$DATABASE_PATH
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NODE_ENV=production

RUN mkdir -p data
RUN npm run build

# Stage 3: runner
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Native modules
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

# Data volume
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data
VOLUME ["/app/data"]

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
