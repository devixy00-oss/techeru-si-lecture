from PIL import Image
import numpy as np

img = Image.open(r"frontend\public\character\pose_point.png")
arr = np.array(img)
print("Shape:", arr.shape)
print("Alpha channel min, max:", arr[:, :, 3].min(), arr[:, :, 3].max())
print("Corner pixels (0,0):", arr[0, 0])
print("Ear tip pixel (approx):", arr[5, 120])
print("Suit pixel (approx):", arr[180, 120])
