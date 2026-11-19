from PIL import Image
import numpy as np

img = Image.open(r"frontend\public\character\pose_point.png")
print("pose_point.png size:", img.size, "mode:", img.mode)

# Let's check non-transparent bounding box in pose_point.png
arr = np.array(img)
if arr.shape[2] == 4:
    alpha = arr[:, :, 3]
    ys, xs = np.where(alpha > 20)
    print(f"Alpha bbox: X=[{xs.min()}, {xs.max()}], Y=[{ys.min()}, {ys.max()}]")
    print(f"Bbox width: {xs.max() - xs.min()}, height: {ys.max() - ys.min()}, ratio: {(xs.max() - xs.min()) / (ys.max() - ys.min()):.3f}")
