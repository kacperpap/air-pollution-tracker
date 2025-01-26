FROM python:3.9-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    certbot \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN pip install certbot-dns-duckdns

RUN mkdir -p /etc/letsencrypt/secrets
RUN chmod 700 /etc/letsencrypt/secrets

WORKDIR /app

COPY generate_cert.sh /app/generate_cert.sh

RUN chmod +x /app/generate_cert.sh

ENTRYPOINT ["/app/generate_cert.sh"]
