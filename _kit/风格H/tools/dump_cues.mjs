// 把 remotion/src/sfx.ts 的音效表导出成 cues.json（给 talkcraft sfx_check.py 用：t = 文件开头那一帧的秒数）
// 用法（期目录下）：node tools/dump_cues.mjs [输出路径，默认 qa/cues.json] [remotion 目录，默认 remotion]
// esbuild 从 remotion/node_modules（软链到 talkcraft runtime）解析，不写本机路径。
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const out = process.argv[2] || 'qa/cues.json';
const rem = path.resolve(process.argv[3] || 'remotion');
const require = createRequire(path.join(rem, 'package.json'));
const {build} = require('esbuild');
fs.mkdirSync(path.join(rem, 'out'), {recursive: true});
const tmp = path.join(rem, 'out', '_cues.mjs'); // 放在工程里，remotion / react 能从 node_modules 解析
await build({entryPoints: [path.join(rem, 'src/sfx.ts')], bundle: true, format: 'esm', platform: 'node', outfile: tmp, external: ['remotion', 'react'], loader: {'.json': 'json'}, logLevel: 'error'});
const m = await import(tmp + '?v=' + Date.now());
const cues = m.CUES.map((c) => ({t: +(c.f / 30).toFixed(3), name: c.file, vol: c.vol, note: c.note}));
fs.mkdirSync(path.dirname(out), {recursive: true});
fs.writeFileSync(out, JSON.stringify(cues, null, 1));
fs.rmSync(tmp, {force: true});
console.log(cues.length, 'cues →', out);
