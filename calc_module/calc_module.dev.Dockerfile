FROM python:3.11-slim

RUN addgroup --system appgroup && adduser --system appuser --ingroup appgroup

WORKDIR /app

RUN python -m venv /app/venv && \
    chown -R appuser:appgroup /app

USER appuser

ENV PATH="/app/venv/bin:$PATH"

COPY --chown=appuser:appgroup requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=appuser:appgroup . .

CMD ["python", "./main.py"]
