"""Export raster brand assets from the approved source; requires Pillow.
Run from anywhere: python3 branding/generate-assets.py
No redraw, vector conversion, or source modification. See branding/README.md.
"""
from pathlib import Path
from math import hypot
from PIL import Image, ImageDraw, ImageFont

RESAMPLING = getattr(Image, 'Resampling', Image)
ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'branding/beta-drips-icon-source.png'
GREEN = '#004634'
CREAM = '#fdf9ee'
source = Image.open(SOURCE).convert('RGB')
# Red separates the source's cream artwork from its dark green field.
# Keep opaque artwork pixels unchanged; matte only the original edge pixels.
alpha = source.getchannel('R').point(lambda r: round(max(0, min(1, (r - 40) / 195)) * 255))
bounds = alpha.getbbox()
mark = source.convert('RGBA')
mark.putalpha(alpha)
# Unmatte partially transparent edge pixels to avoid green outlines on transparency.
for y in range(bounds[1], bounds[3]):
    for x in range(bounds[0], bounds[2]):
        r, g, b, a = mark.getpixel((x, y))
        if 0 < a < 255:
            mark.putpixel((x, y), (253, 249, 238, a))
mark = mark.crop(bounds)

# Opaque exports retain the source's actual green field and cream texture.
# A tighter square crop improves small-icon readability without clipping the mark.
side = round(max(mark.size) / .86)
cx, cy = (bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2
left, top = round(cx - side / 2), round(cy - side / 2)
opaque = source.crop((left, top, left + side, top + side))
web, mobile = ROOT / 'public', ROOT / 'mobile/assets'
web.mkdir(exist_ok=True)
(web / 'branding').mkdir(exist_ok=True)
for size in (16, 32):
    opaque.resize((size, size), RESAMPLING.LANCZOS).save(web / f'favicon-{size}.png')
opaque.resize((256, 256), RESAMPLING.LANCZOS).save(web / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
opaque.resize((180, 180), RESAMPLING.LANCZOS).save(web / 'apple-touch-icon.png')
header = opaque.resize((256, 256), RESAMPLING.LANCZOS)
header.save(web / 'branding/beta-drips-mark.png')
header.save(mobile / 'brand-mark.png')
opaque.resize((1024, 1024), RESAMPLING.LANCZOS).save(mobile / 'icon.png')

# Fit every visible pixel within the central 66/108 safe circle, with extra margin.
# No circle/squircle is baked into the foreground; Android supplies its own mask.
w, h = mark.size
radius = max(hypot(x - w / 2, y - h / 2) for y in range(h) for x in range(w) if mark.getpixel((x, y))[3] > 0)
scale = (1024 * 66 / 108 / 2 - 8) / radius
scaled = mark.resize((round(w * scale), round(h * scale)), RESAMPLING.LANCZOS)
foreground = Image.new('RGBA', (1024, 1024))
foreground.alpha_composite(scaled, ((1024 - scaled.width) // 2, (1024 - scaled.height) // 2))
foreground.save(mobile / 'android-icon-foreground.png')
Image.new('RGB', (1024, 1024), GREEN).save(mobile / 'android-icon-background.png')
monochrome = Image.new('RGBA', (1024, 1024), 'white')
monochrome.putalpha(foreground.getchannel('A'))
monochrome.save(mobile / 'android-icon-monochrome.png')
splash = Image.new('RGBA', (1024, 1024))
size = (800, round(h / w * 800))
splash_mark = mark.resize(size, RESAMPLING.LANCZOS)
splash.alpha_composite(splash_mark, ((1024 - size[0]) // 2, (1024 - size[1]) // 2))
splash.save(mobile / 'splash-mark.png')

# Asset/mask previews, not screenshots or native build verification.
preview = Image.new('RGB', (1060, 650), '#faf8f5')
draw = ImageDraw.Draw(preview)
font_path = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
font = ImageFont.truetype(font_path, 18)
bold = ImageFont.truetype(font_path.replace('.ttf', '-Bold.ttf'), 26)
draw.text((24, 16), 'Approved raster logo: asset and mask previews', fill=GREEN, font=bold)
preview.paste(opaque.resize((140, 140)), (24, 74))
draw.text((24, 222), 'App / touch icon', fill=GREEN, font=font)
# Android's 72dp masked viewport is cropped from the 108dp layers.
composite = Image.new('RGBA', (1024, 1024), GREEN)
composite.alpha_composite(foreground)
inset = round(1024 * 18 / 108)
viewport = composite.crop((inset, inset, 1024 - inset, 1024 - inset)).resize((140, 140), RESAMPLING.LANCZOS)
for kind, x in [('Circle', 220), ('Squircle', 416)]:
    mask = Image.new('L', (560, 560))
    md = ImageDraw.Draw(mask)
    if kind == 'Circle':
        md.ellipse((0, 0, 559, 559), fill=255)
    else:
        for y in range(560):
            for xx in range(560):
                if abs((xx - 279.5) / 279.5) ** 4 + abs((y - 279.5) / 279.5) ** 4 <= 1:
                    mask.putpixel((xx, y), 255)
    preview.paste(viewport, (x, 74), mask.resize((140, 140), RESAMPLING.LANCZOS))
    draw.text((x, 222), 'Adaptive ' + kind.lower(), fill=GREEN, font=font)
for size, x in [(16, 24), (32, 220), (48, 416)]:
    small = opaque.resize((size, size), RESAMPLING.LANCZOS)
    preview.paste(small, (x, 300))
    preview.paste(small.resize((96, 96), RESAMPLING.NEAREST), (x + 65, 278))
    draw.text((x, 390), f'{size}px + pixel zoom', fill=GREEN, font=font)
preview.paste(header.resize((56, 56)), (24, 468))
draw.text((94, 472), 'Beta Drips', fill=GREEN, font=bold)
draw.text((24, 542), 'Exceptional fashion. Nigerian brands.', fill=GREEN, font=font)
draw.text((24, 601), 'Raster previews; final launcher/splash checks await standalone build.', fill=GREEN, font=font)
preview.paste(Image.new('RGB', (290, 480), GREEN), (724, 74))
sm = splash.resize((200, 200), RESAMPLING.LANCZOS)
preview.paste(sm, (769, 214), sm)
draw.text((724, 570), 'Splash mark / solid green', fill=GREEN, font=font)
preview.save(ROOT / 'branding/asset-preview.png')
print('Source bounds', bounds, 'adaptive artwork', scaled.size, 'on transparent 1024px canvas')
print('Derived website/mobile assets and branding/asset-preview.png')
