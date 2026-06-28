# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage: deps — dependencias Node (npm ci) y Python (pip + pdfplumber)
# ---------------------------------------------------------------------------
FROM node:lts-bookworm-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev && npm cache clean --force

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip \
  && rm -rf /var/lib/apt/lists/*

COPY Python/requirements.txt ./Python/requirements.txt

RUN pip3 install --no-cache-dir -r Python/requirements.txt --break-system-packages \
  && python3 -c "import pdfplumber"

# ---------------------------------------------------------------------------
# Stage: production — Node LTS + python3 del sistema con pdfplumber
# ---------------------------------------------------------------------------
FROM node:lts-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --gid 1001 nodejs \
  && useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nodejs

# Paquetes Python instalados en deps (pdfplumber y dependencias)
COPY --from=deps /usr/local/lib/python3.11/dist-packages /usr/local/lib/python3.11/dist-packages

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json server.js ./
COPY src ./src
COPY Python ./Python

# Falla el build si pdfplumber no está disponible para python3
RUN python3 -c "import pdfplumber" \
  && mkdir -p uploads \
  && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

CMD ["node", "server.js"]
