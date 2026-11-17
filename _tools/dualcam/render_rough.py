"""双机位粗剪：同一份 edl.json 出两条帧级同步的竖屏人物视频 + 主机位音轨。
- host_cu.mp4（近景）/ host_ms.mp4（中景）：默认 1440×2560、30fps、每岛精确帧数，两条总帧数完全一致；无音轨
- narration.wav：主机位声音，highpass + 固定增益 + 每岛几毫秒淡入淡出，48k 立体声
- HLG / PQ 素材先转 SDR bt709（场地预设 hlg_to_sdr.filter），中景再做调色对齐（grade_ffmpeg.ms）
- 中景晚开机：ms_in < 0 的帧补黑（只在开头），打印补了多少帧——写进粗剪交接，分镜别在这段用中景
用法（期目录下）：
  python render_rough.py --edl edl.json --cu <近景素材> --ms <中景素材> --out <素材文件夹>/剪辑缓存/rough \\
      --venue 场地预设.json [audio cu ms]（默认三样都做）
  可选覆盖：--tonemap '<滤镜>'（'' = 素材已经是 SDR）、--grade-cu / --grade-ms '<,开头的滤镜>'、--gain-db 16、--highpass 70、
           --size 1440x2560、--crf 15、--from-island K（只真出第 K 个岛起，前面用黑帧占位，总帧数不变：缓存删了以后补片尾用）
段缓存在 <out>/seg/，按 机位+入点+帧数 复用：改 EDL 后重跑只重出变了的岛。
循环里打印 PROGRESS n/N，可以用 prog 包着跑。"""
import argparse, json, subprocess, os, math
from concurrent.futures import ThreadPoolExecutor


def parse(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('what', nargs='*', default=[])
    ap.add_argument('--edl', default='edl.json'); ap.add_argument('--cu', required=True); ap.add_argument('--ms')
    ap.add_argument('--out', required=True); ap.add_argument('--venue')
    ap.add_argument('--tonemap'); ap.add_argument('--grade-cu'); ap.add_argument('--grade-ms')
    ap.add_argument('--gain-db', type=float); ap.add_argument('--highpass', type=float); ap.add_argument('--fade', type=float)
    ap.add_argument('--audio-cam', choices=['cu', 'ms'])
    ap.add_argument('--size', default='1440x2560'); ap.add_argument('--crf', default='15'); ap.add_argument('--jobs', type=int, default=3)
    ap.add_argument('--from-island', type=int, default=0)
    return ap.parse_args(argv)


class Job:
    def __init__(self, A):
        V = json.load(open(A.venue, encoding='utf-8')) if A.venue else {}
        pick = lambda cli, path, dflt: cli if cli is not None else _get(V, path, dflt)
        self.E = json.load(open(A.edl, encoding='utf-8')); self.FPS = self.E['fps']
        self.SRC = {'cu': A.cu, 'ms': A.ms}
        self.OUT = A.out; self.RD = f'{A.out}/seg'; os.makedirs(self.RD, exist_ok=True)
        self.W, self.H = map(int, A.size.lower().split('x'))
        tm = pick(A.tonemap, ['hlg_to_sdr', 'filter'], '')
        self.TONEMAP = (',' + tm) if tm else ''
        self.GRADE = {'cu': pick(A.grade_cu, ['grade_ffmpeg', 'cu'], ''), 'ms': pick(A.grade_ms, ['grade_ffmpeg', 'ms'], '')}
        self.GAIN = pick(A.gain_db, ['audio', 'gain_db'], 0.0); self.HP = pick(A.highpass, ['audio', 'highpass_hz'], 70)
        self.FADE = pick(A.fade, ['audio', 'island_fade_s'], 0.008); self.ACAM = pick(A.audio_cam, ['audio', 'main_cam'], 'cu')
        self.ENC = ['-c:v', 'libx264', '-preset', 'medium', '-crf', str(A.crf), '-g', '30', '-pix_fmt', 'yuv420p',
                    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-an']
        self.jobs = A.jobs; self.k0 = A.from_island

    def black(self, path, n):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', f'color=c=black:s={self.W}x{self.H}:r={self.FPS}', '-frames:v', str(n)] + self.ENC + [path], check=True)

    def seg(self, cam, k, i):
        t = i['in'] if cam == 'cu' else i['ms_in']
        n = i['frames']; v = f'{self.RD}/{cam}_{t:.4f}_{n}.mp4'
        if os.path.exists(v) and os.path.getsize(v) > 0: return v
        vf = f'fps={self.FPS}{self.TONEMAP}{self.GRADE[cam]},scale={self.W}:{self.H}:flags=lanczos,format=yuv420p'
        src = self.SRC[cam]
        if t < 0:  # 这个机位还没开机：前 pre 帧黑，后面接素材 0 秒起
            pre = math.ceil(-t * self.FPS - 1e-6); b, r = v + '.b.mp4', v + '.r.mp4'
            self.black(b, pre)
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t + pre / self.FPS:.4f}', '-i', src, '-map', '0:v:0', '-vf', vf,
                            '-frames:v', str(n - pre)] + self.ENC + [r], check=True)
            lst = v + '.txt'; open(lst, 'w').write(f"file '{os.path.basename(b)}'\nfile '{os.path.basename(r)}'\n")
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', v], check=True)
            for f in (b, r, lst): os.remove(f)
            print(f'  {cam} #{k:02d}: 前 {pre} 帧补黑（这个机位还没开机）', flush=True)
            return v
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.4f}', '-i', src, '-map', '0:v:0', '-vf', vf,
                        '-frames:v', str(n)] + self.ENC + [v], check=True)
        return v

    def video(self, cam):
        isl = self.E['islands']; k0 = self.k0; done = [0]; todo = list(enumerate(isl))[k0:]
        def job(a):
            r = self.seg(cam, *a); done[0] += 1
            print(f'PROGRESS {done[0]}/{len(todo)} {cam}', flush=True); return r
        with ThreadPoolExecutor(self.jobs) as ex: vl = list(ex.map(job, todo))
        if k0 > 0:
            pre = sum(i['frames'] for i in isl[:k0]); ph = f'{self.RD}/black_{pre}.mp4'
            if not (os.path.exists(ph) and os.path.getsize(ph) > 0): self.black(ph, pre)
            vl = [ph] + vl
            print(f'  {cam}: 岛 0–{k0 - 1} 用 {pre} 帧黑帧占位', flush=True)
        name = f'host_{cam}_tail.mp4' if k0 > 0 else f'host_{cam}.mp4'
        lst = f'{self.RD}/{cam}.txt'; open(lst, 'w').write(''.join(f"file '{os.path.basename(x)}'\n" for x in vl))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', '-movflags', '+faststart', f'{self.OUT}/{name}'], check=True)

    def audio(self):
        al = []; src = self.SRC[self.ACAM]; key = 'in' if self.ACAM == 'cu' else 'ms_in'
        for i in self.E['islands']:
            dur = i['frames'] / self.FPS; a = f"{self.RD}/a_{self.ACAM}_{i[key]:.4f}_{i['frames']}.wav"; al.append(a)
            if os.path.exists(a): continue
            fd = self.FADE
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f"{i[key]:.4f}", '-t', f'{dur:.5f}', '-i', src, '-map', '0:a:0',
                            '-af', f'highpass=f={self.HP},volume={self.GAIN}dB,afade=t=in:d={fd},afade=t=out:st={dur - fd:.4f}:d={fd}',
                            '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', a], check=True)
        lst = f'{self.RD}/a.txt'; open(lst, 'w').write(''.join(f"file '{os.path.basename(x)}'\n" for x in al))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'pcm_s16le', f'{self.OUT}/narration.wav'], check=True)


def _get(d, path, dflt):
    for k in path:
        if not isinstance(d, dict) or k not in d: return dflt
        d = d[k]
    return d


def main(argv=None):
    A = parse(argv); J = Job(A)
    what = A.what or (['audio', 'cu', 'ms'] if A.ms else ['audio', 'cu'])
    if 'ms' in what and not A.ms: raise SystemExit('要出中景就给 --ms')
    if 'audio' in what and A.from_island == 0: J.audio(); print('audio done', flush=True)
    with ThreadPoolExecutor(2) as ex: list(ex.map(J.video, [c for c in ('cu', 'ms') if c in what]))
    print('done', flush=True)


if __name__ == '__main__':
    main()
