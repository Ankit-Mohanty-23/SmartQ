# ── Stage 1: builder ──────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /install
COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install --prefix=/install --no-cache-dir -r requirements.txt

# ── Stage 2: runtime ──────────────────────────────
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY --from=builder /install /usr/local
COPY smartq-inference.py .
COPY smartq_xgb.onnx .        

EXPOSE 8000
CMD ["uvicorn", "smartq-inference:app", "--host", "0.0.0.0", "--port", "8000"]