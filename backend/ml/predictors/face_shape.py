import numpy as np
import joblib
import tensorflow as tf
import keras
from PIL import Image
from pathlib import Path

MODELS_DIR      = Path(__file__).resolve().parent.parent / "models"
EFFNET_PATH     = MODELS_DIR / "efficientnet_best.keras"
SVM_PATH        = MODELS_DIR / "landmark_svm.pkl"
LANDMARKER_PATH = MODELS_DIR / "face_landmarker.task"

CLASS_NAMES = ["heart", "oblong", "oval", "round", "square"]
IMG_SIZE    = (224, 224)

FEATURE_COLS = [
    'fw_cw', 'jw_cw', 'fw_jw', 'fl_cw', 'fl_fw',
    'forehead_norm', 'jaw_norm', 'length_norm',
    'eye_w_cw', 'jw_fw', 'chin_nose_fl', 'nose_fore_fl',
    'fl_jaw', 'cheek_jaw_diff',
]

# --- EfficientNet ---
@keras.saving.register_keras_serializable()
class EfficientNetPreprocess(keras.layers.Layer):
    def call(self, x):
        return tf.keras.applications.efficientnet.preprocess_input(x)

# Loaded lazily on first predict so the app still starts without the trained
# weights (they are deliberately not part of the repo).
effnet_model = None
try:
    effnet_model = tf.keras.models.load_model(
        str(EFFNET_PATH),
        custom_objects={"EfficientNetPreprocess": EfficientNetPreprocess}
    )
except (OSError, FileNotFoundError, ValueError) as exc:
    print(f"Face-shape EfficientNet model unavailable (weights not present?): {exc}")

# --- SVM ---
svm_model = None
try:
    svm_model = joblib.load(str(SVM_PATH))
except (OSError, FileNotFoundError) as exc:
    print(f"Face-shape SVM model unavailable (weights not present?): {exc}")

# --- MediaPipe FaceLandmarker (optional) ---
try:
    import mediapipe as mp
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision as mp_vision

    _landmarker = mp_vision.FaceLandmarker.create_from_options(
        mp_vision.FaceLandmarkerOptions(
            base_options=mp_python.BaseOptions(model_asset_path=str(LANDMARKER_PATH)),
            num_faces=1,
        )
    )
    _MP_AVAILABLE = True
except Exception:
    _MP_AVAILABLE = False


def _extract_landmarks(img_rgb: np.ndarray) -> dict | None:
    """Extract 14 geometric face ratios using MediaPipe FaceLandmarker."""
    if not _MP_AVAILABLE:
        return None

    h, w     = img_rgb.shape[:2]
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)
    result   = _landmarker.detect(mp_image)

    if not result.face_landmarks:
        return None

    lm  = result.face_landmarks[0]
    eps = 1e-6

    def pt(i):
        return np.array([lm[i].x * w, lm[i].y * h])

    forehead_w   = np.linalg.norm(pt(54)  - pt(284))
    cheek_w      = np.linalg.norm(pt(234) - pt(454))
    jaw_w        = np.linalg.norm(pt(172) - pt(397))
    face_length  = np.linalg.norm(pt(10)  - pt(152))
    eye_w        = np.linalg.norm(pt(33)  - pt(263))
    chin_to_nose = np.linalg.norm(pt(152) - pt(1))
    nose_to_fore = np.linalg.norm(pt(1)   - pt(10))

    return {
        'fw_cw'         : forehead_w   / (cheek_w      + eps),
        'jw_cw'         : jaw_w        / (cheek_w      + eps),
        'fw_jw'         : forehead_w   / (jaw_w        + eps),
        'fl_cw'         : face_length  / (cheek_w      + eps),
        'fl_fw'         : face_length  / (forehead_w   + eps),
        'forehead_norm' : forehead_w   / (cheek_w      + eps),
        'jaw_norm'      : jaw_w        / (cheek_w      + eps),
        'length_norm'   : face_length  / (cheek_w      + eps),
        'eye_w_cw'      : eye_w        / (cheek_w      + eps),
        'jw_fw'         : jaw_w        / (forehead_w   + eps),
        'chin_nose_fl'  : chin_to_nose / (face_length  + eps),
        'nose_fore_fl'  : nose_to_fore / (face_length  + eps),
        'fl_jaw'        : face_length  / (jaw_w        + eps),
        'cheek_jaw_diff': (cheek_w - jaw_w) / (cheek_w + eps),
    }


def predict_face_shape(image_file):
    if effnet_model is None:
        raise RuntimeError(
            "Face-shape model is not available. Restore the trained weights "
            "under ml/models/ — see README."
        )
    img     = Image.open(image_file).convert("RGB")
    img_rgb = np.array(img)

    # EfficientNet prediction
    arr       = np.expand_dims(np.array(img.resize(IMG_SIZE)), axis=0).astype("float32")
    eff_probs = effnet_model.predict(arr, verbose=0)[0]
    eff_pred  = CLASS_NAMES[eff_probs.argmax()]
    eff_conf  = round(float(eff_probs.max()) * 100, 2)

    # SVM prediction (requires MediaPipe)
    feats = _extract_landmarks(img_rgb)
    if feats is not None:
        X         = np.array([[feats[c] for c in FEATURE_COLS]])
        svm_pred  = svm_model.predict(X)[0]
        svm_proba = svm_model.predict_proba(X)[0]
        svm_conf  = round(float(max(svm_proba)) * 100, 2)

        # Combine: agree → average confidence; disagree → pick higher confidence
        if svm_pred == eff_pred:
            final_pred = eff_pred
            final_conf = round((svm_conf + eff_conf) / 2, 2)
        elif svm_conf >= eff_conf:
            final_pred = svm_pred
            final_conf = svm_conf
        else:
            final_pred = eff_pred
            final_conf = eff_conf
    else:
        svm_pred  = None
        svm_conf  = None
        final_pred = eff_pred
        final_conf = eff_conf

    return {
        "predicted_class":   final_pred,
        "confidence":        final_conf,
        "all_scores":        {cls: round(float(p) * 100, 2) for cls, p in zip(CLASS_NAMES, eff_probs)},
        "effnet_prediction": eff_pred,
        "effnet_confidence": eff_conf,
        "svm_prediction":    svm_pred,
        "svm_confidence":    svm_conf,
    }
