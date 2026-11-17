"""双机位按声音对齐。
用法：python sync_offset.py ref.wav other.wav [--windows 8] [--win 20] [--max-lag 60] [--fit]
输出：other 里的时刻 = ref 里的时刻 + offset（秒）。
  1) 全段 1ms 包络互相关求粗偏移（±max-lag 秒内）；
  2) 在 windows 个 win 秒的窗口里按采样细求，看漂移（q = 相关度，0.4 以上可信）；
  3) --fit：对各窗口做线性拟合，打印 offset_s / drift_per_s / ref_t，可直接填进 场地预设.json 的 sync 节（或 build_edl.py 的参数）。
两条 wav 先用 ffmpeg 从两机位素材导出：ffmpeg -i cam.mov -map 0:a:0 -ac 1 -ar 48000 cam.wav"""
import argparse
import numpy as np
import soundfile as sf

ap = argparse.ArgumentParser()
ap.add_argument('ref'); ap.add_argument('other')
ap.add_argument('--windows', type=int, default=8); ap.add_argument('--win', type=float, default=20.0)
ap.add_argument('--max-lag', type=float, default=60.0); ap.add_argument('--fit', action='store_true')
A = ap.parse_args()

a, sr = sf.read(A.ref); b, sr2 = sf.read(A.other)
assert sr == sr2, f'采样率不同：{sr} vs {sr2}，先统一成 48000'
a = a if a.ndim == 1 else a.mean(1); b = b if b.ndim == 1 else b.mean(1)


def best_lag(x, y, lo, hi):
    """找 L∈[lo,hi]（采样），使 y[t+L] 与 x[t] 最相关。FFT 版。"""
    n = 1 << int(np.ceil(np.log2(len(x) + len(y))))
    c = np.fft.irfft(np.conj(np.fft.rfft(x, n)) * np.fft.rfft(y, n), n)  # c[L] = sum x[t] y[t+L]
    L = np.arange(lo, hi + 1); v = c[L % n]
    k = int(np.argmax(v)); return int(L[k]), float(v[k] / (np.linalg.norm(x) * np.linalg.norm(y) + 1e-9))


h = sr // 1000
ea = np.abs(a[:len(a) // h * h]).reshape(-1, h).mean(1); eb = np.abs(b[:len(b) // h * h]).reshape(-1, h).mean(1)
ea -= ea.mean(); eb -= eb.mean()
ml = int(A.max_lag * 1000)
L, q = best_lag(ea, eb, -ml, ml); coarse = L / 1000
print(f'coarse offset {coarse:+.3f}s (q={q:.3f})')
pts = []
for t0 in np.linspace(A.win, len(a) / sr - 2 * A.win, A.windows):
    i0 = int(t0 * sr); w = int(A.win * sr); x = a[i0:i0 + w]
    j0 = int((t0 + coarse - 0.5) * sr)
    if j0 < 0 or j0 + w + sr > len(b): continue
    y = b[j0:j0 + w + sr]
    L, q = best_lag(x, y, 0, sr)
    off = (j0 + L) / sr - t0
    pts.append((t0, off, q))
    print(f'  ref {t0:6.1f}s  offset {off:+.4f}s  q={q:.3f}')
if A.fit and len(pts) >= 2:
    t = np.array([p[0] for p in pts]); o = np.array([p[1] for p in pts]); wq = np.array([max(p[2], 1e-3) for p in pts])
    ref_t = float(round(t[0]))
    k, c = np.polyfit(t - ref_t, o, 1, w=wq)
    res = o - (c + k * (t - ref_t))
    print(f'fit: offset_s {c:+.4f}  drift_per_s {k:+.3e}  ref_t {ref_t:g}  （残差最大 {np.abs(res).max() * 1000:.1f}ms；一帧 = 33ms）')
    print(f'  场地预设.json → "sync": {{"offset_s": {c:.4f}, "drift_per_s": {k:.3e}, "ref_t": {ref_t:g}}}')
