from PIL import Image
import numpy as np

src_path = r'C:\Users\mhdfi\.gemini\antigravity\brain\d5e4e9f4-6d11-4e04-931d-ebb9fca2404e\.user_uploaded\media_1793517126046_d0763258.png'
im = Image.open(src_path)
arr = np.array(im).copy()

# The wooden frame is opaque (alpha == 255)
# Outside the wooden frame, alpha is between 0 and 254 (the drop shadow)
# If we set RGB = [0, 0, 0] for all pixels where alpha < 255, what happens?
outside_mask = (arr[:, :, 3] < 255) & (arr[:, :, 3] > 0)

# Set shadow color to pure black [0, 0, 0] while preserving its alpha
arr[outside_mask, 0] = 0
arr[outside_mask, 1] = 0
arr[outside_mask, 2] = 0

# Also check very faint shadow (alpha < 3) and set to 0 to prevent edge bleeding
arr[arr[:, :, 3] < 3, 3] = 0

cleaned_im = Image.fromarray(arr)
cleaned_im.save(r'apps\web\static\board\board.png')
print('Saved apps/web/static/board/board.png with cleaned shadow. Size:', cleaned_im.size)

