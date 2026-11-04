from PIL import Image, ImageFilter
import numpy as np

im = Image.open('apps/web/static/board/board.png')
arr = np.array(im).copy()

# Sample clean blackboard texture directly below Projects: Y: 110-145, X: 65-185
patch_proj = arr[110:145, 65:185, :3]
# Sample clean blackboard texture directly below Achivements: Y: 110-145, X: 745-915
patch_ach = arr[110:145, 745:915, :3]
# Sample clean blackboard texture directly above Skills: Y: 500-535, X: 65-150
patch_sk = arr[500:535, 65:150, :3]

# Create soft mask for text pixels
# Projects
h_p, w_p, _ = patch_proj.shape
roi_p = arr[68:68+h_p, 65:65+w_p, :3]
text_mask_p = (roi_p[:, :, 0] > 90) & (roi_p[:, :, 1] > 90) & (roi_p[:, :, 2] > 90)

# Feather the mask with PIL blur
mask_img_p = Image.fromarray((text_mask_p * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))
mask_np_p = np.array(mask_img_p) / 255.0
mask_np_p = np.expand_dims(mask_np_p, -1)

arr[68:68+h_p, 65:65+w_p, :3] = (roi_p * (1 - mask_np_p) + patch_proj * mask_np_p).astype(np.uint8)

# Achivements
h_a, w_a, _ = patch_ach.shape
roi_a = arr[68:68+h_a, 745:745+w_a, :3]
text_mask_a = (roi_a[:, :, 0] > 90) & (roi_a[:, :, 1] > 90) & (roi_a[:, :, 2] > 90)

mask_img_a = Image.fromarray((text_mask_a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))
mask_np_a = np.array(mask_img_a) / 255.0
mask_np_a = np.expand_dims(mask_np_a, -1)

arr[68:68+h_a, 745:745+w_a, :3] = (roi_a * (1 - mask_np_a) + patch_ach * mask_np_a).astype(np.uint8)

# Skills
h_s, w_s, _ = patch_sk.shape
roi_s = arr[540:540+h_s, 65:65+w_s, :3]
text_mask_s = (roi_s[:, :, 0] > 90) & (roi_s[:, :, 1] > 90) & (roi_s[:, :, 2] > 90)

mask_img_s = Image.fromarray((text_mask_s * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))
mask_np_s = np.array(mask_img_s) / 255.0
mask_np_s = np.expand_dims(mask_np_s, -1)

arr[540:540+h_s, 65:65+w_s, :3] = (roi_s * (1 - mask_np_s) + patch_sk * mask_np_s).astype(np.uint8)

clean_im = Image.fromarray(arr)
clean_im.save('apps/web/static/board/board_clean.png')
print('board_clean.png saved without text!')

