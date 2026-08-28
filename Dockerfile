# Stage 1: Build Frontend
FROM node:22-alpine AS client-builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json ./client/
RUN npm ci --workspace=client
COPY client/ ./client/
RUN npm run build:client

# Stage 2: Build Backend
FROM node:22-alpine AS server-builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json ./server/
RUN npm ci --workspace=server
COPY server/ ./server/
RUN npm run build:server

# Stage 3: Production Runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV VAULT_PATH=/vault

# Copy package descriptors for workspaces
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy compiled assets from build stages
COPY --from=client-builder /app/client/dist ./client/dist
COPY --from=server-builder /app/server/dist ./server/dist

VOLUME /vault
EXPOSE 3000

CMD ["node", "server/dist/index.js"]
