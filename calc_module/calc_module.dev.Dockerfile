FROM python:3.11-slim

RUN addgroup --system appgroup && adduser --system appuser --ingroup appgroup

WORKDIR /app

COPY requirements.txt .

RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    chown -R appuser:appgroup /app

USER appuser

ENV PYTHONPATH="/app:${PYTHONPATH}"

COPY --chown=appuser:appgroup . .

CMD ["python", "./main.py"]


