# Stage 1: Build frontend and backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build client and server
RUN npm run build

# Stage 2: Production runtime image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV VAULT_PATH=/vault

# Copy root and server manifests
COPY package.json package-lock.json ./
COPY server/package.json ./server/

# Install production dependencies only for server workspace
RUN npm ci --omit=dev --workspace=server

# Copy compiled artifacts
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/sample-vault ./sample-vault

# Vault storage mount point
VOLUME ["/vault"]

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=server"]
