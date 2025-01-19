FROM node:20-alpine

RUN apk add --no-cache openssl postgresql-client

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

RUN mkdir -p /app/node_modules /app/dist && \
    chown -R appuser:appgroup /app

USER appuser

COPY --chown=appuser:appgroup ./backend/package*.json ./
COPY --chown=appuser:appgroup ./backend/prisma ./prisma/
COPY --chown=appuser:appgroup ./backend/tsconfig*.json ./

RUN npm install

RUN npx prisma generate

COPY --chown=appuser:appgroup ./backend/ .

EXPOSE 9000

CMD ["npm", "run", "start:dev"]

