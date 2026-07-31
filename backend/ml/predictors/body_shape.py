import numpy as np
import torch
import cv2
from ..base import BasePredictor

class BodyShapePredictor(BasePredictor):
    def __init__(self, lgb_model, rf_model, nn_model, scaler, label_encoder, feature_cols):
        self.lgb_model = lgb_model
        self.rf_model = rf_model
        self.nn_model = nn_model
        self.scaler = scaler
        self.le = label_encoder
        self.feature_cols = feature_cols

        # Ensure NN runs in inference mode
        self.nn_model.eval()

    # -----------------------
    # Validation
    # -----------------------
    def validate(self, **kwargs):
        required = ["shoulder", "bust", "waist", "hip"]
        for name in required:
            val = kwargs.get(name)
            if val is None:
                raise ValueError(f"{name} is missing")
            try:
                kwargs[name] = float(val)
            except Exception:
                raise ValueError(f"{name} must be a number")
        return kwargs

    # -----------------------
    # Feature Engineering
    # -----------------------
    def _engineer_features(self, shoulder, bust, waist, hip):
        # Avoid zero division
        hip = max(hip, 0.1)
        shoulder = max(shoulder, 0.1)
        waist = max(waist, 0.1)
        bust = max(bust, 0.1)

        under_chest = bust * 0.87
        raw = {
            "shoulder_width_cm": shoulder,
            "bust_circumference_cm": bust,
            "waist_circumference_cm": waist,
            "hip_circumference_cm": hip,
            "under_chest_cm": under_chest,
            # Ratios
            "shoulder_hip_ratio": shoulder / hip,
            "waist_hip_ratio": waist / hip,
            "waist_shoulder_ratio": waist / shoulder,
            "bust_hip_ratio": bust / hip,
            "bust_waist_ratio": bust / waist,
            "shoulder_waist_ratio": shoulder / waist,
            "hip_bust_ratio": hip / bust,
            # Differences
            "shoulder_waist_diff": shoulder - waist,
            "hip_shoulder_diff": hip - shoulder,
            "hip_waist_diff": hip - waist,
            "shoulder_bust_diff": shoulder - bust,
            "bust_waist_diff": bust - waist,
            # Symmetry / body shape metrics
            "bust_hip_symmetry": 1 - abs(bust - hip) / hip,
            "waist_definition": 1 - (waist / ((bust + hip) / 2)),
        }
        return [raw[col] for col in self.feature_cols]

    # -----------------------
    # Ensemble Prediction
    # -----------------------
    def _ensemble_proba(self, features):
        scaled = self.scaler.transform([features])

        # LightGBM
        lgb_proba = self.lgb_model.predict_proba(scaled)[0]

        # Random Forest
        rf_proba = self.rf_model.predict_proba(scaled)[0]

        # Neural Network
        with torch.no_grad():
            tensor = torch.tensor(scaled, dtype=torch.float32)
            logits = self.nn_model(tensor)
            if isinstance(logits, tuple):  # NN may return (logits, ...)
                logits = logits[0]
            nn_proba = torch.softmax(logits, dim=1).numpy()[0]

        # Equal-weight ensemble
        return (lgb_proba + rf_proba + nn_proba) / 3

    # -----------------------
    # MediaPipe Shoulder/Hip Ratio from Image
    # -----------------------
    def _image_shoulder_hip_ratio(self, image_bytes):
        try:
            import mediapipe as mp

            img_array = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
            if img is None:
                return None
            h, w = img.shape[:2]

            with mp.solutions.pose.Pose(
                static_image_mode=True, model_complexity=1, min_detection_confidence=0.5
            ) as pose:
                results = pose.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
                if not results.pose_landmarks:
                    return None

                lm = results.pose_landmarks.landmark
                PL = mp.solutions.pose.PoseLandmark

                shoulder_width = abs(lm[PL.LEFT_SHOULDER].x - lm[PL.RIGHT_SHOULDER].x) * w
                hip_width = abs(lm[PL.LEFT_HIP].x - lm[PL.RIGHT_HIP].x) * w

                if hip_width <= 0:
                    return None

                return shoulder_width / hip_width
        except Exception:
            return None

    # -----------------------
    # Main Prediction API
    # -----------------------
    def predict(self, shoulder, bust, waist, hip, image_bytes=None):
        # ✅ Validate and convert to float
        validated = self.validate(
            shoulder=shoulder, bust=bust, waist=waist, hip=hip
        )
        shoulder = validated["shoulder"]
        bust = validated["bust"]
        waist = validated["waist"]
        hip = validated["hip"]

        # Manual features
        features = self._engineer_features(shoulder, bust, waist, hip)
        manual_proba = self._ensemble_proba(features)

        # Image-assisted features
        if image_bytes:
            image_ratio = self._image_shoulder_hip_ratio(image_bytes)
            if image_ratio is not None:
                manual_ratio = shoulder / hip
                blended_ratio = (manual_ratio + image_ratio) / 2
                adjusted_hip = shoulder / blended_ratio
                img_features = self._engineer_features(shoulder, bust, waist, adjusted_hip)
                image_proba = self._ensemble_proba(img_features)
                final_proba = 0.7 * manual_proba + 0.3 * image_proba
            else:
                final_proba = manual_proba
        else:
            final_proba = manual_proba

        # Final prediction
        idx = int(np.argmax(final_proba))
        label = self.le.inverse_transform([idx])[0]
        confidence = round(float(final_proba[idx]) * 100, 1)

        # Borderline detection
        sorted_probs = sorted(final_proba, reverse=True)
        borderline = (sorted_probs[0] - sorted_probs[1]) < 0.15

        # All scores
        all_scores = {
            self.le.inverse_transform([i])[0]: round(float(p) * 100, 1)
            for i, p in enumerate(final_proba)
        }

        return {
            "body_shape": label,
            "confidence": confidence,
            "borderline": borderline,
            "all_scores": all_scores,
        }