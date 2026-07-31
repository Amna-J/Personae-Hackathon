import json
from ml.moodboard_decomposer import decompose_moodboard

result = decompose_moodboard('ml/testimages/pinterest.jpg')
print(json.dumps(result, indent=2))
