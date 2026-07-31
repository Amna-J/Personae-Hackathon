import joblib

# Load the feature columns your model expects
feature_cols = joblib.load("ml/models/feature_cols.pkl")

print("Features expected by the model:")
print(feature_cols)