"""查看某段时间里的逐字时间（funasr_transcribe.py 的输出）。
用法：$PY $KB/_tools/chars.py <转写.json> <起秒> <止秒>
"""
import json, re, sys
f, t0, t1 = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
d = json.load(open(f))
out = []
for s in d['sentences']:
    toks = re.findall(r'[A-Za-z]+|[^\sA-Za-z，。？！、,.?!]', s['text'])  # 英文词按一个 token 算
    for tk, (a, b) in zip(toks, s['ts']):
        if t0 - 0.01 <= a <= t1: out.append(f'{tk}{a:.2f}-{b:.2f}')
print(' '.join(out))
