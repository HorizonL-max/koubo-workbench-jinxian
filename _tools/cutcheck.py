"""粗剪切点能量核查（AGENTS.md「粗剪：按音频切素材时的检查」的机器版）。
用法: cutcheck.py edl.json '<wav 路径模板，{} = 素材号>'
对每个岛的入点 / 出点：
  - 切点 ±30ms 的 20ms 包络电平（应在能量谷，< -38dB 为好）
  - 出点：岛尾 0.6s 内，最后一个谷之后若有短促爆发（<0.3s、>-20dB）→ 疑似打嗝/咳嗽/下一遍起音，建议出点提到谷里
  - 入点：岛头 0.6s 内，第一个谷之前若有短促爆发 → 疑似上一遍残尾
输出 WARN 行，并给建议切点（谷底时刻）。"""
import json, sys
import numpy as np, soundfile as sf

E = json.load(open(sys.argv[1])); PAT = sys.argv[2]
cache = {}
def env(src):
    if src not in cache:
        x, sr = sf.read(PAT.format(src)); x = x if x.ndim == 1 else x.mean(1)
        hop = int(sr * 0.02); n = len(x) // hop
        r = np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
        cache[src] = 20 * np.log10(r)
    return cache[src]

def db_at(e, t): return float(e[max(0, min(len(e) - 1, int(t / 0.02)))])
def win(e, a, b): return e[max(0, int(a / 0.02)):max(0, int(b / 0.02))]

def bursts(seg, t0):
    """seg 内连续 >-20dB 的段：(起, 止)"""
    out, on = [], None
    for k, v in enumerate(seg):
        if v > -20 and on is None: on = k
        if v <= -20 and on is not None: out.append((t0 + on * .02, t0 + k * .02)); on = None
    if on is not None: out.append((t0 + on * .02, t0 + len(seg) * .02))
    return out

bad = 0
for k, i in enumerate(E['islands']):
    e = env(i['src']); a, b = i['in'], i['out']
    la, lb = db_at(e, a), db_at(e, b)
    msg = []
    if la > -32: msg.append(f'入点电平 {la:.0f}dB 不在谷里')
    if lb > -32: msg.append(f'出点电平 {lb:.0f}dB 不在谷里')
    # 出点：尾 0.6s
    tail = win(e, b - 0.6, b); t0 = b - 0.6
    if len(tail):
        valleys = [t0 + j * .02 for j, v in enumerate(tail) if v < -38]
        if valleys:
            v = valleys[-1]
            for s, t in bursts(win(e, v, b), v):
                if t - s < 0.3: msg.append(f'出点前 {s:.2f}-{t:.2f} 短促爆发（谷 {v:.2f}）→ 出点建议 ≤{v:.2f}')
    head = win(e, a, a + 0.6)
    if len(head):
        valleys = [a + j * .02 for j, v in enumerate(head) if v < -38]
        if valleys:
            v = valleys[0]
            for s, t in bursts(win(e, a, v), a):
                if t - s < 0.3: msg.append(f'入点后 {s:.2f}-{t:.2f} 短促爆发（谷 {v:.2f}）→ 入点建议 ≥{v:.2f}')
    print(f"{'WARN' if msg else ' ok '} #{k:02d} {i['src']} {a:.2f}-{b:.2f}  in {la:.0f}dB out {lb:.0f}dB  " + '; '.join(msg))
    bad += bool(msg)
print(f'{bad} 个岛需要人工核')
