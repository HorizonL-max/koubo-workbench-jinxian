"""FunASR 字级时间戳 + 口播稿 → timestamps.json（复用 talkcraft timestamps_cpu.align 的逐字对齐与质检）。"""
import json, re, sys
import os
from pathlib import Path
KB = Path(__file__).resolve().parent.parent
def find_skill(name, env):
    if os.environ.get(env): return Path(os.path.expanduser(os.environ[env]))
    for d in (KB / "vendor" / name, Path.home() / ".claude/skills" / name, Path.home() / ".agents/skills" / name):
        if (d / "SKILL.md").exists(): return d
    sys.exit(f"找不到 {name}，先跑 bash setup/install.sh")
sys.path.insert(0, str(find_skill("video-talkcraft", "TALKCRAFT") / "scripts"))
import timestamps_cpu as tc
import soundfile as sf
from funasr import AutoModel
wav, script, out = sys.argv[1:4]
m = AutoModel(model="paraformer-zh", vad_model="fsmn-vad", punc_model="ct-punc", disable_update=True, disable_pbar=True)
res = m.generate(input=wav, batch_size_s=300, sentence_timestamp=True)[0]
words = []
for s in res["sentence_info"]:
    toks = re.findall(r"[A-Za-z]+|[^\sA-Za-z，。？！、,.?!]", s["text"])
    words += [{"text": t, "start": a / 1000, "end": b / 1000} for t, (a, b) in zip(toks, s["timestamp"])]
json.dump(words, open(out.replace(".json", ".asr_words.json"), "w"), ensure_ascii=False)
sents = json.load(open(script))["sentences"]
r = tc.align(sents, words)
info = sf.info(wav); r["sr"] = info.samplerate; r["total"] = info.duration
json.dump(r, open(out, "w"), ensure_ascii=False, indent=1)
bad = [s for s in r["sentences"] if not s.get("ok")]
print(len(r["sentences"]), "sentences;", len(bad), "low-match")
for s in bad: print(f"  [{s['i']}] match={s['match']:.2f} {s['start']:.2f}-{s['end']:.2f} {s['text']} | asr={s.get('asr','')}")
