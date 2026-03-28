from fastapi import FastAPI, HTTPException
import joblib
import pandas as pd
import numpy as np
import os
import traceback

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH      = os.path.join(BASE_DIR, "smartq_model1_xgboost.pkl")
FEATURES_PATH   = os.path.join(BASE_DIR, "smartq_model1_features.pkl")
CATEGORICAL_PATH= os.path.join(BASE_DIR, "smartq_model1_categorical.pkl")
Q05_PATH        = os.path.join(BASE_DIR, "smartq_model1_q05.pkl")
Q95_PATH        = os.path.join(BASE_DIR, "smartq_model1_q95.pkl")
NAIVE_BAND_PATH = os.path.join(BASE_DIR, "smartq_model1_naive_band.pkl")

pipeline        = None
q05_pipeline    = None
q95_pipeline    = None
expected_features = None
categorical_features = None
naive_band      = None


@app.on_event("startup")
def load_model():
    global pipeline, q05_pipeline, q95_pipeline
    global expected_features, categorical_features, naive_band

    try:
        print("Loading models...")

        for path in [MODEL_PATH, FEATURES_PATH, CATEGORICAL_PATH,
                     Q05_PATH, Q95_PATH, NAIVE_BAND_PATH]:
            if not os.path.exists(path):
                raise FileNotFoundError(f"Required file not found: {path}")

        pipeline             = joblib.load(MODEL_PATH)
        expected_features    = joblib.load(FEATURES_PATH)
        categorical_features = joblib.load(CATEGORICAL_PATH)
        q05_pipeline         = joblib.load(Q05_PATH)
        q95_pipeline         = joblib.load(Q95_PATH)
        naive_band           = joblib.load(NAIVE_BAND_PATH)

        print("All models loaded successfully")
        print(f"  Features   : {len(expected_features)}")
        print(f"  Naive band : {naive_band:.4f} mins")

    except Exception as e:
        print("Model loading failed:")
        traceback.print_exc()
        pipeline = q05_pipeline = q95_pipeline = None


@app.get("/")
def home():
    return {"message": "SmartQ ML API Running 🚀"}


@app.get("/health")
def health():
    all_loaded = all([pipeline, q05_pipeline, q95_pipeline])
    return {
        "status": "healthy" if all_loaded else "unhealthy",
        "model1_version": "model1_v4_synthea",
        "model1_mae": None,
    }


@app.post("/predict/duration")
def predict_duration(data: dict):
    if pipeline is None:
        raise HTTPException(status_code=500, detail="Model not loaded")

    try:
        # Validate all required features are present
        missing = [f for f in expected_features if f not in data]
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Missing features: {missing}"
            )

        row = pd.DataFrame([data])[expected_features]
        row[categorical_features] = row[categorical_features].fillna("Missing").astype(str)

        mean_pred = float(pipeline.predict(row)[0])
        lower     = float(q05_pipeline.predict(row)[0])
        upper     = float(q95_pipeline.predict(row)[0])

        # Guard: lower <= mean <= upper
        lower = max(0.0, min(lower, mean_pred))
        upper = max(upper, mean_pred)

        ci_width         = upper - lower
        confidence_score = float(np.clip(1.0 - (ci_width / naive_band), 0.0, 1.0))

        return {
            "predicted_minutes": round(mean_pred, 2),
            "lower_band":        round(lower, 2),
            "upper_band":        round(upper, 2),
            "confidence_score":  round(confidence_score, 4),
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Prediction failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=7860)