import os
# Set protobuf implementation before any other imports
os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'

import requests
import librosa as lb
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib

# Create model architectures (fallback if .h5 load fails)
def create_mfcc_model():
    input_layer = tf.keras.layers.Input(shape=(20, 259, 1), name="mfccInput")
    x = tf.keras.layers.Conv2D(32, 5, strides=(1, 3), padding='same')(input_layer)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Activation(tf.keras.activations.relu)(x)
    x = tf.keras.layers.MaxPooling2D(pool_size=2, padding='valid')(x)

    x = tf.keras.layers.Conv2D(64, 3, strides=(1, 2), padding='same')(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Activation(tf.keras.activations.relu)(x)
    x = tf.keras.layers.MaxPooling2D(pool_size=2, padding='valid')(x)

    x = tf.keras.layers.Conv2D(96, 2, padding='same')(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Activation(tf.keras.activations.relu)(x)
    x = tf.keras.layers.MaxPooling2D(pool_size=2, padding='valid')(x)

    x = tf.keras.layers.Conv2D(128, 2, padding='same')(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Activation(tf.keras.activations.relu)(x)
    output = tf.keras.layers.GlobalMaxPooling2D()(x)

    model = tf.keras.Model(input_layer, output, name="mfccModel")
    return model

def create_chroma_model():
    input_layer = tf.keras.layers.Input(shape=(12, 259, 1), name="cromaInput")
    x = tf.keras.layers.Conv2D(32, 5, strides=(1, 3), padding='same')(input_layer)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Activation(tf.keras.activations.relu)(x)
    x = tf.keras.layers.MaxPooling2D(pool_size=2, padding='valid')(x)

    x = tf.keras.layers.Conv2D(64, 3, strides=(1, 2), padding='same')(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Activation(tf.keras.activations.relu)(x)
    x = tf.keras.layers.MaxPooling2D(pool_size=2, padding='valid')(x)

    x = tf.keras.layers.Conv2D(128, 2, padding='same')(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Activation(tf.keras.activations.relu)(x)
    output = tf.keras.layers.GlobalMaxPooling2D()(x)

    model = tf.keras.Model(input_layer, output, name="cromaModel")
    return model

def create_mspec_model():
    input_layer = tf.keras.layers.Input(shape=(128, 259, 1), name="mSpecInput")
    x = tf.keras.layers.Conv2D(32, 5, strides=(2, 3), padding='same')(input_layer)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Activation(tf.keras.activations.relu)(x)
    x = tf.keras.layers.MaxPooling2D(pool_size=2, padding='valid')(x)

    x = tf.keras.layers.Conv2D(64, 3, strides=(2, 2), padding='same')(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Activation(tf.keras.activations.relu)(x)
    x = tf.keras.layers.MaxPooling2D(pool_size=2, padding='valid')(x)

    x = tf.keras.layers.Conv2D(96, 2, padding='same')(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Activation(tf.keras.activations.relu)(x)
    x = tf.keras.layers.MaxPooling2D(pool_size=2, padding='valid')(x)

    x = tf.keras.layers.Conv2D(128, 2, padding='same')(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Activation(tf.keras.activations.relu)(x)
    output = tf.keras.layers.GlobalMaxPooling2D()(x)

    model = tf.keras.Model(input_layer, output, name="mSpecModel")
    return model

# Model directory
MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'trainedModel')

# Disease classes
DISEASE_CLASSES = ['COPD', 'Bronchiectasis', 'Pneumonia', 'URTI', 'Healthy', 'Asthma', 'LRTI', 'Bronchiolitis']

# Load models
models = {}
models_loaded = 0

def load_models():
    global models, models_loaded
    model_files = {
        'mfcc': 'mfcc_model.h5',
        'chroma': 'chroma_model.h5',
        'mSpec': 'mSpec_model.h5'
    }
    
    for name, filename in model_files.items():
        path = os.path.join(MODEL_DIR, filename)
        if os.path.exists(path):
            try:
                models[name] = load_model(path)
                print(f"[OK] Loaded {name} model from {path}")
                models_loaded += 1
            except Exception as e:
                print(f"[WARN] Could not load {name} model using load_model: {e}")
                # Attempt fallback: create architecture and load weights if file contains only weights
                try:
                    if name == 'mfcc':
                        mdl = create_mfcc_model()
                    elif name == 'chroma':
                        mdl = create_chroma_model()
                    elif name == 'mSpec':
                        mdl = create_mspec_model()
                    else:
                        mdl = None

                    if mdl is not None:
                        try:
                            mdl.load_weights(path)
                            models[name] = mdl
                            models_loaded += 1
                            print(f"[OK] Loaded {name} model weights into architecture from {path}")
                        except Exception as e2:
                            print(f"[WARN] Fallback load_weights failed for {name}: {e2}")
                            models[name] = None
                    else:
                        models[name] = None
                except Exception as e3:
                    print(f"[WARN] Fallback for {name} failed: {e3}")
                    models[name] = None
        else:
            print(f"[WARN] {name} model file not found at {path}")
            models[name] = None
    
    print(f"Total models loaded: {models_loaded}/3")

load_models()

# Load label encoder and scaler if they exist
label_encoder_path = os.path.join(MODEL_DIR, 'label_encoder.pkl')
scaler_path = os.path.join(MODEL_DIR, 'scaler.pkl')

label_encoder = None
scaler = None

if os.path.exists(label_encoder_path):
    try:
        label_encoder = joblib.load(label_encoder_path)
        print("[OK] Loaded label encoder successfully")
    except Exception as e:
        print(f"[WARN] Could not load label encoder: {e}")

if os.path.exists(scaler_path):
    try:
        scaler = joblib.load(scaler_path)
        print("[OK] Loaded scaler successfully")
    except Exception as e:
        print(f"[WARN] Could not load scaler: {e}")

def pad_or_truncate(feature, target_len):
    """Pad or truncate feature to target length along time axis"""
    current_len = feature.shape[1]
    if current_len > target_len:
        return feature[:, :target_len]
    elif current_len < target_len:
        pad_width = target_len - current_len
        return np.pad(feature, ((0, 0), (0, pad_width)), mode='constant')
    return feature

def extract_audio_features(audio_file_path):
    """Extract audio features for model prediction matching training shapes"""
    try:
        # Load audio (up to 6 seconds to match training)
        audio, sr = lb.load(audio_file_path, sr=22050, duration=6.0)

        # Target time frames: 22050 * 6 / 512 ≈ 259 frames
        hop_length = 512
        target_frames = 259

        # MFCC features: (20, 259) -> (20, 259, 1)
        mfcc = lb.feature.mfcc(y=audio, sr=sr, n_mfcc=20, hop_length=hop_length)
        mfcc = pad_or_truncate(mfcc, target_frames)
        mfcc = np.expand_dims(mfcc, axis=-1)

        # Chroma features: (12, 259) -> (12, 259, 1)
        chroma = lb.feature.chroma_stft(y=audio, sr=sr, n_chroma=12, hop_length=hop_length)
        chroma = pad_or_truncate(chroma, target_frames)
        chroma = np.expand_dims(chroma, axis=-1)

        # Mel spectrogram features: (128, 259) -> (128, 259, 1)
        mspec = lb.feature.melspectrogram(y=audio, sr=sr, n_mels=128, hop_length=hop_length)
        mspec = pad_or_truncate(mspec, target_frames)
        mspec = np.expand_dims(mspec, axis=-1)

        return {
            'mfcc': np.expand_dims(mfcc, axis=0),      # (1, 20, 259, 1)
            'chroma': np.expand_dims(chroma, axis=0),  # (1, 12, 259, 1)
            'mSpec': np.expand_dims(mspec, axis=0)     # (1, 128, 259, 1)
        }

    except Exception as e:
        print(f"Error extracting features: {e}")
        return None

def predict_with_models(features):
    """Make predictions using trained models"""
    predictions = {}

    # MFCC Model Prediction
    if models.get('mfcc') is not None:
        try:
            pred = models['mfcc'].predict(features['mfcc'], verbose=0)
            predictions['mfcc'] = pred
        except Exception as e:
            print(f"MFCC model prediction error: {e}")

    # Chroma Model Prediction
    if models.get('chroma') is not None:
        try:
            pred = models['chroma'].predict(features['chroma'], verbose=0)
            predictions['chroma'] = pred
        except Exception as e:
            print(f"Chroma model prediction error: {e}")

    # MSpec Model Prediction
    if models.get('mSpec') is not None:
        try:
            pred = models['mSpec'].predict(features['mSpec'], verbose=0)
            predictions['mSpec'] = pred
        except Exception as e:
            print(f"MSpec model prediction error: {e}")

    return predictions

def analyze_symptoms_with_google_ai(symptoms):
    """Analyze symptoms using Google Cloud Natural Language API"""
    if not symptoms:
        return "No symptoms provided for analysis"

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        return "Google AI API key not configured - using fallback analysis"

    try:
        # Use Google Cloud Natural Language API
        url = f"https://language.googleapis.com/v1/documents:analyzeSentiment?key={api_key}"
        data = {
            "document": {
                "type": "PLAIN_TEXT",
                "content": symptoms
            }
        }

        response = requests.post(url, json=data, timeout=10)
        if response.status_code == 200:
            sentiment_data = response.json()
            sentiment_score = sentiment_data.get("documentSentiment", {}).get("score", 0)

            # Analyze entities
            url_entities = f"https://language.googleapis.com/v1/documents:analyzeEntities?key={api_key}"
            response_entities = requests.post(url_entities, json=data, timeout=10)
            entities = []
            if response_entities.status_code == 200:
                entities_data = response_entities.json()
                entities = [entity["name"] for entity in entities_data.get("entities", [])]

            return f"Google AI Analysis: Sentiment score {sentiment_score:.2f}, Found entities: {', '.join(entities)}"
        else:
            return f"Google AI API error: {response.status_code}"

    except Exception as e:
        return f"Google AI analysis failed: {str(e)}"

def classificationResults(audio_file_path, symptoms=""):
    """Main classification function using trained models and AI analysis"""
    try:
        # Extract audio features
        features = extract_audio_features(audio_file_path)
        if features is None:
            return ["Error: Could not extract audio features"]

        # Get model predictions
        predictions = predict_with_models(features)

        # Analyze symptoms
        symptom_analysis = analyze_symptoms_with_google_ai(symptoms)

        results = []

        # Process predictions
        if predictions:
            # Combine predictions from all models
            all_predictions = []
            model_weights = {'mfcc': 0.4, 'chroma': 0.3, 'mSpec': 0.3}

            for model_name, pred in predictions.items():
                if pred is not None:
                    predicted_class_idx = np.argmax(pred, axis=1)[0]
                    confidence = np.max(pred, axis=1)[0]

                    if label_encoder and hasattr(label_encoder, 'classes_'):
                        predicted_disease = label_encoder.inverse_transform([predicted_class_idx])[0]
                    else:
                        predicted_disease = DISEASE_CLASSES[predicted_class_idx] if predicted_class_idx < len(DISEASE_CLASSES) else "Unknown"

                    all_predictions.append({
                        'model': model_name,
                        'disease': predicted_disease,
                        'confidence': confidence,
                        'weight': model_weights.get(model_name, 0.33)
                    })

            if all_predictions:
                # Weighted ensemble prediction
                weighted_diseases = {}
                total_weight = 0

                for pred in all_predictions:
                    disease = pred['disease']
                    weight = pred['weight'] * pred['confidence']
                    weighted_diseases[disease] = weighted_diseases.get(disease, 0) + weight
                    total_weight += pred['weight']

                # Get top prediction
                top_disease = max(weighted_diseases.items(), key=lambda x: x[1])
                final_disease = top_disease[0]
                final_confidence = top_disease[1] / total_weight

                results.append(f"AI Diagnosis: {final_disease}")
                results.append(f"Confidence: {final_confidence:.1%}")
                results.append(f"Models Used: {len(all_predictions)}")

                # Add individual model results
                for pred in all_predictions:
                    results.append(f"{pred['model'].upper()} Model: {pred['disease']} ({pred['confidence']:.1%})")

            else:
                results.append("AI Diagnosis: Unable to analyze - models not loaded")
                results.append("Confidence: N/A")
        else:
            results.append("AI Diagnosis: No trained models available")
            results.append("Confidence: N/A")

        # Add symptom analysis
        results.append(f"Symptom Analysis: {symptom_analysis}")

        # Add recommendations based on diagnosis
        if "COPD" in str(results[0]):
            results.extend([
                "Recommendations: Consult pulmonologist, Quit smoking, Use inhalers as prescribed",
                "Precautions: Avoid air pollution, Regular exercise, Annual flu vaccine"
            ])
        elif "Pneumonia" in str(results[0]):
            results.extend([
                "Recommendations: Seek immediate medical attention, Complete antibiotic course",
                "Precautions: Rest, Stay hydrated, Monitor temperature"
            ])
        elif "Asthma" in str(results[0]):
            results.extend([
                "Recommendations: Use rescue inhaler, Identify triggers, Regular check-ups",
                "Precautions: Avoid allergens, Keep action plan, Monitor peak flow"
            ])
        else:
            results.extend([
                "Recommendations: Monitor symptoms, Consult healthcare provider if symptoms persist",
                "Precautions: Maintain healthy lifestyle, Regular health check-ups"
            ])

        return results

    except Exception as e:
        return [f"Analysis failed: {str(e)}"]
