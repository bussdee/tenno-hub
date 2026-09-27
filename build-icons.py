#!/usr/bin/env python3
"""
Generates PNG icons for TENNO.HUB from the SVG logo glyph.
Outputs:
  icons/icon-192.png
  icons/icon-512.png
  icons/apple-touch-icon.png  (180x180, iOS)
  icons/favicon.png            (32x32)
"""
import os, math
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(__file__), 'icons')
os.makedirs(OUT, exist_ok=True)

GOLD  = (200, 168,  75, 255)
VOID  = ( 88, 196, 240, 255)
BG    = ( 14,  20,  31, 255)   # slightly lighter than --bg, looks better as icon
BG_PAD= (  7,  10,  16, 255)

def regular_polygon(cx, cy, r, n, rot_deg=0):
    pts = []
    for i in range(n):
        a = math.radians(rot_deg + i * (360.0 / n))
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts

def render_icon(size, padded=True):
    img = Image.new('RGBA', (size, size), (0,0,0,0))
    d = ImageDraw.Draw(img)

    # background rounded square
    pad = size // 12 if padded else 0
    radius = size // 8
    bg_box = [pad, pad, size-pad, size-pad]
    d.rounded_rectangle(bg_box, radius=radius, fill=BG_PAD, outline=GOLD, width=max(1, size//128))

    # outer hexagon
    cx = cy = size / 2
    r_outer = (size - 2*pad) * 0.42
    d.polygon(regular_polygon(cx, cy, r_outer, 6, rot_deg=-90),
              outline=GOLD, fill=None, width=max(2, size//96))

    # inner hexagon (void blue, semi-transparent)
    r_inner = r_outer * 0.62
    inner = Image.new('RGBA', (size, size), (0,0,0,0))
    di = ImageDraw.Draw(inner)
    di.polygon(regular_polygon(cx, cy, r_inner, 6, rot_deg=-90),
               outline=VOID + (), fill=None, width=max(2, size//96))
    img.alpha_composite(inner)

    # central dot (gold)
    dot_r = size * 0.045
    d.ellipse([cx-dot_r, cy-dot_r, cx+dot_r, cy+dot_r], fill=GOLD)

    # six radial accent lines
    line_w = max(2, size//96)
    for i in range(6):
        a = math.radians(-90 + i*60)
        x1 = cx + r_inner * 0.95 * math.cos(a)
        y1 = cy + r_inner * 0.95 * math.sin(a)
        x2 = cx + r_outer * 0.95 * math.cos(a)
        y2 = cy + r_outer * 0.95 * math.sin(a)
        d.line([(x1,y1),(x2,y2)], fill=GOLD, width=line_w)

    return img

# Standard PWA icons
render_icon(192).save(os.path.join(OUT, 'icon-192.png'))
render_icon(512).save(os.path.join(OUT, 'icon-512.png'))
# Apple touch icon: solid background, no transparency around edges
render_icon(180, padded=False).save(os.path.join(OUT, 'apple-touch-icon.png'))
# Maskable variant (full bleed, more padding inside): same approach with smaller content
def render_maskable(size):
    img = Image.new('RGBA', (size, size), BG_PAD)
    d = ImageDraw.Draw(img)
    cx = cy = size/2
    r_outer = size * 0.32
    d.polygon(regular_polygon(cx, cy, r_outer, 6, -90), outline=GOLD, width=max(2, size//72))
    r_inner = r_outer * 0.62
    d.polygon(regular_polygon(cx, cy, r_inner, 6, -90), outline=VOID, width=max(2, size//96))
    dot_r = size * 0.04
    d.ellipse([cx-dot_r, cy-dot_r, cx+dot_r, cy+dot_r], fill=GOLD)
    return img
render_maskable(512).save(os.path.join(OUT, 'icon-maskable-512.png'))
# Favicon
render_icon(32, padded=False).save(os.path.join(OUT, 'favicon.png'))

print("Generated:", os.listdir(OUT))
