FROM node:20-alpine

RUN apk add --no-cache openssl postgresql-client

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

RUN mkdir -p /app/node_modules /app/dist && \
    chown -R appuser:appgroup /app

USER appuser

COPY --chown=appuser:appgroup package*.json ./
COPY --chown=appuser:appgroup prisma ./prisma/
COPY --chown=appuser:appgroup tsconfig*.json ./

RUN npm install

RUN npx prisma generate

COPY --chown=appuser:appgroup . .

EXPOSE 9000

CMD ["npm", "run", "start:dev"]

