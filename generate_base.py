import math
from PIL import Image

w, h = 800, 800
img = Image.new('RGB', (w, h))
pixels = img.load()

for x in range(w):
    for y in range(h):
        r = int(255 * (x / w))
        g = int(abs(math.sin((x+y)/100.0) * 255))
        b = int(255 * (y / h))
        pixels[x, y] = (r, g, b)

img.save('backend/assets/base.png')
