import requests

# URL of your local Django API
url = "http://127.0.0.1:8000/api/predict/body-shape/"

# Example data with all required features
data = {
    "shoulder": 40,   # in cm
    "bust": 90,       # in cm
    "waist": 70,      # in cm
    "hip": 95         # in cm
}

# If you have an image, you can add it here; otherwise, leave files empty
files = {
    # "image": open("path_to_image.jpg", "rb")
}

try:
    response = requests.post(url, data=data, files=files)
    print("Status code:", response.status_code)
    print("Response JSON:", response.json())

except Exception as e:
    print("Request failed:", e)