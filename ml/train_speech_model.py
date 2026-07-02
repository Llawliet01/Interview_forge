import os
import glob
import numpy as np
import librosa
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score
import joblib
import warnings
warnings.filterwarnings('ignore', category=FutureWarning)

DATA_PATH = os.path.join(os.path.dirname(__file__), "ravdess_data")

def inject_noise(y, noise_factor=0.005):
    """
    Adds random Gaussian noise to the raw audio signal
    to simulate home microphone background static/hum.
    """
    noise = np.random.randn(len(y))
    noisy_y = y + noise_factor * noise
    return noisy_y

def extract_features_from_signal(y, sr):
    """
    Extracts high-fidelity acoustic features (43 features total).
    Cleans all NaN elements to prevent training corruption.
    """
    try:
        # 1. Extract MFCCs
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20)
        mfccs_mean = np.mean(mfccs, axis=1)
        
        # 2. Extract Zero Crossing Rate
        zcr = librosa.feature.zero_crossing_rate(y)
        zcr_mean = np.mean(zcr)
        
        # 3. Extract RMS Energy (Volume)
        rms = librosa.feature.rms(y=y)
        rms_mean = np.mean(rms)
        
        # 4. Extract Pitch Stability (Ignore pitch_mean to prevent gender bias)
        pitches = librosa.yin(y=y, sr=sr, fmin=75, fmax=400)
        pitches = np.nan_to_num(pitches, nan=0.0)
        pitch_var = np.var(pitches)
        
        # 5. Extract Chroma STFT
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        chroma_mean = np.mean(chroma, axis=1)
        
        # 6. Extract Spectral Contrast
        contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
        contrast_mean = np.mean(contrast, axis=1)
        
        # 7. Extract Spectral Rolloff
        rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)
        rolloff_mean = np.mean(rolloff)
        
        # Combine features (Total = 43 features)
        features = np.hstack([
            mfccs_mean,
            zcr_mean,
            rms_mean,
            pitch_var,  # Only variance! No pitch_mean.
            chroma_mean,
            contrast_mean,
            rolloff_mean
        ])
        
        # Safety check: clean any remaining NaNs (e.g. from division by zero in silent clips)
        features = np.nan_to_num(features, nan=0.0, posinf=0.0, neginf=0.0)
        return features
    except Exception as e:
        print(f"Error extracting features: {e}")
        return None

def load_datasets():
    """
    Loads both CLEAN and NOISE-AUGMENTED datasets separately.
    """
    X_clean, y_clean = [], []
    X_noisy, y_noisy = [], []
    
    search_path = os.path.join(DATA_PATH, "Actor_*", "*.wav")
    file_list = glob.glob(search_path)
    
    if len(file_list) == 0:
        print(f"\n[Error] No WAV files found in: {DATA_PATH}")
        return None, None, None, None
        
    print(f"Found {len(file_list)} audio files. Generating Clean & Noisy datasets...")
    
    for i, file_path in enumerate(file_list):
        filename = os.path.basename(file_path)
        parts = filename.split("-")
        emotion = parts[2]
        
        if emotion in ["01", "02", "03"]:
            label = 1
        elif emotion in ["04", "06"]:
            label = 0
        else:
            continue
            
        try:
            # Load original signal
            y_signal, sr = librosa.load(file_path, sr=16000)
            
            # 1. Clean data extraction
            features_clean = extract_features_from_signal(y_signal, sr)
            if features_clean is not None:
                X_clean.append(features_clean)
                y_clean.append(label)
                
                # Copy to noisy dataset
                X_noisy.append(features_clean)
                y_noisy.append(label)
                
            # 2. Noisy data extraction
            noisy_signal = inject_noise(y_signal, noise_factor=0.005)
            features_noisy = extract_features_from_signal(noisy_signal, sr)
            if features_noisy is not None:
                X_noisy.append(features_noisy)
                y_noisy.append(label)
                
        except Exception as e:
            print(f"Error loading {file_path}: {e}")
            
        if (i + 1) % 100 == 0:
            print(f"Processed {i + 1}/{len(file_list)} files...")
            
    return np.array(X_clean), np.array(y_clean), np.array(X_noisy), np.array(y_noisy)

def main():
    print("=== Starting 4-Way Acoustic Model Comparison Training ===")
    
    X_clean, y_clean, X_noisy, y_noisy = load_datasets()
    if X_clean is None or len(X_clean) == 0:
        return
        
    print(f"\n[CLEAN DATASET] Loaded {len(X_clean)} samples. Confident vs. Anxious: {np.bincount(y_clean)}")
    print(f"[NOISY DATASET] Loaded {len(X_noisy)} samples. Confident vs. Anxious: {np.bincount(y_noisy)}")
    
    # Train-Test Splits
    X_train_c, X_test_c, y_train_c, y_test_c = train_test_split(X_clean, y_clean, test_size=0.2, random_state=42, stratify=y_clean)
    X_train_n, X_test_n, y_train_n, y_test_n = train_test_split(X_noisy, y_noisy, test_size=0.2, random_state=42, stratify=y_noisy)
    
    # Fit separate scalers
    scaler_clean = StandardScaler()
    X_train_c_scaled = scaler_clean.fit_transform(X_train_c)
    X_test_c_scaled = scaler_clean.transform(X_test_c)
    
    scaler_noisy = StandardScaler()
    X_train_n_scaled = scaler_noisy.fit_transform(X_train_n)
    X_test_n_scaled = scaler_noisy.transform(X_test_n)
    
    # Grid search configs
    rf_param_grid = {
        'n_estimators': [100, 150, 200],
        'max_depth': [10, 12, None],
        'min_samples_split': [2, 5],
        'max_features': ['sqrt']
    }
    
    svm_param_grid = {
        'C': [0.1, 1, 10, 100],
        'gamma': ['scale', 'auto', 0.01, 0.1],
        'kernel': ['rbf']
    }
    
    # 1. Random Forest - CLEAN DATA
    print("\n[Training 1/4] Random Forest on CLEAN data...")
    rf_c_grid = GridSearchCV(RandomForestClassifier(random_state=42), rf_param_grid, cv=5, n_jobs=-1, scoring='accuracy')
    rf_c_grid.fit(X_train_c_scaled, y_train_c)
    rf_c_acc = accuracy_score(y_test_c, rf_c_grid.best_estimator_.predict(X_test_c_scaled))
    print(f"-> RF (Clean) Best Params: {rf_c_grid.best_params_}")
    print(f"-> RF (Clean) Test Accuracy: {rf_c_acc * 100:.2f}%")
    
    # 2. Random Forest - NOISY DATA
    print("\n[Training 2/4] Random Forest on NOISY (Augmented) data...")
    rf_n_grid = GridSearchCV(RandomForestClassifier(random_state=42), rf_param_grid, cv=5, n_jobs=-1, scoring='accuracy')
    rf_n_grid.fit(X_train_n_scaled, y_train_n)
    rf_n_acc = accuracy_score(y_test_n, rf_n_grid.best_estimator_.predict(X_test_n_scaled))
    print(f"-> RF (Noisy) Best Params: {rf_n_grid.best_params_}")
    print(f"-> RF (Noisy) Test Accuracy: {rf_n_acc * 100:.2f}%")
    
    # 3. SVM - CLEAN DATA
    print("\n[Training 3/4] SVM on CLEAN data...")
    svm_c_grid = GridSearchCV(SVC(probability=True, random_state=42), svm_param_grid, cv=5, n_jobs=-1, scoring='accuracy')
    svm_c_grid.fit(X_train_c_scaled, y_train_c)
    svm_c_acc = accuracy_score(y_test_c, svm_c_grid.best_estimator_.predict(X_test_c_scaled))
    print(f"-> SVM (Clean) Best Params: {svm_c_grid.best_params_}")
    print(f"-> SVM (Clean) Test Accuracy: {svm_c_acc * 100:.2f}%")
    
    # 4. SVM - NOISY DATA
    print("\n[Training 4/4] SVM on NOISY (Augmented) data...")
    svm_n_grid = GridSearchCV(SVC(probability=True, random_state=42), svm_param_grid, cv=5, n_jobs=-1, scoring='accuracy')
    svm_n_grid.fit(X_train_n_scaled, y_train_n)
    svm_n_acc = accuracy_score(y_test_n, svm_n_grid.best_estimator_.predict(X_test_n_scaled))
    print(f"-> SVM (Noisy) Best Params: {svm_n_grid.best_params_}")
    print(f"-> SVM (Noisy) Test Accuracy: {svm_n_acc * 100:.2f}%")
    
    # Save Pipeline
    print("\nSaving scalers and model weights...")
    joblib.dump(scaler_clean, os.path.join(os.path.dirname(__file__), "scaler_clean.pkl"))
    joblib.dump(scaler_noisy, os.path.join(os.path.dirname(__file__), "scaler_noisy.pkl"))
    
    joblib.dump(rf_c_grid.best_estimator_, os.path.join(os.path.dirname(__file__), "speech_confidence_rf_clean.pkl"))
    joblib.dump(rf_n_grid.best_estimator_, os.path.join(os.path.dirname(__file__), "speech_confidence_rf_noisy.pkl"))
    joblib.dump(svm_c_grid.best_estimator_, os.path.join(os.path.dirname(__file__), "speech_confidence_svm_clean.pkl"))
    joblib.dump(svm_n_grid.best_estimator_, os.path.join(os.path.dirname(__file__), "speech_confidence_svm_noisy.pkl"))
    
    print("\n=================== TRAINED MODEL ACCURACIES ===================")
    print(f"1. Random Forest (Clean Data)           | Test Accuracy: {rf_c_acc * 100:.2f}%")
    print(f"2. Random Forest (Noise-Augmented)       | Test Accuracy: {rf_n_acc * 100:.2f}%")
    print(f"3. SVM (Clean Data)                     | Test Accuracy: {svm_c_acc * 100:.2f}%")
    print(f"4. SVM (Noise-Augmented)                 | Test Accuracy: {svm_n_acc * 100:.2f}%")
    print("================================================================")
    print("Training finished successfully! All 4 models saved.")

if __name__ == "__main__":
    main()
