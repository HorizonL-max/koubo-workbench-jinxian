"""双机位 EDL：以主机位（近景 cu）的 ASR 字时间为准列岛，岛内 ≥gap 秒的停顿压到约 pad_out+pad_in；切点吸附帧网格。
每岛同时写中景入点 ms_in：ms 时刻 = cu 时刻 + offset_s + drift_per_s × (t − ref_t)（sync_offset.py --fit 实测）。
ms_in < 0 的部分中景还没开机，render_rough.py 补黑（只会出现在开头）。

用法（期目录下）：
  python build_edl.py --asr asr/cu.json --range 4.60 375.20 [--cut 142.40 143.00 --cut 298.5333 301.2667] \\
      [--venue 场地预设.json | --offset -8.2742 --drift -8.5e-6 --ref-t 20] [--gap 0.70 --pad-out 0.14 --pad-in 0.10] [--fps 30] [--out edl.json]
- --asr：FunASR 整条转写（_tools/funasr_transcribe.py 的输出：sentences[].text + sentences[].ts 每字 [起,止] 毫秒或秒都行，自动判断）
- --range：要用的整段（第一个字前、最后一个字后各留一点）
- --cut a b：手动剪掉的段（口误、语气词），先于自动压停顿生效；切点要先用能量包络 / 分频核过（见 README）
- 只剪一遍的一镜到底口播用这个；多遍重拍选遍次要先另做选段，再把 --range / --cut 写成选好的段"""
import argparse, json, re

ap = argparse.ArgumentParser()
ap.add_argument('--asr', required=True)
ap.add_argument('--range', nargs=2, type=float, required=True)
ap.add_argument('--cut', nargs=2, type=float, action='append', default=[])
ap.add_argument('--venue'); ap.add_argument('--offset', type=float); ap.add_argument('--drift', type=float, default=0.0); ap.add_argument('--ref-t', type=float, default=0.0)
ap.add_argument('--gap', type=float, default=0.70); ap.add_argument('--pad-out', type=float, default=0.14); ap.add_argument('--pad-in', type=float, default=0.10)
ap.add_argument('--fps', type=int, default=30); ap.add_argument('--out', default='edl.json')
A = ap.parse_args()
FPS = A.fps
if A.venue:
    s = json.load(open(A.venue, encoding='utf-8'))['sync']
    off0, drift, ref_t = s['offset_s'], s.get('drift_per_s', 0.0), s.get('ref_t', 0.0)
else:
    if A.offset is None: raise SystemExit('要给 --venue 场地预设.json，或 --offset/--drift/--ref-t')
    off0, drift, ref_t = A.offset, A.drift, A.ref_t
OFF = lambda t: off0 + drift * (t - ref_t)


def chars():
    d = json.load(open(A.asr, encoding='utf-8'))
    out = []
    for s in d['sentences']:
        toks = re.findall(r'[A-Za-z]+|[^\sA-Za-z，。？！、,.?!]', s['text'])
        ts = s['ts']
        scale = 0.001 if ts and ts[-1][1] > 1000 else 1.0
        for c, (a, b) in zip(toks, ts):
            out.append((c, a * scale, b * scale))
    return out


snap = lambda x: round(x * FPS) / FPS
a, b = A.range
spans, cur = [], a
for x, y in sorted(A.cut):
    spans.append([cur, x]); cur = y
spans.append([cur, b])
cs = chars()
segs = []
for a, b in spans:
    c = [t for t in cs if a <= t[1] < b]
    cur = a
    for (c0, s0, e0), (c1, s1, e1) in zip(c, c[1:]):
        if s1 - e0 >= A.gap:
            segs.append([cur, e0 + A.pad_out]); cur = s1 - A.pad_in
    segs.append([cur, b])

islands, t = [], 0
for s, e in segs:
    s, e = snap(s), snap(e)
    fr = int(round((e - s) * FPS))
    islands.append({'src': 'cu', 'in': round(s, 4), 'out': round(e, 4), 'frames': fr, 'at': round(t / FPS, 4), 'ms_in': round(s + OFF(s), 4)})
    t += fr
json.dump({'fps': FPS, 'frames': t, 'ms_offset_note': f'ms = cu + OFF(t), OFF = {off0} + {drift:g}*(t-{ref_t:g})', 'islands': islands},
          open(A.out, 'w'), ensure_ascii=False, indent=1)
print(f'{len(islands)} islands, {t} frames = {t / FPS:.2f}s → {A.out}')
for k, i in enumerate(islands):
    print(f"#{k:02d} {i['in']:7.2f}-{i['out']:7.2f} {i['frames']:4d}f @ {i['at']:7.2f}  ms_in {i['ms_in']:7.2f}" + ('  ← 中景前段补黑' if i['ms_in'] < 0 else ''))
