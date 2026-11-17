"""风格A 防重复检查：读本期 shots.json（每镜一行元数据），按轮换规则打分。
用法：$PY tools/variety_lint.py shots.json
shots.json：{"wipes": [{"at": 12.99, "kind": "prism"}, ...],
            "shots": [{"id": "L01", "in": 0, "out": 1.44, "card": "TiltPrice", "host": "CHIP_BL", "bg": "aurora",
                       "entry": "glassIn", "motif": false}, ...]}
card = 主卡名（无卡写 "none" = 呼吸镜）；entry = 主动作（glassIn / slabIn / focus / pop / fly / rise / flip / coin / reveal / draw / bleed）；
motif = true 表示刻意回扣（允许重复用同一张卡）；host 写 HIDE_BR 等 = 人物退场（R9 管它的时长）。
"""
import json, sys
from collections import Counter

S = json.load(open(sys.argv[1]))
shots, wipes = S['shots'], S.get('wipes', [])
total = shots[-1]['out'] - shots[0]['in']
fails, warns = [], []

# R1 同一张卡全片 ≤2 次（motif 除外），两次之间 ≥45s
seen = {}
for s in shots:
    c = s['card']
    if c == 'none' or s.get('motif'):
        continue
    seen.setdefault(c, []).append(s)
for c, ss in seen.items():
    if len(ss) > 2:
        fails.append(f"R1 卡片 {c} 用了 {len(ss)} 次（{', '.join(x['id'] for x in ss)}），上限 2")
    for a, b in zip(ss, ss[1:]):
        if b['in'] - a['in'] < 45:
            fails.append(f"R1 卡片 {c} 在 {a['id']}→{b['id']} 间隔 {b['in'] - a['in']:.0f}s < 45s")

# R2 人物形态：连续 3 镜不同形态；单一形态时长 ≤35%
for a, b, c in zip(shots, shots[1:], shots[2:]):
    if a['host'] == b['host'] == c['host']:
        fails.append(f"R2 人物形态 {a['host']} 连续 3 镜（{a['id']}–{c['id']}）")
dur = Counter()
for s in shots:
    dur[s['host']] += s['out'] - s['in']
for h, d in dur.items():
    if d / total > 0.35:
        fails.append(f"R2 人物形态 {h} 占 {d / total:.0%} > 35%")

# R3 任意 30s 窗口里 ≥4 种不同的卡
t = shots[0]['in']
while t + 30 <= shots[-1]['out']:
    cards = {s['card'] for s in shots if s['out'] > t and s['in'] < t + 30 and s['card'] != 'none'}
    if len(cards) < 4:
        fails.append(f"R3 {t:.0f}–{t + 30:.0f}s 只有 {len(cards)} 种卡：{sorted(cards)}")
    t += 5

# R4 主动作：连续 3 镜不同
for a, b, c in zip(shots, shots[1:], shots[2:]):
    if a['entry'] == b['entry'] == c['entry']:
        fails.append(f"R4 主动作 {a['entry']} 连续 3 镜（{a['id']}–{c['id']}）")
ent = Counter(s['entry'] for s in shots)
if len(ent) < 6:
    warns.append(f"R4 全片只有 {len(ent)} 种主动作：{dict(ent)}")

# R5 幕底：每 45s 内至少换一次；全片 ≥4 款
last, last_t = shots[0]['bg'], shots[0]['in']
for s in shots:
    if s['bg'] != last:
        last, last_t = s['bg'], s['in']
    elif s['out'] - last_t > 45:
        fails.append(f"R5 幕底 {last} 从 {last_t:.0f}s 一直到 {s['out']:.0f}s 没换")
        last_t = s['out']
bgs = {s['bg'] for s in shots}
if len(bgs) < 4:
    fails.append(f"R5 全片只有 {len(bgs)} 款幕底")

# R6 呼吸：每 40s 至少一个"人物大 + 包装少"的镜（card=none 或 host 是 FULL*/WIN*/PORTRAIT*/TILT*）
calm = [s for s in shots if not s['host'].startswith('HIDE') and (s['card'] == 'none' or s['host'].startswith(('FULL', 'WIN', 'PORTRAIT', 'TILT')))]
t = shots[0]['in']
while t + 40 <= shots[-1]['out']:
    if not any(s['out'] > t and s['in'] < t + 40 for s in calm):
        fails.append(f"R6 {t:.0f}–{t + 40:.0f}s 没有人物为主的镜头")
    t += 10

# R9 人物退场（HIDE_*）：单次连续 ≤10s，全片 ≤30%；退场镜必须是信息密的卡或实拍（card 不能是 none）；
#    开场前 3 秒、最后一镜不退
hid = [s for s in shots if s['host'].startswith('HIDE')]
run_start = None
for i, s in enumerate(shots):
    h = s['host'].startswith('HIDE')
    if h and run_start is None:
        run_start = s['in']
    if run_start is not None and (not h or i == len(shots) - 1):
        end = s['out'] if h else s['in']
        if end - run_start > 10:
            fails.append(f"R9 人物从 {run_start:.1f}s 退场到 {end:.1f}s，连续 {end - run_start:.1f}s > 10s")
        run_start = None
hid_t = sum(s['out'] - s['in'] for s in hid)
if hid_t / total > 0.30:
    fails.append(f"R9 人物退场合计 {hid_t:.0f}s，占 {hid_t / total:.0%} > 30%")
for s in hid:
    if s['card'] == 'none':
        fails.append(f"R9 {s['id']} 人物退场却没有卡——退场只给信息密的镜头")
    if s['in'] < 3 or s is shots[-1]:
        fails.append(f"R9 {s['id']} 开场 3 秒内 / 最后一镜不要让人物退场")

# R7 擦屏：每分钟 ≤4 次，相邻两次种类不同
if wipes:
    if len(wipes) / (total / 60) > 4:
        fails.append(f"R7 擦屏 {len(wipes)} 次 / {total / 60:.1f} 分钟，超过每分钟 4 次")
    for a, b in zip(wipes, wipes[1:]):
        if a['kind'] == b['kind']:
            fails.append(f"R7 擦屏 {a['at']}s 和 {b['at']}s 都是 {a['kind']}")

# R8 重击（slabIn / coin）相邻 ≥8s
hits = [s for s in shots if s['entry'] in ('slabIn', 'coin')]
for a, b in zip(hits, hits[1:]):
    if b['in'] - a['in'] < 8:
        warns.append(f"R8 重击 {a['id']}→{b['id']} 只隔 {b['in'] - a['in']:.1f}s")

print(f"人物退场 {len(hid)} 镜 / {hid_t:.0f}s（{hid_t / total:.0%}）")
print(f"{len(shots)} 镜 / {total:.0f}s · 卡 {len({s['card'] for s in shots})} 种 · 主动作 {len(ent)} 种 · 幕底 {len(bgs)} 款 · 人物形态 {len(dur)} 种 · 擦屏 {len(wipes)} 次")
for w in warns:
    print('WARN', w)
for f in fails:
    print('FAIL', f)
print('PASS' if not fails else f'{len(fails)} FAIL')
sys.exit(1 if fails else 0)
