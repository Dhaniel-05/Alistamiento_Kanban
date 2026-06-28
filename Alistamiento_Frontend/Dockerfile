# syntax=docker/dockerfile:1

# Stage 1: install all dependencies (Vite lives in devDependencies)
FROM node:lts-bookworm-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci && npm cache clean --force

# Stage 2: Vite production build (VITE_API_URL baked into static assets)
FROM node:lts-bookworm-slim AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Stage 3: serve static files with nginx
FROM nginx:1.27-alpine AS prod

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
