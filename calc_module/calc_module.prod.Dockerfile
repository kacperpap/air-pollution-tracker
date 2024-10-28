FROM python:3.11-slim

RUN addgroup --system appgroup && adduser --system appuser --ingroup appgroup

WORKDIR /app

COPY --chown=appuser:appgroup requirements.txt .

RUN pip install --upgrade pip && \
    pip install --no-cache-dir wheel && \
    pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt && \
    chown -R appuser:appgroup /app

USER appuser

ENV PYTHONPATH="/app:${PYTHONPATH}"

COPY --chown=appuser:appgroup . .

CMD ["python", "./main.py"]
