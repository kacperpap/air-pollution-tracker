FROM node:20-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /usr/src/app

RUN mkdir -p /usr/src/app/node_modules /usr/src/app/dist && \
    chown -R appuser:appgroup /usr/src/app

USER appuser

COPY --chown=appuser:appgroup package*.json ./
COPY --chown=appuser:appgroup prisma ./prisma/
COPY --chown=appuser:appgroup tsconfig*.json ./

RUN npm install

RUN npx prisma generate

COPY --chown=appuser:appgroup . .

EXPOSE 9000

CMD ["npm", "run", "start:dev"]

