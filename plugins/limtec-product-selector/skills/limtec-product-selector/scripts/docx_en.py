#!/usr/bin/env python3
"""Rewrite a Lim-Tec proposal .docx into English.

The proposal template is bilingual (Chinese label + English label); this script
drops the Chinese half and translates the remaining Chinese text through
scripts/docx_tr.js, which shares the dictionary of the CLI (scripts/en_terms.js).

Usage: python3 scripts/docx_en.py in.docx out.docx
Exit:  0 ok, 2 no Chinese left (already English), 3 translation gaps remain
"""
import html
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
NODE_CANDIDATES = [
    "node",
    "/data/storage/el1/bundle/libs/arm64/node/bin/node",
]
W_T = re.compile(r"(<w:t(?![^>]*/>)(?:\s[^>]*)?>)(.*?)(</w:t>)", re.S)
CJK = re.compile(r"[\u4e00-\u9fff]")
PARTS = re.compile(r"^word/(document|header\d*|footer\d*)\.xml$")


def node_bin():
    for c in NODE_CANDIDATES:
        p = shutil.which(c) or (c if os.path.exists(c) else None)
        if p:
            return p
    return "node"


def translate(strings):
    tmp_in = tempfile.mktemp(suffix=".json")
    tmp_out = tempfile.mktemp(suffix=".json")
    with open(tmp_in, "w", encoding="utf-8") as f:
        json.dump(strings, f, ensure_ascii=False)
    r = subprocess.run([node_bin(), os.path.join(HERE, "docx_tr.js"), tmp_in, tmp_out],
                       capture_output=True, text=True)
    if r.returncode not in (0, 2, 3):
        print(r.stdout + r.stderr, file=sys.stderr)
        raise SystemExit("translation step failed: %s" % r.returncode)
    with open(tmp_out, encoding="utf-8") as f:
        out = json.load(f)
    os.remove(tmp_in)
    os.remove(tmp_out)
    return out, r.returncode, r.stderr


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        return 1
    src, dst = sys.argv[1], sys.argv[2]
    zin = zipfile.ZipFile(src)
    parts = [n for n in zin.namelist() if PARTS.match(n)]
    texts, seen = [], {}
    raw = {}
    for name in parts:
        data = zin.read(name).decode("utf-8")
        raw[name] = data
        for m in W_T.finditer(data):
            t = html.unescape(m.group(2))
            if (CJK.search(t) or "¥" in t or "￥" in t) and t not in seen:
                seen[t] = len(texts)
                texts.append(t)
    if not texts:
        print("docx 无中文，跳过")
        if os.path.abspath(src) != os.path.abspath(dst):
            shutil.copy2(src, dst)
        return 2

    out, code, err = translate(texts)
    mapping = {texts[i]: out[i] for i in range(len(texts))}
    if code == 3:
        print(err.strip(), file=sys.stderr)

    tmpdir = tempfile.mkdtemp(prefix="docx-en-")
    tmp_out = os.path.join(tmpdir, "out.docx")
    with zipfile.ZipFile(tmp_out, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename in raw:
                body = raw[item.filename]

                def repl(m):
                    t = html.unescape(m.group(2))
                    v = mapping.get(t, t)
                    #
                    #
                    if v != t:
                        v = v.strip()
                        if t[:1].isspace():
                            v = ' ' + v
                        if t[-1:].isspace():
                            v = v + ' '
                    return m.group(1) + html.escape(v, quote=False) + m.group(3)

                body = W_T.sub(repl, body)
                #
                #
                data = body.encode("utf-8")
            zout.writestr(item, data)
    zin.close()
    shutil.move(tmp_out, dst)
    shutil.rmtree(tmpdir, ignore_errors=True)
    print("已英文化：%s（%d 个文本节点，%d 条唯一中文）" % (dst, len(texts), len(mapping)))
    return 3 if code == 3 else 0


if __name__ == "__main__":
    sys.exit(main())
