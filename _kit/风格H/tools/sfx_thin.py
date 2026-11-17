"""音效「少而准」返修：按 sfx_check --mix 的分级，把被人声盖住的音效挪进句间气口，挪不动的删掉。
用法（期目录下）：
  python tools/sfx_thin.py <sfx_check 输出.txt> qa/cues.json work/sfx_peaks.json remotion/src/ep/sfx_edit.json [remotion/src/ep/timing.json]
输入：sfx_check --mix 的逐条分级（顺序 = cues.json 顺序）、cues.json（t = 文件开头秒）、各采样峰值在文件里的秒数。
输出：sfx_edit.json = {"<note>|<同 note 第几条>": {"drop": true} | {"shift": 帧}}，sfx.ts 读它改音效表。
规则：
- 动作时刻 = t + 峰值；气口 = 相邻两个字（去标点）之间 ≥0.3s 的空。
- MASKED：峰值能挪进气口（离动作 −0.12～+0.30s，落在气口头 +0.03 到尾 −0.08 之间）就挪，不能就删。
- AUDIBLE：能在 −0.10～+0.20s 内挪进气口就挪（变成句间出声），否则留着。
- UNMASKED：不动。
- 挪完后两条峰值相隔 <0.15s 的只留一条；任意 20s 窗口超过 8 条时删分级最差的 AUDIBLE。
"""
import json
import re
import sys

chk, cues_p, peaks_p, out_p = sys.argv[1:5]
TIMING = sys.argv[5] if len(sys.argv) > 5 else 'remotion/src/ep/timing.json'
FPS = 30

cues = json.load(open(cues_p))
peaks = json.load(open(peaks_p))
lines = [l for l in open(chk) if re.match(r'^(UNMASKED|AUDIBLE|MASKED)\s+t=', l)]
assert len(lines) == len(cues), (len(lines), len(cues))
grades = []
for l, c in zip(lines, cues):
    m = re.match(r'^(\w+)\s+t=\s*([\d.]+)\s+sfx\s+(-?[\d.]+) dB / voice\s+(-?[\d.]+) dB', l)
    g, t, s, v = m.group(1), float(m.group(2)), float(m.group(3)), float(m.group(4))
    assert abs(t - c['t']) < 0.002, (t, c)
    grades.append((g, s - v))

d = json.load(open(TIMING))
chars = [c for sc in d['scenes'] for c in sc['chars'] if c['e'] > c['t'] and not re.match(r'[，。？！、,.?!：:；;“”"…]', c['ch'])]
gaps = [(0.0, chars[0]['t'])] + [(a['e'], b['t']) for a, b in zip(chars, chars[1:]) if b['t'] - a['e'] >= 0.3] + [(chars[-1]['e'], 1e9)]


def find_shift(act, lo, hi):
    best = None
    for a, b in gaps:
        p0, p1 = a + 0.03, b - 0.08
        if p1 < p0:
            continue
        p = min(max(act, p0), p1)
        s = p - act
        if lo <= s <= hi and (best is None or abs(s) < abs(best)):
            best = s
    return best


keyc = {}
items = []
for c, (g, margin) in zip(cues, grades):
    k = keyc.get(c['note'], 0)
    keyc[c['note']] = k + 1
    key = f"{c['note']}|{k}"
    act = c['t'] + peaks.get(c['name'], 0.0)
    it = {'key': key, 'g': g, 'margin': margin, 'act': act, 'shift': 0.0, 'drop': False, 'note': c['note']}
    if g == 'MASKED':
        s = find_shift(act, -0.12, 0.30)
        if s is None:
            it['drop'] = True
        else:
            it['shift'] = s
    elif g == 'AUDIBLE':
        s = find_shift(act, -0.10, 0.20)
        if s is not None and abs(s) > 0.02:
            it['shift'] = s
    items.append(it)

rank = {'UNMASKED': 0, 'AUDIBLE': 1, 'MASKED': 2}
kept = [i for i in items if not i['drop']]
# 两条太近只留一条（留分级好的）
kept.sort(key=lambda i: i['act'] + i['shift'])
for a, b in zip(kept, kept[1:]):
    if a['drop'] or b['drop']:
        continue
    if (b['act'] + b['shift']) - (a['act'] + a['shift']) < 0.15:
        loser = b if (rank[b['g']], -b['margin']) > (rank[a['g']], -a['margin']) else a
        loser['drop'] = True
# 20s 窗口 ≤8 条
while True:
    kept = sorted([i for i in items if not i['drop']], key=lambda i: i['act'] + i['shift'])
    worst = None
    for i, a in enumerate(kept):
        win = [b for b in kept[i:] if (b['act'] + b['shift']) - (a['act'] + a['shift']) < 20]
        if len(win) > 8:
            cand = [b for b in win if b['g'] != 'UNMASKED' and b['shift'] == 0]
            if not cand:
                cand = [b for b in win if b['g'] != 'UNMASKED']
            worst = min(cand, key=lambda b: (-(rank[b['g']]), b['margin']))
            break
    if worst is None:
        break
    worst['drop'] = True

edit = {}
for i in items:
    if i['drop']:
        edit[i['key']] = {'drop': True}
    elif abs(i['shift']) > 0.02:
        edit[i['key']] = {'shift': round(i['shift'] * FPS)}
json.dump(edit, open(out_p, 'w'), ensure_ascii=False, indent=1)
n = len(items)
nd = sum(1 for i in items if i['drop'])
ns = sum(1 for i in items if not i['drop'] and abs(i['shift']) > 0.02)
print(f'共 {n} 条：删 {nd}，挪进气口 {ns}，留 {n - nd}（片长 {chars[-1]["e"]:.0f}s → 每 20s 约 {(n - nd) / chars[-1]["e"] * 20:.1f} 条）')
for i in items:
    tag = '删' if i['drop'] else (f"挪 {i['shift']:+.2f}s" if abs(i['shift']) > 0.02 else '留')
    print(f"{tag:10s} {i['g']:8s} {i['act']:8.2f}s  {i['note']}")
