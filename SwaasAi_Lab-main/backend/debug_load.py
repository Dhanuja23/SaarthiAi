import os
import traceback
from tensorflow.keras.models import load_model

MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'trainedModel')
path = os.path.join(MODEL_DIR, 'mfcc_model.h5')
print('Trying to load:', path)
try:
    m = load_model(path)
    print('Loaded model:', type(m))
except Exception as e:
    print('Exception during load_model:')
    traceback.print_exc()
