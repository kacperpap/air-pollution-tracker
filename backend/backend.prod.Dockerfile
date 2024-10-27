FROM node:20-alpine AS builder

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

RUN mkdir -p /app/node_modules /app/dist && \
    chown -R appuser:appgroup /app

USER appuser

COPY --chown=appuser:appgroup package*.json ./
COPY --chown=appuser:appgroup prisma ./prisma/
COPY --chown=appuser:appgroup tsconfig*.json ./

RUN npm ci

RUN npx prisma generate

COPY --chown=appuser:appgroup . .

RUN npm run build

FROM node:20-alpine AS production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

RUN mkdir -p /app/node_modules /app/dist && \
    chown -R appuser:appgroup /app

USER appuser

COPY --chown=appuser:appgroup --from=builder /app/package*.json ./
COPY --chown=appuser:appgroup --from=builder /app/dist ./dist
COPY --chown=appuser:appgroup --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN npm ci --only=production

EXPOSE 9000

CMD ["npm", "run", "start:prod"]