import cv2
import numpy as np
import tensorflow as tf
from PIL import Image
from pathlib import Path

MODEL_PATH  = Path(__file__).resolve().parent.parent / "models" / "xception_skintone.keras"
CLASS_NAMES = ["black", "dark", "fair", "medium"]
IMG_SIZE    = (299, 299)
PADDING     = 0.30

# Loaded lazily on first predict so the app still starts without the trained
# weights (they are deliberately not part of the repo).
model = None
try:
    model = tf.keras.models.load_model(str(MODEL_PATH))
except (OSError, FileNotFoundError, ValueError) as exc:
    print(f"Skin-tone model unavailable (weights not present?): {exc}")
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")


def crop_face(img_rgb: np.ndarray, padding: float = PADDING) -> np.ndarray:
    """Detect largest face and return padded crop. Falls back to full image."""
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))

    if len(faces) == 0:
        return img_rgb

    # Pick the largest face
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    H, W = img_rgb.shape[:2]

    pad_x = int(w * padding)
    pad_y = int(h * padding)
    x1 = max(0, x - pad_x)
    y1 = max(0, y - pad_y)
    x2 = min(W, x + w + pad_x)
    y2 = min(H, y + h + pad_y)

    return img_rgb[y1:y2, x1:x2]


def preprocess(img_rgb: np.ndarray) -> np.ndarray:
    """Resize with LANCZOS → Xception preprocess_input (scales to [-1, 1])."""
    pil = Image.fromarray(img_rgb).resize(IMG_SIZE, Image.LANCZOS)
    arr = np.array(pil, dtype=np.float32)
    arr = tf.keras.applications.xception.preprocess_input(arr)
    return np.expand_dims(arr, axis=0)  # (1, 299, 299, 3)


def predict_skin_tone(image_file):
    if model is None:
        raise RuntimeError(
            "Skin-tone model is not available. Restore the trained weights "
            "under ml/models/ — see README."
        )
    img     = Image.open(image_file).convert("RGB")
    img_rgb = np.array(img)
    cropped = crop_face(img_rgb)
    arr     = preprocess(cropped)
    probs   = model.predict(arr, verbose=0)[0]

    return {
        "predicted_class": CLASS_NAMES[probs.argmax()],
        "confidence":      round(float(probs.max()) * 100, 2),
        "all_scores":      {cls: round(float(p) * 100, 2) for cls, p in zip(CLASS_NAMES, probs)},
    }
