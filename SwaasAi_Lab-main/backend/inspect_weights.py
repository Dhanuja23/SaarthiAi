import h5py
import numpy as np

f = h5py.File('../trainedModel/mfcc_model.h5', 'r')
print('Top level keys:', list(f.keys()))

if 'model_weights' in f:
    mw = f['model_weights']
    print('Model weights keys:', list(mw.keys()))

    for key in mw.keys():
        if isinstance(mw[key], h5py.Group):
            print(f'{key} subgroup keys:', list(mw[key].keys()))

f.close()