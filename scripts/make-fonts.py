#!/usr/bin/env python3
"""
Self-hosted font builder (one-off; the output .woff2 files are committed).

Usage:
  npm i @fontsource-variable/inter @fontsource/cormorant-garamond \
        @fontsource-variable/montserrat @fontsource-variable/playfair-display \
        @fontsource-variable/oswald @fontsource-variable/nunito \
        @fontsource-variable/dancing-script          # in any scratch dir
  pip install fonttools brotli skia-pathops
  python3 scripts/make-fonts.py <scratch>/node_modules assets/fonts

Every family is shipped as two tiny files per style:
  *-lat.woff2  Basic Latin + Latin-1 (ç ö ü Ç Ö Ü, punctuation)
  *-tr.woff2   Turkish extras only (ğ Ğ ı İ ş Ş) + ₺
The CSS wires them up with unicode-range so the browser only downloads
what the page needs. All fonts are SIL OFL 1.1.
"""
import os
import sys
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.ttLib.removeOverlaps import removeOverlaps

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)

LAT = list(range(0x20, 0x7F)) + list(range(0xA0, 0x100)) + [
    0x2013, 0x2014, 0x2018, 0x2019, 0x201A, 0x201C, 0x201D, 0x201E,
    0x2022, 0x2026, 0x2122, 0x131,
]
TR = [0x11E, 0x11F, 0x130, 0x15E, 0x15F, 0x20BA, 0x307]


def fp(pkg, name):
    return os.path.join(SRC, pkg, "files", name)


def build(src, dst, unicodes, pin=None, limit=None):
    font = TTFont(src)
    if "fvar" in font:
        if pin:
            font = instancer.instantiateVariableFont(font, pin)
        elif limit:
            font = instancer.instantiateVariableFont(font, limit)
    if "fvar" not in font and "glyf" in font:
        # Önizlemede kontur çizgisi (stroke) kullandığımız için üst üste binen konturları birleştir
        removeOverlaps(font)
    if "gvar" in font and ".notdef" not in font["gvar"].variations:
        font["gvar"].variations[".notdef"] = []  # fontsource files ship without it
    opts = subset.Options()
    opts.layout_features = ["kern", "liga", "calt", "locl", "ccmp", "mark", "mkmk"]
    opts.flavor = "woff2"
    opts.notdef_outline = True
    opts.name_IDs = [1, 2]
    opts.drop_tables += ["DSIG", "STAT"]
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=unicodes)
    sub.subset(font)
    font.flavor = "woff2"
    font.save(dst)
    print(f"{os.path.basename(dst):42s} {os.path.getsize(dst):>7d} B")


JOBS = [
    # UI fonts
    ("@fontsource-variable/inter", "inter-latin-wght-normal.woff2", "inter-latin-ext-wght-normal.woff2",
     "inter", dict(limit={"wght": (400, 700)})),
    ("@fontsource/cormorant-garamond", "cormorant-garamond-latin-600-normal.woff2",
     "cormorant-garamond-latin-ext-600-normal.woff2", "cormorant-600", {}),
    ("@fontsource/cormorant-garamond", "cormorant-garamond-latin-600-italic.woff2",
     "cormorant-garamond-latin-ext-600-italic.woff2", "cormorant-600i", {}),
    # Sign lettering fonts (wizard only) - pinned to one weight each
    ("@fontsource-variable/montserrat", "montserrat-latin-wght-normal.woff2",
     "montserrat-latin-ext-wght-normal.woff2", "montserrat-700", dict(pin={"wght": 700})),
    ("@fontsource-variable/playfair-display", "playfair-display-latin-wght-normal.woff2",
     "playfair-display-latin-ext-wght-normal.woff2", "playfair-700", dict(pin={"wght": 700})),
    ("@fontsource-variable/oswald", "oswald-latin-wght-normal.woff2",
     "oswald-latin-ext-wght-normal.woff2", "oswald-600", dict(pin={"wght": 600})),
    ("@fontsource-variable/nunito", "nunito-latin-wght-normal.woff2",
     "nunito-latin-ext-wght-normal.woff2", "nunito-800", dict(pin={"wght": 800})),
    ("@fontsource-variable/dancing-script", "dancing-script-latin-wght-normal.woff2",
     "dancing-script-latin-ext-wght-normal.woff2", "dancing-700", dict(pin={"wght": 700})),
]

for pkg, lat, ext, key, kw in JOBS:
    build(fp(pkg, lat), os.path.join(OUT, f"{key}-lat.woff2"), LAT, **kw)
    build(fp(pkg, ext), os.path.join(OUT, f"{key}-tr.woff2"), TR, **kw)
