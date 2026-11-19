from PIL import Image
import numpy as np
from scipy.ndimage import binary_fill_holes

img = Image.open(r"frontend\public\character\pose_point.png").convert("RGB")
arr = np.array(img, dtype=np.float32)

# Background color sampled from corners
bg_color = np.array([13.0, 16.0, 32.0])

# Compute color difference
diff = np.linalg.norm(arr - bg_color, axis=2)

# Mask where pixel is significantly different from background
foreground = diff > 20.0

# Fill small interior holes if any
foreground = binary_fill_holes(foreground)

# Create clean RGBA
rgba = np.zeros((img.height, img.width, 4), dtype=np.uint8)
rgba[:, :, :3] = np.array(img, dtype=np.uint8)
rgba[:, :, 3] = (foreground * 255).astype(np.uint8)

out = Image.fromarray(rgba)
out.save(r"frontend\public\character\cat_isolated.png")

# Compute bounding box of character
ys, xs = np.where(foreground)
print(f"Isolated Cat BBox: X=[{xs.min()}, {xs.max()}], Y=[{ys.min()}, {ys.max()}]")
print(f"Character Dimensions: Width={xs.max()-xs.min()}, Height={ys.max()-ys.min()}")
print(f"Saved to frontend/public/character/cat_isolated.png")
