#!/usr/bin/env python3
"""Assemble one self-contained HTML guide (Clear + Lexend house style).

    python3 build.py CONTENT.js -o OUT.html [--lang en|it]

CONTENT.js defines GUIDE, PAGES, NAV, DIAGRAMS (see references/content.md).
Fonts are embedded as base64 WOFF2: the output makes no network request.
"""
import argparse, base64, json, pathlib, re, sys

TPL = pathlib.Path(__file__).resolve().parent.parent / 'assets' / 'template'
FONTS = [  # family, file, weight range
    ('Atkinson Hyperlegible Next', 'ahn.woff2', '200 800'),
    ('Atkinson Hyperlegible Mono', 'ahm.woff2', '200 800'),
    ('Lexend', 'lexend.woff2', '500 800'),
]
LICENSE = ('/* Fonts embedded as WOFF2 (Latin subset), SIL Open Font License 1.1:\n'
           '   Atkinson Hyperlegible Next and Mono (c) The Atkinson Hyperlegible Next/Mono Project Authors, Braille Institute;\n'
           '   Lexend (c) 2019 The Lexend Project Authors. */\n')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('content'); ap.add_argument('-o', '--out', required=True)
    ap.add_argument('--lang', help='UI language (default: GUIDE.lang in the content, else en)')
    a = ap.parse_args()

    content = pathlib.Path(a.content).read_text()
    m = re.search(r"\blang:\s*['\"]([a-z]{2})['\"]", content)
    lang = a.lang or (m.group(1) if m else 'en')
    strings = json.loads((TPL / 'i18n.json').read_text())
    if lang not in strings:
        sys.exit(f'Unknown UI language {lang!r}. Add it to assets/template/i18n.json (available: {", ".join(strings)}).')
    T = strings[lang]
    t = re.search(r"\btitle:\s*'((?:[^'\\]|\\.)*)'", content) or re.search(r'\btitle:\s*"((?:[^"\\]|\\.)*)"', content)
    title = t.group(1).replace("\\'", "'") if t else 'Guide'

    fonts = LICENSE + ''.join(
        f'@font-face{{font-family:"{fam}";src:url(data:font/woff2;base64,'
        f'{base64.b64encode((TPL / "fonts" / f).read_bytes()).decode()}) format("woff2");'
        f'font-weight:{w};font-style:normal;font-display:swap}}\n' for fam, f, w in FONTS)
    css = (TPL / 'style.css').read_text().replace('/*FONTS*/', fonts)

    def esc(s): return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')
    shell = (TPL / 'shell.html').read_text()
    shell = shell.replace('{{guideTitle}}', esc(title))
    shell = re.sub(r'\{\{(\w+)\}\}', lambda k: esc(T[k.group(1)]), shell)

    js = (f'const T = {json.dumps(T, ensure_ascii=False)};\n' + (TPL / 'helpers.js').read_text() + '\n'
          + content + '\n' + (TPL / 'engine.js').read_text())
    if '</script' in js.lower():
        sys.exit('The content contains "</script". Write it as "<\\/script" inside JS strings.')
    head = ('<script>(function(){var d=document.documentElement,t=null;try{t=localStorage.getItem("guide.theme")}catch(e){}'
            'd.setAttribute("data-theme",t==="dark"||t==="light"?t:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"))})()</script>')
    html = f'''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>{esc(title)}</title>
{head}
<style>
{css}</style>
</head>
<body>
{shell}<script>
'use strict';
{js}</script>
</body>
</html>
'''
    out = pathlib.Path(a.out); out.parent.mkdir(parents=True, exist_ok=True); out.write_text(html)
    print(f'{out} · {len(html.encode()) // 1024} KB · UI {lang}')


if __name__ == '__main__':
    main()
