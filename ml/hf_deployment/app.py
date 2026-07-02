import os
import numpy as np
import librosa
import joblib
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel, Field
import uvicorn
import shutil

app = FastAPI(title="Speech Confidence & Anxiety Classifier API")

BASE_DIR = os.path.dirname(__file__)

# --- Model A: RAVDESS Noisy ---
SCALER_A_PATH = os.path.join(BASE_DIR, "scaler_noisy.pkl")
MODEL_A_PATH = os.path.join(BASE_DIR, "speech_confidence_rf_noisy.pkl")

# --- Model B: Combined Set 4 ---
SCALER_B_PATH = os.path.join(BASE_DIR, "scaler_set4.pkl")
MODEL_B_PATH = os.path.join(BASE_DIR, "rf_set4.pkl")

# --- Model C: Placement Predictor ---
SCALER_PLACEMENT_PATH = os.path.join(BASE_DIR, "placement_scaler.pkl")
MODEL_PLACEMENT_PATH = os.path.join(BASE_DIR, "placement_predictor.pkl")

# Verify all assets exist on startup
assets = [SCALER_A_PATH, MODEL_A_PATH, SCALER_B_PATH, MODEL_B_PATH, SCALER_PLACEMENT_PATH, MODEL_PLACEMENT_PATH]
for path in assets:
    if not os.path.exists(path):
        raise RuntimeError(f"Required model asset not found: {path}")

# Load models and scalers
scaler_a = joblib.load(SCALER_A_PATH)
model_a = joblib.load(MODEL_A_PATH)

scaler_b = joblib.load(SCALER_B_PATH)
model_b = joblib.load(MODEL_B_PATH)

scaler_placement = joblib.load(SCALER_PLACEMENT_PATH)
model_placement = joblib.load(MODEL_PLACEMENT_PATH)

def extract_features(file_path):
    """
    Extracts the identical 43 features used during training.
    """
    try:
        y, sr = librosa.load(file_path, sr=16000)
        
        # 1. MFCCs
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20)
        mfccs_mean = np.mean(mfccs, axis=1)
        
        # 2. ZCR
        zcr = librosa.feature.zero_crossing_rate(y)
        zcr_mean = np.mean(zcr)
        
        # 3. RMS Energy (Volume)
        rms = librosa.feature.rms(y=y)
        rms_mean = np.mean(rms)
        
        # 4. Silence Ratio (Hesitation Index)
        threshold = 0.1 * np.std(rms)
        silent_frames = np.sum(rms < threshold)
        silence_ratio = float(silent_frames / len(rms[0])) if len(rms[0]) > 0 else 0.0
        
        # 5. Pitch Stability (Variance only)
        pitches = librosa.yin(y=y, sr=sr, fmin=75, fmax=400)
        pitches = np.nan_to_num(pitches, nan=0.0)
        pitch_var = np.var(pitches)
        
        # 6. Chroma
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        chroma_mean = np.mean(chroma, axis=1)
        
        # 7. Spectral Contrast
        contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
        contrast_mean = np.mean(contrast, axis=1)
        
        # 8. Spectral Rolloff
        rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)
        rolloff_mean = np.mean(rolloff)
        
        features = np.hstack([
            mfccs_mean,
            zcr_mean,
            rms_mean,
            pitch_var,
            chroma_mean,
            contrast_mean,
            rolloff_mean
        ])
        
        # Clean NaNs
        features = np.nan_to_num(features, nan=0.0, posinf=0.0, neginf=0.0)
        
        return features, silence_ratio, pitch_var
    except Exception as e:
        print(f"Feature extraction error: {e}")
        return None, 0.0, 0.0

@app.get("/")
def read_root():
    return {"status": "running", "message": "Speech Confidence Dual Classifier API is online!"}

@app.post("/predict")
async def predict_speech(file: UploadFile = File(...)):
    # Create a temporary file to save the uploaded audio
    temp_file_path = f"temp_{file.filename}"
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # Extract features and custom metrics
        features, silence_ratio, pitch_var = extract_features(temp_file_path)
        if features is None:
            raise HTTPException(status_code=400, detail="Could not extract features from audio file.")
            
        # --- Model A: RAVDESS Noisy Prediction ---
        features_scaled_a = scaler_a.transform(features.reshape(1, -1))
        probs_a = model_a.predict_proba(features_scaled_a)[0]
        anxious_prob_a = float(probs_a[0])
        confident_prob_a = float(probs_a[1])
        
        # Calibrate Model A 3-Tier Mapping
        if confident_prob_a >= 0.60:
            speaking_state_a = "High Confidence"
        elif confident_prob_a >= 0.45:
            speaking_state_a = "Calm & Steady"
        else:
            speaking_state_a = "Hesitant / Anxious"
            
        # --- Model B: Combined Set 4 Prediction ---
        features_scaled_b = scaler_b.transform(features.reshape(1, -1))
        probs_b = model_b.predict_proba(features_scaled_b)[0]
        anxious_prob_b = float(probs_b[0])
        confident_prob_b = float(probs_b[1])
        
        # Calibrate Model B 3-Tier Mapping
        if confident_prob_b >= 0.60:
            speaking_state_b = "High Confidence"
        elif confident_prob_b >= 0.45:
            speaking_state_b = "Calm & Steady"
        else:
            speaking_state_b = "Hesitant / Anxious"
            
        # --- Ensemble Average ---
        avg_confident_prob = (confident_prob_a + confident_prob_b) / 2.0
        avg_anxious_prob = (anxious_prob_a + anxious_prob_b) / 2.0
        
        if avg_confident_prob >= 0.60:
            speaking_state_avg = "High Confidence"
        elif avg_confident_prob >= 0.45:
            speaking_state_avg = "Calm & Steady"
        else:
            speaking_state_avg = "Hesitant / Anxious"

        # Pitch Stability evaluation label
        pitch_stability = "Stable"
        if pitch_var > 5000:
            pitch_stability = "Trembling/Unstable"
        elif pitch_var > 2000:
            pitch_stability = "Slightly Shaky"
            
        return {
            "prediction_rav_noisy": {
                "speaking_state": speaking_state_a,
                "confidence_score": confident_prob_a * 100,
                "anxious_score": anxious_prob_a * 100
            },
            "prediction_comb_set4": {
                "speaking_state": speaking_state_b,
                "confidence_score": confident_prob_b * 100,
                "anxious_score": anxious_prob_b * 100
            },
            "ensemble_average": {
                "speaking_state": speaking_state_avg,
                "confidence_score": avg_confident_prob * 100,
                "anxious_score": avg_anxious_prob * 100
            },
            "custom_metrics": {
                "silence_ratio": silence_ratio,
                "hesitation_index_pct": silence_ratio * 100,
                "pitch_variance": float(pitch_var),
                "pitch_stability": pitch_stability
            }
        }
        
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

class PlacementInput(BaseModel):
    resume_score: float = Field(..., ge=0, le=100)
    dsa_score: float = Field(..., ge=0, le=100)
    communication_score: float = Field(..., ge=0, le=100)
    subject_score: float = Field(..., ge=0, le=100)
    practice_volume: float = Field(..., ge=0, le=20)

@app.post("/predict-placement")
def predict_placement(data: PlacementInput):
    try:
        # Prepare inputs list
        features = np.array([[
            data.resume_score,
            data.dsa_score,
            data.communication_score,
            data.subject_score,
            data.practice_volume
        ]])
        
        # Scale
        scaled_features = scaler_placement.transform(features)
        
        # Predict probability of placement (class 1)
        prob = model_placement.predict_proba(scaled_features)[0][1]
        prob_pct = float(prob * 100)
        
        # Determine tier
        if prob_pct >= 75:
            tier = "Ready"
            color = "green"
        elif prob_pct >= 50:
            tier = "Improving"
            color = "orange"
        else:
            tier = "Needs Focus"
            color = "red"
            
        # Bottleneck calculation
        scores = {
            "Resume Quality": data.resume_score,
            "DSA & Coding Skills": data.dsa_score,
            "Communication & Speech": data.communication_score,
            "Core CS Knowledge": data.subject_score,
            "Practice Volume": (data.practice_volume / 20.0) * 100
        }
        
        lowest_feature = min(scores, key=scores.get)
        
        recommendations = {
            "Resume Quality": "Your resume matching score is low. Try adding key SDE technologies to your resume and re-uploading.",
            "DSA & Coding Skills": "Your technical coding score is your primary bottleneck. Practice resolving logic challenges under time constraints.",
            "Communication & Speech": "Your speaking confidence and pacing need improvement. Record voice responses and check your pacing speed.",
            "Core CS Knowledge": "Your DBMS, OS, or Networks concepts scored low. Re-verify basic database/infrastructure theory.",
            "Practice Volume": "Your total mock practice volume is low. Finish 2-3 more mock interview sessions to boost your confidence."
        }
        
        return {
            "placement_probability": round(prob_pct, 1),
            "tier": tier,
            "color": color,
            "bottleneck": lowest_feature,
            "recommendation": recommendations[lowest_feature],
            "feature_importances": {
                "resume": float(model_placement.feature_importances_[0] * 100),
                "dsa": float(model_placement.feature_importances_[1] * 100),
                "communication": float(model_placement.feature_importances_[2] * 100),
                "subjects": float(model_placement.feature_importances_[3] * 100),
                "practice": float(model_placement.feature_importances_[4] * 100)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Predict placement error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
