import requests
import json

# The URL of your local API
url = "http://127.0.0.1:8000/api/predict/body-shape/"

# Example payload (replace with actual feature names from your feature_cols.pkl)
data = {
    "height": 170,
    "weight": 65,
    "shoulder_width": 40,
    "chest": 90,
    "waist": 70,
    "hip": 95
}

# Send POST request
response = requests.post(url, json=data)

# Print status and response
print("Status code:", response.status_code)
try:
    print("Response JSON:", response.json())
except Exception as e:
    print("Response text:", response.text)
    print("Error parsing JSON:", e)