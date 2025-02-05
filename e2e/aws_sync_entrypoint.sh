#!/bin/sh
set -e

echo "Oczekuję na pojawienie się wyników testów w katalogu /app/cypress/videos..."
max_attempts=30
attempt=0

while true; do
  all_ready=true

  for d in /app/cypress/videos/*/; do
    if [ ! -d "$d" ]; then
      continue
    fi

    file_found=false
    for f in "$d"*; do
      if [ -f "$f" ] && [ -s "$f" ]; then
        file_found=true
        break
      fi
    done

    if [ "$file_found" = false ]; then
      echo "W katalogu $d nie znaleziono pliku lub plik ma zerowy rozmiar."
      all_ready=false
      break
    fi
  done

  if [ "$all_ready" = true ]; then
    echo "Wszystkie podkatalogi zawierają pliki – wyniki testów są gotowe."
    break
  fi

  attempt=$((attempt+1))
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "Timeout oczekiwania na wyniki testów."
    exit 1
  fi

  echo "Jeszcze nie wszystkie wyniki są dostępne. Próba $attempt/$max_attempts – czekam 10 sekund..."
  sleep 10
done

echo "Synchronizuję wyniki testów do S3..."
aws s3 sync /app/cypress/videos s3://$S3_BUCKET
echo "Synchronizacja zakończona."
