from PIL import Image
import numpy as np
import cv2

im = Image.open('apps/web/static/board/board.png')
arr = np.array(im)

# Let's inspect the text regions in arr
# 1. Projects: Y ~ 68-100, X ~ 65-180
# 2. Achivements: Y ~ 68-100, X ~ 745-915
# 3. Skills: Y ~ 540-575, X ~ 65-150

# Create an inpaint mask
mask = np.zeros((im.height, im.width), dtype=np.uint8)

# Projects mask: find bright pixels in this region
roi_proj = arr[68:105, 65:180]
proj_text = (roi_proj[:, :, 0] > 100) & (roi_proj[:, :, 1] > 100) & (roi_proj[:, :, 2] > 100)
mask[68:105, 65:180][proj_text] = 255

# Dilate slightly
kernel = np.ones((3, 3), np.uint8)

# Achivements mask
roi_ach = arr[68:105, 745:915]
ach_text = (roi_ach[:, :, 0] > 100) & (roi_ach[:, :, 1] > 100) & (roi_ach[:, :, 2] > 100)
mask[68:105, 745:915][ach_text] = 255

# Skills mask
roi_sk = arr[540:580, 65:150]
sk_text = (roi_sk[:, :, 0] > 100) & (roi_sk[:, :, 1] > 100) & (roi_sk[:, :, 2] > 100)
mask[540:580, 65:150][sk_text] = 255

mask_dilated = cv2.dilate(mask, kernel, iterations=2)

# Inpaint RGB
bgr = cv2.cvtColor(arr[:, :, :3], cv2.COLOR_RGB2BGR)
inpainted_bgr = cv2.inpaint(bgr, mask_dilated, 5, cv2.INPAINT_TELEA)
inpainted_rgb = cv2.cvtColor(inpainted_bgr, cv2.COLOR_BGR2RGB)

arr_clean = arr.copy()
arr_clean[:, :, :3] = inpainted_rgb

im_clean = Image.fromarray(arr_clean)
im_clean.save('apps/web/static/board/board_clean.png')
print('Inpainted board_clean.png saved successfully!')

