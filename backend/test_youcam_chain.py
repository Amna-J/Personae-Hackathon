import os
import time

import requests
from PIL import Image

from ml.youcam_client import chain_vto_steps

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMG_DIR = os.path.join(BASE_DIR, "ml", "testimages")


def crop_bbox(src_name, bbox, out_name):
    image = Image.open(os.path.join(IMG_DIR, src_name)).convert("RGB")
    width, height = image.size
    x0, y0, x1, y1 = bbox
    pad = 0.02
    x0 = max(0, int((x0 - pad) * width))
    y0 = max(0, int((y0 - pad) * height))
    x1 = min(width, int((x1 + pad) * width))
    y1 = min(height, int((y1 + pad) * height))
    out_path = os.path.join(IMG_DIR, out_name)
    image.crop((x0, y0, x1, y1)).save(out_path, "JPEG")
    return out_path


top_path = crop_bbox("pinterest.jpg", (0.22, 0.04, 0.53, 0.28), "vto_ref_top.jpg")
shoes_path = crop_bbox("pinterest.jpg", (0.04, 0.62, 0.31, 0.73), "vto_ref_shoes.jpg")
user_photo = os.path.join(IMG_DIR, "full look.png")

print("user_photo: %s" % user_photo)
print("top_ref:    %s" % top_path)
print("shoes_ref:  %s" % shoes_path)

items = [
    {"category": "top", "image_path": top_path},
    {"category": "shoes", "image_path": shoes_path},
]

start = time.time()
try:
    steps = chain_vto_steps(user_photo, items)
    for step in steps:
        print("STEP %d: category=%s task_id=%s" % (step["index"], step["category"], step["task_id"]))
        print("STEP %d: result_url=%s" % (step["index"], step["result_url"]))

    final_url = steps[-1]["result_url"]
    response = requests.get(final_url, timeout=120)
    response.raise_for_status()
    result_path = os.path.join(IMG_DIR, "vto_test_result.jpg")
    with open(result_path, "wb") as out_file:
        out_file.write(response.content)
    print("FINAL_SAVED: %s (%d bytes)" % (result_path, len(response.content)))
except Exception as exc:
    import traceback

    traceback.print_exc()

print("TOTAL_TIME: %.1fs" % (time.time() - start))
