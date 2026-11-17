"""成片响度归一：两遍 loudnorm 到 -14 LUFS（TP -1.5），视频流直接拷贝不重编码。

用法：
  $PY $KB/_tools/loudnorm.py in.mp4 out.mp4
"""
import json, subprocess, sys


def loudnorm_args(src):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", src, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json",
                        "-f", "null", "-"], capture_output=True, text=True)
    j = json.loads(r.stderr[r.stderr.rindex("{"): r.stderr.rindex("}") + 1])
    return (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
            f"measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")


if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-map", "0:v", "-map", "0:a", "-c:v", "copy",
                    "-af", loudnorm_args(src), "-ar", "48000", "-c:a", "aac", "-b:a", "192k",
                    "-movflags", "+faststart", dst], check=True)
    print("done:", dst)
