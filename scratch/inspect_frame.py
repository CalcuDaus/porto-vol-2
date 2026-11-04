from PIL import Image
import numpy as np

p_uploaded = r'C:\Users\mhdfi\.gemini\antigravity\brain\d5e4e9f4-6d11-4e04-931d-ebb9fca2404e\.user_uploaded\media_1793517126046_d0763258.png'
p_current = r'apps\web\static\board\board.png'

im_up = Image.open(p_uploaded)
im_cur = Image.open(p_current)

print('Uploaded size:', im_up.size, 'mode:', im_up.mode)
print('Current size:', im_cur.size, 'mode:', im_cur.mode)

# Let's inspect the wooden frame on the uploaded image
arr_up = np.array(im_up)

# Check why there are white pixels in arr_up:
# Let's find all pixels where alpha > 0 and (R > 200 and G > 200 and B > 200) that are OUTSIDE the wooden frame!
# Where is the wooden frame?
# Top frame is around Y=17 to Y=45. Outside top frame is Y < 17.
print('Rows 0 to 17 max RGB and alpha:')
for y in range(0, 18):
    row_rgb = arr_up[y, :, :3]
    row_a = arr_up[y, :, 3]
    non_zero = row_a > 0
    if np.any(non_zero):
        print(f'Y={y}: max_a={row_a.max()}, mean_rgb={row_rgb[non_zero].mean(axis=0)}')
    else:
        print(f'Y={y}: all transparent')

