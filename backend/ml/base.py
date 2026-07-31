# class BasePredictor:
#     def predict(self, **kwargs) -> dict:
#         raise NotImplementedError

#     def validate(self, **kwargs):
#         raise NotImplementedError
# def validate(self, **kwargs):
#     required = ['shoulder', 'bust', 'waist', 'hip']
#     for name in required:
#         val = kwargs.get(name)
#         if val is None:
#             raise ValueError(f"{name} is missing")
#         try:
#             float(val)
#         except Exception:
#             raise ValueError(f"{name} must be a number")
class BasePredictor:
    def predict(self, **kwargs) -> dict:
        raise NotImplementedError

    def validate(self, **kwargs):
        raise NotImplementedError