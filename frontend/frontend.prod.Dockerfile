FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY tailwind.config.js ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx:stable-alpine

RUN adduser -S nginxuser -G nginx

COPY --from=builder /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chown -R nginxuser:nginx /usr/share/nginx/html && \
    chown -R nginxuser:nginx /var/cache/nginx && \
    chown -R nginxuser:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginxuser:nginx /var/run/nginx.pid

USER nginxuser

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]