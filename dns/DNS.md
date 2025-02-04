## Budowanie obrazu
Z poziomu katalagu `\dns` wywołujemy polecenie:
```
docker build -f certbot.Dockerfile -t certbot-duckdns .
```

## Generowanie nowego certyfikatu
Przed wykonaniem tego dodaj katalo w którym zapiszą się certyfiakty:
```
mkdir .\certs
```

Certbot z wtyczką DuckDNS automatycznie dodaje rekord TXT w DuckDNS i przeprowadza weryfikację.
```
docker run --rm `
  --env-file .env `
  -v ${PWD}/certs:/etc/letsencrypt `
  certbot-duckdns generate
```
**Zmienne EMAIL, DUCKDNS_TOKEN i DOMAIN umieszczamy w pliku .env lub podajemy jako zmienne -e w poleceniu docker run**

## Odnowa certyfiaktu
```
docker run -it --rm `
  --env-file .env `
  -v ${PWD}/certs:/etc/letsencrypt `
  certbot-duckdns renew
```