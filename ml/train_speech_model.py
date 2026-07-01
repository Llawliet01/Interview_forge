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
    Extracts high-fidelity acoustic features (44 features total) from a loaded audio signal.
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
        
        # 4. Extract Pitch
        pitches = librosa.yin(y=y, sr=sr, fmin=75, fmax=400)
        pitch_mean = np.mean(pitches)
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
        
        features = np.hstack([
            mfccs_mean,
            zcr_mean,
            rms_mean,
            pitch_mean,
            pitch_var,
            chroma_mean,
            contrast_mean,
            rolloff_mean
        ])
        return features
    except Exception as e:
        print(f"Error extracting features: {e}")
        return None

def load_dataset():
    X = []
    y = []
    search_path = os.path.join(DATA_PATH, "Actor_*", "*.wav")
    file_list = glob.glob(search_path)
    
    if len(file_list) == 0:
        print(f"\n[Error] No WAV files found in: {DATA_PATH}")
        return None, None
        
    print(f"Found {len(file_list)} audio files. Starting feature extraction (with Noise Augmentation)...")
    
    for i, file_path in enumerate(file_list):
        filename = os.path.basename(file_path)
        parts = filename.split("-")
        emotion = parts[2]
        
        # Map emotions
        if emotion in ["01", "02", "03"]:
            label = 1
        elif emotion in ["04", "06"]:
            label = 0
        else:
            continue
            
        try:
            # Load the original audio file
            y_signal, sr = librosa.load(file_path, sr=16000)
            
            # 1. Clean Feature Extraction
            features_clean = extract_features_from_signal(y_signal, sr)
            if features_clean is not None:
                X.append(features_clean)
                y.append(label)
                
            # 2. Noisy Feature Extraction (Data Augmentation)
            noisy_signal = inject_noise(y_signal, noise_factor=0.005)
            features_noisy = extract_features_from_signal(noisy_signal, sr)
            if features_noisy is not None:
                X.append(features_noisy)
                y.append(label)
                
        except Exception as e:
            print(f"Error loading {file_path}: {e}")
            
        if (i + 1) % 100 == 0:
            print(f"Processed {i + 1}/{len(file_list)} files (extracted {len(X)} samples)...")
            
    return np.array(X), np.array(y)

def main():
    print("=== Starting Noise-Augmented Acoustic Model Training ===")
    X, y = load_dataset()
    if X is None or len(X) == 0:
        return
        
    print(f"\nDataset loaded. Confident vs. Anxious samples: {np.bincount(y)}")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # 1. Baseline Logistic Regression
    print("\nTraining Logistic Regression baseline...")
    lr = LogisticRegression(random_state=42, max_iter=1000)
    lr.fit(X_train_scaled, y_train)
    lr_acc = accuracy_score(y_test, lr.predict(X_test_scaled))
    print(f"-> Logistic Regression Accuracy: {lr_acc * 100:.2f}%")
    
    # 2. Optimized Random Forest via Grid Search
    print("\nPerforming Grid Search for Random Forest Classifier...")
    rf_param_grid = {
        'n_estimators': [100, 150, 200],
        'max_depth': [10, 12, 14, None],
        'min_samples_split': [2, 5],
        'max_features': ['sqrt', 'log2']
    }
    rf_grid_search = GridSearchCV(
        RandomForestClassifier(random_state=42),
        rf_param_grid,
        cv=5,
        n_jobs=-1,
        scoring='accuracy'
    )
    rf_grid_search.fit(X_train_scaled, y_train)
    best_rf = rf_grid_search.best_estimator_
    rf_acc = accuracy_score(y_test, best_rf.predict(X_test_scaled))
    print(f"-> Best Random Forest Parameters: {rf_grid_search.best_params_}")
    print(f"-> Optimized Random Forest Accuracy: {rf_acc * 100:.2f}%")
    
    # 3. Optimized SVM via Grid Search
    print("\nPerforming Grid Search for Support Vector Machine (SVM)...")
    svm_param_grid = {
        'C': [0.1, 1, 10, 100],
        'gamma': ['scale', 'auto', 0.001, 0.01, 0.1, 1],
        'kernel': ['rbf']
    }
    svm_grid_search = GridSearchCV(
        SVC(probability=True, random_state=42),
        svm_param_grid,
        cv=5,
        n_jobs=-1,
        scoring='accuracy'
    )
    svm_grid_search.fit(X_train_scaled, y_train)
    best_svm = svm_grid_search.best_estimator_
    svm_acc = accuracy_score(y_test, best_svm.predict(X_test_scaled))
    print(f"-> Best SVM Parameters Found: {svm_grid_search.best_params_}")
    print(f"-> Optimized SVM Accuracy: {svm_acc * 100:.2f}%")
    
    # 4. Print Comparison Summary
    print("\n=================== MODEL COMPARISON ===================")
    print(f"Model: Logistic Regression            | Test Accuracy: {lr_acc * 100:.2f}%")
    print(f"Model: Optimized Random Forest        | Test Accuracy: {rf_acc * 100:.2f}%")
    print(f"Model: Optimized SVM (Grid Search)    | Test Accuracy: {svm_acc * 100:.2f}%")
    print("========================================================\n")
    
    print("--- Detailed Report for Optimized Random Forest ---")
    print(classification_report(y_test, best_rf.predict(X_test_scaled), target_names=["Anxious (0)", "Confident (1)"]))
    print("-" * 40)
    
    print("--- Detailed Report for Optimized SVM ---")
    print(classification_report(y_test, best_svm.predict(X_test_scaled), target_names=["Anxious (0)", "Confident (1)"]))
    print("-" * 40)
    
    # 5. Save optimal weights
    scaler_output_path = os.path.join(os.path.dirname(__file__), "scaler.pkl")
    joblib.dump(scaler, scaler_output_path)
    print(f"Saved shared scaler to: {scaler_output_path}")
    
    rf_path = os.path.join(os.path.dirname(__file__), "speech_confidence_rf.pkl")
    svm_path = os.path.join(os.path.dirname(__file__), "speech_confidence_svm.pkl")
    lr_path = os.path.join(os.path.dirname(__file__), "speech_confidence_lr.pkl")
    
    joblib.dump(best_rf, rf_path)
    joblib.dump(best_svm, svm_path)
    joblib.dump(lr, lr_path)
    
    print(f"\nSaved Optimized RF weights to: {rf_path}")
    print(f"Saved Optimized SVM weights to: {svm_path}")
    print(f"Saved LR weights to: {lr_path}")
    print("\nOptimization completed successfully!")
    print("==================================================")

if __name__ == "__main__":
    main()
