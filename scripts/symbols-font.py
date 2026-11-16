# Builds compose/sample/src/wasmJsMain/resources/KometaSymbols.ttf, the Wasm previews' fallback for symbol glyphs
# (the browser build has no system fonts): Noto Sans Symbols 2 + Noto Sans Math (OFL), cut to the characters above
# U+2000 that the kit and the sample use, merged into one file. Rerun after adding a symbol to the Kotlin sources:
#   pip install fonttools && python scripts/symbols-font.py
import glob, io, os, tempfile, urllib.request
from fontTools import subset
from fontTools.merge import Merger
from fontTools.ttLib import TTFont

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(root, 'compose/sample/src/wasmJsMain/resources/KometaSymbols.ttf')
sources = {
    'NotoSansSymbols2-Regular': 'https://github.com/google/fonts/raw/main/ofl/notosanssymbols2/NotoSansSymbols2-Regular.ttf',
    'NotoSansMath-Regular': 'https://github.com/google/fonts/raw/main/ofl/notosansmath/NotoSansMath-Regular.ttf',
}

used = set()
for f in glob.glob(root + '/compose/sample/src/commonMain/kotlin/uz/kometa/sample/*.kt') + glob.glob(root + '/compose/kometa-ui/src/commonMain/kotlin/uz/kometa/ui/*.kt'):
    used |= {ord(c) for c in io.open(f, encoding='utf-8').read() if ord(c) > 0x2000}

tmp = tempfile.mkdtemp()
parts = []
for name, url in sources.items():
    path = os.path.join(tmp, name + '.ttf')
    urllib.request.urlretrieve(url, path)
    font = TTFont(path)
    have = set(font.getBestCmap())
    opts = subset.Options()
    opts.layout_features = []
    opts.name_IDs = ['*']
    # The merger cannot combine these tables across the two fonts; plain fallback glyphs do not need them.
    opts.drop_tables += ['MATH', 'GSUB', 'GPOS', 'GDEF', 'vhea', 'vmtx', 'VORG']
    s = subset.Subsetter(opts)
    s.populate(unicodes=used & have)
    s.subset(font)
    font.save(path)
    parts.append(path)
    used -= have

# Only the first font of a preloaded FontFamily serves as fallback, hence one merged file.
Merger().merge(parts).save(out)
print('wrote', out, os.path.getsize(out), 'bytes; not covered:', ' '.join(f'U+{c:04X}' for c in sorted(used)) or 'none')
