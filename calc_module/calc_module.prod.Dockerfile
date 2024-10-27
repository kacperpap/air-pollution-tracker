FROM python:3.11-slim AS builder

RUN addgroup --system appgroup && adduser --system appuser --ingroup appgroup

WORKDIR /app

RUN python -m venv /app/venv && \
    chown -R appuser:appgroup /app

USER appuser

ENV PATH="/app/venv/bin:$PATH"

COPY --chown=appuser:appgroup requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=appuser:appgroup . .

FROM python:3.11-slim

RUN addgroup --system appgroup && adduser --system appuser --ingroup appgroup

WORKDIR /app

RUN python -m venv /app/venv && \
    chown -R appuser:appgroup /app

USER appuser

ENV PATH="/app/venv/bin:$PATH"

COPY --chown=appuser:appgroup --from=builder /app/venv /app/venv
COPY --chown=appuser:appgroup --from=builder /app/main.py /app/

CMD ["python", "./main.py"]