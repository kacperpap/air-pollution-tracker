#!/bin/bash

if [ -z "$DUCKDNS_TOKEN" ] || [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Error: DUCKDNS_TOKEN, DOMAIN, and EMAIL environment variables must be set."
  exit 1
fi

CREDENTIALS_FILE="/etc/letsencrypt/secrets/duckdns"
if [ ! -f $CREDENTIALS_FILE ]; then
  mkdir -p /etc/letsencrypt/secrets
  echo "dns_duckdns_token=$DUCKDNS_TOKEN" > $CREDENTIALS_FILE
  chmod 600 $CREDENTIALS_FILE
fi

generate_certificate() {
  echo "Generating a new certificate for $DOMAIN..."
  certbot certonly \
    --authenticator dns-duckdns \
    --dns-duckdns-credentials "$CREDENTIALS_FILE" \
    --dns-duckdns-propagation-seconds 30 \
    -d "$DOMAIN" \
    --non-interactive \
    --agree-tos \
    -m "$EMAIL"
}

renew_certificates() {
  echo "Renewing certificates..."
  certbot renew --non-interactive --quiet
}

if [ "$1" == "renew" ]; then
  renew_certificates
elif [ "$1" == "generate" ]; then
  generate_certificate
else
  echo "Usage: $0 [generate|renew]"
  exit 1
fi

if [ $? -eq 0 ]; then
  echo "Operation completed successfully."
else
  echo "Operation failed."
  exit 1
fi