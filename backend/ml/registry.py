# import joblib
# import torch
# from pathlib import Path
# from .neural_net import BodyShapeNet
# from .predictors.body_shape import BodyShapePredictor

# # Path to models folder
# MODELS_DIR = Path(__file__).resolve().parent / 'models'


# class MLRegistry:
#     _instance = None  # Singleton — loads once, reused forever

#     def __new__(cls):
#         if cls._instance is None:
#             cls._instance = super().__new__(cls)
#             cls._instance._load_all()
#         return cls._instance

#     def _load_all(self):
#         print("🔄 Loading ML models...")

#         # Load shared components
#         scaler        = joblib.load(MODELS_DIR / 'scaler.pkl')
#         label_encoder = joblib.load(MODELS_DIR / 'label_encoder.pkl')
#         feature_cols  = joblib.load(MODELS_DIR / 'feature_cols.pkl')

#         # Load NN with saved architecture info
#         nn_checkpoint = torch.load(
#             MODELS_DIR / 'nn_model_full.pt',
#             map_location='cpu'
#         )
#         nn_model = BodyShapeNet(
#             in_features = nn_checkpoint['in_features'],
#             num_classes = nn_checkpoint['num_classes'],
#         )
#         nn_model.load_state_dict(nn_checkpoint['model_state_dict'])
#         nn_model.eval()

#         # Body Shape Predictor
#         self.body_shape = BodyShapePredictor(
#             lgb_model     = joblib.load(MODELS_DIR / 'lgb_model.pkl'),
#             rf_model      = joblib.load(MODELS_DIR / 'rf_model.pkl'),
#             nn_model      = nn_model,
#             scaler        = scaler,
#             label_encoder = label_encoder,
#             feature_cols  = feature_cols,
#         )

#         print("✅ Body shape model loaded and ready.")


# # Global singleton — import this everywhere
# registry = MLRegistry()
import joblib
import torch
from pathlib import Path
from .neural_net import BodyShapeNet
from .predictors.body_shape import BodyShapePredictor

# Path to models folder
MODELS_DIR = Path(__file__).resolve().parent / 'models'


class MLRegistry:
    _instance = None  # Singleton — loads once, reused forever

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load_all()
        return cls._instance

    def _load_all(self):
        print("🔄 Loading ML models...")

        # Load shared components
        scaler        = joblib.load(MODELS_DIR / 'scaler.pkl')
        label_encoder = joblib.load(MODELS_DIR / 'label_encoder.pkl')
        feature_cols  = joblib.load(MODELS_DIR / 'feature_cols.pkl')

        # Load Neural Network model
        nn_checkpoint = torch.load(MODELS_DIR / 'nn_model_full.pt', map_location='cpu')
        nn_model = BodyShapeNet(
            in_features=nn_checkpoint['in_features'],
            num_classes=nn_checkpoint['num_classes'],
        )
        nn_model.load_state_dict(nn_checkpoint['model_state_dict'])
        nn_model.eval()

        # Body Shape Predictor
        self.body_shape = BodyShapePredictor(
            lgb_model=joblib.load(MODELS_DIR / 'lgb_model.pkl'),
            rf_model=joblib.load(MODELS_DIR / 'rf_model.pkl'),
            nn_model=nn_model,
            scaler=scaler,
            label_encoder=label_encoder,
            feature_cols=feature_cols,
        )

        print("✅ Body shape model loaded and ready.")


# Global singleton — import this everywhere
registry = MLRegistry()