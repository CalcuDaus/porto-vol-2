from PIL import Image, ImageDraw

im = Image.open('apps/web/static/board/board_clean.png')
draw = ImageDraw.Draw(im)

W, H = im.size
print('Board size:', W, H)

# Test box positions
# Projects (top-left)
proj_x, proj_y = int(W * 0.072), int(H * 0.105)
draw.rectangle([proj_x, proj_y, proj_x + 120, proj_y + 35], outline='red', width=2)

# Achivements (top-right)
ach_x, ach_y = int(W * (1 - 0.072) - 150), int(H * 0.105)
draw.rectangle([ach_x, ach_y, ach_x + 150, ach_y + 35], outline='blue', width=2)

# Skills (bottom-left)
sk_x, sk_y = int(W * 0.072), int(H * (1 - 0.125) - 30)
draw.rectangle([sk_x, sk_y, sk_x + 80, sk_y + 30], outline='green', width=2)

# Icons
# LinkedIn
li_x, li_y = int(W * (1 - 0.075) - 24), int(H * (1 - 0.19) - 24)
draw.rectangle([li_x, li_y, li_x + 24, li_y + 24], outline='yellow', width=2)

# Instagram
ig_x, ig_y = int(W * (1 - 0.112) - 24), int(H * (1 - 0.145) - 24)
draw.rectangle([ig_x, ig_y, ig_x + 24, ig_y + 24], outline='orange', width=2)

# GitHub
gh_x, gh_y = int(W * (1 - 0.142) - 24), int(H * (1 - 0.09) - 24)
draw.rectangle([gh_x, gh_y, gh_x + 24, gh_y + 24], outline='cyan', width=2)

# Wave
wv_x, wv_y = int(W * (1 - 0.070) - 40), int(H * (1 - 0.08) - 40)
draw.rectangle([wv_x, wv_y, wv_x + 40, wv_y + 40], outline='magenta', width=2)

im.save('scratch_alignment_test.png')
print('Alignment test saved')

