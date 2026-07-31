import json
import os
from pathlib import Path
from ml.moodboard_decomposer import decompose_moodboard

testimages_dir = Path('ml/testimages')
results = {}

for image_file in sorted(testimages_dir.glob('*')):
    if image_file.is_file() and image_file.suffix.lower() in ['.jpg', '.jpeg', '.jfif', '.png', '.webp']:
        try:
            result = decompose_moodboard(str(image_file))
            results[image_file.name] = {
                "status": "success",
                "items_detected": len(result),
                "items": result
            }
        except Exception as e:
            results[image_file.name] = {
                "status": "error",
                "error": str(e)
            }

print(json.dumps(results, indent=2))
