# Production image (Phase 4, D22): the compiled API serves the built client, so one container runs
# the whole site. Any host that builds a Dockerfile can run it; docs/deployment.md has the Railway
# runbook. Secrets come from the host's variables at run time, never from this file.

FROM node:24.19.0-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Vite public variables are fixed at build time. They are never secrets.
ARG VITE_API_MODE=http
ARG VITE_API_BASE_URL=/api
ARG VITE_WHATSAPP_NUMBER=
ENV VITE_API_MODE=$VITE_API_MODE \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_WHATSAPP_NUMBER=$VITE_WHATSAPP_NUMBER
RUN npm run build && npm prune --omit=dev

FROM node:24.19.0-bookworm-slim
# Runs as root on purpose: Railway mounts volumes owned by root, and the private upload folder
# (UPLOAD_DIR) lives on that volume. Switch to `USER node` only on a host that mounts it writable.
WORKDIR /app
ENV NODE_ENV=production \
    CLIENT_DIST_DIR=/app/dist/client
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 4000
CMD ["node", "dist/server/server/src/index.js"]
