FROM node:current-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:current-alpine
WORKDIR /app
RUN addgroup -S pin && adduser -S pin -G pin
COPY --from=builder --chown=pin:pin /app/dist ./dist
COPY --from=builder --chown=pin:pin /app/node_modules ./node_modules
COPY --from=builder --chown=pin:pin /app/package.json ./
COPY --from=builder --chown=pin:pin /app/src/server ./src/server
USER pin
EXPOSE 3000
ENV PORT=3000
CMD ["npx", "tsx", "src/server/index.ts"]
