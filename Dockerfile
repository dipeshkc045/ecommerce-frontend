# ─── Stage 1: Build ─────────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─── Stage 2: Production Server ─────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0

COPY --from=build /app/dist/ecommerce-web ./dist/ecommerce-web
COPY package.json package-lock.json ./

RUN npm ci --omit=dev && npm cache clean --force

EXPOSE 3000

CMD ["node", "dist/ecommerce-web/server/server.mjs"]