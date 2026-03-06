from fastapi import FastAPI
import joblib
import pandas as pd
import numpy as np
import os

# start API
app = FastAPI()


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "smartq_model.pkl")

pipeline = joblib.load(MODEL_PATH)

# age mapping
age_map = {
    "Child (0-17)": 10,
    "Adult (18-40)": 30,
    "Middle-aged (41-60)": 50,
    "Senior (61+)": 70
}


# ======================================
# HEALTH CHECK
# ======================================

@app.get("/")
def home():
    return {"message": "SmartQ ML API Running"}


# ======================================
# MAIN PREDICTION ENDPOINT
# ======================================

@app.post("/predict")
def predict(data: dict):

    df = pd.DataFrame([data])

    # feature engineering
    df["AgeNumeric"] = df["AgeGroup"].map(age_map).fillna(30)

    df["ArrivalHour_sin"] = np.sin(2*np.pi*df["ArrivalHour"]/24)
    df["ArrivalHour_cos"] = np.cos(2*np.pi*df["ArrivalHour"]/24)

    df["LoadImpact"] = df["FacilityOccupancyRate"] * (1 - df["StaffToPatientRatio"])

    prediction = pipeline.predict(df)[0]

    return {
        "predicted_time_minutes": round(float(prediction),2)
    }