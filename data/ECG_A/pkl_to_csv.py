import pickle
import numpy as np
import pandas as pd

with open('D:/Paper/Resf_Conf_Jour/ExperimentalResult_OurMethod_ICIT/AT_seed_posSt1/dataset/ECG_A/ECG_train.pkl', 'rb') as f:
    data = pickle.load(f)
df = pd.DataFrame(data)
df = df.iloc[:, :-1]
np.save('D:/Paper/Resf_Conf_Jour/ExperimentalResult_OurMethod_ICIT/AT_seed_posSt1/dataset/ECG_A/ECG_train.npy', df)


with open('D:/Paper/Resf_Conf_Jour/ExperimentalResult_OurMethod_ICIT/AT_seed_posSt1/dataset/ECG_A/ECG_test.pkl', 'rb') as f:
    data = pickle.load(f)
df = pd.DataFrame(data)
test = df.iloc[:, :-1] # tất cả các cột trừ cột cuối
labeled = df.iloc[:, -1].values   # chỉ cột cuối
np.save('D:/Paper/Resf_Conf_Jour/ExperimentalResult_OurMethod_ICIT/AT_seed_posSt1/dataset/ECG_A/ECG_test.npy', test)
np.save('D:/Paper/Resf_Conf_Jour/ExperimentalResult_OurMethod_ICIT/AT_seed_posSt1/dataset/ECG_A/ECG_test_label.npy', labeled)
print("done")

