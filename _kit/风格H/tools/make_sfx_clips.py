"""音效裁剪：从 Freesound 预览（fs-<id>.mp3）裁出要用的一段，峰值烘到 -6 dBFS，加淡入淡出，记进 FREESOUND-CREDITS.md。
用法：python make_sfx_clips.py --dir remotion/public/audio/sfx [--clips tools/sfx_clips.json] [--only name1,name2]
clips 表：{"clips": [{name, src, from, to, fade_out, use}]}；use 末尾写峰值在裁后文件里的秒数（ffmpeg astats 或看波形），音效表按它对齐动作帧。
新采样：先用 video-shotcraft 的 sfx-source.py 搜（搜索词两个词以内）下到 --dir，追加 audio-manifest.json / FREESOUND-CREDITS.md 的来源条目，再加进 clips 表。"""
import argparse, os, subprocess, json, numpy as np
ap = argparse.ArgumentParser(); ap.add_argument('--dir', required=True)
ap.add_argument('--clips', default=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sfx_clips.json')); ap.add_argument('--only', default='')
A = ap.parse_args()
D = A.dir; TARGET = -6.0
CL = json.load(open(A.clips, encoding='utf-8'))['clips']
only = set(filter(None, A.only.split(',')))
lines = []
for c in CL:
    name, src, a, b, fo, use = c['name'], c['src'], c['from'], c['to'], c['fade_out'], c['use']
    if not only or name in only:
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(a), '-t', str(b - a), '-i', os.path.join(D, src), '-ac', '2', '-ar', '48000', '-f', 'f32le', '-'], capture_output=True).stdout
        x = np.frombuffer(raw, np.float32)
        g = TARGET - 20 * np.log10(np.abs(x).max() + 1e-9)
        af = f'volume={g:.2f}dB,afade=t=in:d=0.004,afade=t=out:st={max(0, b - a - fo):.3f}:d={fo}'
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', str(a), '-t', str(b - a), '-i', os.path.join(D, src), '-af', af, '-ar', '48000', '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '192k', os.path.join(D, f'{name}.mp3')], check=True)
        print(name, f'gain {g:+.1f}dB')
        c['_gain'] = round(float(g), 1)
    lines.append(f"- {src} → `{name}.mp3`：裁 {a:.2f}～{b:.2f}s" + (f"，增益 {c['_gain']:+.1f}dB" if '_gain' in c else '') + f"（峰值烘到 {TARGET} dBFS），淡出 {fo}s；{use}")
cred = os.path.join(D, 'FREESOUND-CREDITS.md')
txt = open(cred, encoding='utf-8').read() if os.path.exists(cred) else '# Freesound audio credits\n'
mark = '\n## 本期裁剪（tools/make_sfx_clips.py）\n'
open(cred, 'w', encoding='utf-8').write(txt.split(mark)[0] + mark + '\n'.join(lines) + '\n')
