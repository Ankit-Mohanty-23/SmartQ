FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# copy ONLY required files
COPY main.py .
COPY smartq_model1_xgboost.pkl .
COPY smartq_model1_features.pkl .

CMD ["python", "main.py"]