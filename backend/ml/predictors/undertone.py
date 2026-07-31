import tensorflow as tf
import numpy as np
from PIL import Image
from pathlib import Path

MODEL_PATH = Path(__file__).resolve().parent.parent / "models"
CLASS_NAMES = ["cool", "neutral", "warm"]  

model = tf.keras.models.load_model(str(MODEL_PATH))

def predict_undertone(image_file):
    img = Image.open(image_file).convert("RGB").resize((224, 224))
    # Pass raw pixels (0-255) — model handles normalization internally
    arr = np.expand_dims(np.array(img), axis=0).astype("float32")
    probs = model.predict(arr)[0]
    return {
        "predicted_class": CLASS_NAMES[probs.argmax()],
        "confidence": round(float(probs.max()) * 100, 2),
        "all_scores": {cls: round(float(p) * 100, 2) for cls, p in zip(CLASS_NAMES, probs)}
    }