# BalanceVault frontend: build the React app, then serve the static files with nginx.
#
#   docker build -t balancevault-frontend --build-arg VITE_API_URL=http://localhost:8000 .
#   docker run -d -p 5173:8080 --name balancevault-frontend balancevault-frontend
#
# VITE_API_URL is baked into the JavaScript at BUILD time (Vite replaces it during the build),
# so rebuild the image whenever the backend URL changes.

# ---------- Stage 1: build ----------
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# ---------- Stage 2: serve ----------
# Unprivileged nginx image: runs as a non-root user and listens on 8080.
FROM nginxinc/nginx-unprivileged:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/ || exit 1
