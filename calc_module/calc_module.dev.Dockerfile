FROM python:3.11-slim

RUN addgroup --system appgroup && adduser --system appuser --ingroup appgroup

WORKDIR /app

COPY --chown=appuser:appgroup ./calc_module/requirements.txt .

RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    mkdir -p /tmp/matplotlib && \
    chown -R appuser:appgroup /app /tmp/matplotlib

USER appuser

ENV PYTHONPATH="/app:${PYTHONPATH}"
ENV MPLCONFIGDIR=/tmp/matplotlib

COPY --chown=appuser:appgroup ./calc_module/ .

CMD ["python", "./main.py"]


