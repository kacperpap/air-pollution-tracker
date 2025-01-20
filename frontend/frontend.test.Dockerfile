FROM node:20-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

RUN mkdir -p /app/node_modules && chown -R appuser:appgroup /app

USER appuser

COPY --chown=appuser:appgroup ./frontend/package*.json ./
COPY --chown=appuser:appgroup ./frontend/tsconfig.json ./
COPY --chown=appuser:appgroup ./frontend/tailwind.config.js ./

RUN npm install

COPY --chown=appuser:appgroup ./frontend/ .

EXPOSE 3000

CMD ["npm", "start"]