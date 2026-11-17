"""20ms 能量包络：env.py wav 起 止 → 每 20ms 一个 dB 值（每行 10 个=0.2s）"""
import sys, numpy as np, soundfile as sf
x, sr = sf.read(sys.argv[1]); x = x if x.ndim == 1 else x.mean(1)
t0, t1 = float(sys.argv[2]), float(sys.argv[3]); hop = int(sr * .02)
a = int(t0 * sr); n = int((t1 - t0) / .02)
r = [20 * np.log10(np.sqrt((x[a + k*hop:a + (k+1)*hop] ** 2).mean()) + 1e-9) for k in range(n)]
for k in range(0, n, 10): print(f'{t0 + k*.02:8.2f} ' + ' '.join(f'{v:4.0f}' for v in r[k:k+10]))
