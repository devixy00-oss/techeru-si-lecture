import struct
import json
import numpy as np
from PIL import Image

def analyze_features():
    ref_src = r"C:\Users\user\.gemini\antigravity\brain\46e85e44-06f2-42d3-a57a-7f8d4f6b2c3a\.user_uploaded\media_1794821613382_7f386bcc.jpg"
    glb_src = r"frontend\public\models\teacher-cat.glb"
    
    img = Image.open(ref_src).convert("RGB")
    arr = np.array(img)
    
    print("Reference Image size:", img.size)
    
    # Let's inspect specific features in the 2D reference image:
    # 1. White shirt collar & chest: where is white shirt (R > 230, G > 230, B > 230)?
    white_mask = (arr[:, :, 0] > 220) & (arr[:, :, 1] > 220) & (arr[:, :, 2] > 220)
    # restrict to chest area Y in [120, 240], X in [100, 180]
    ys, xs = np.where(white_mask[120:240, 100:180])
    ys += 120
    xs += 100
    if len(xs) > 0:
        print(f"2D White Shirt bounds: X=[{xs.min()}, {xs.max()}], Y=[{ys.min()}, {ys.max()}], center=({xs.mean():.1f}, {ys.mean():.1f})")
    
    # 2. Striped tie: center chest Y in [130, 240], X in [140, 170]
    # Check pixels in this column:
    tie_pixels = arr[135:235, 150:165]
    print(f"2D Tie region sample at (155, 170): {arr[170, 155]}")
    print(f"2D Tie region sample at (155, 190): {arr[190, 155]}")
    
    # 3. Deep Navy Suit:
    # Sample suit jacket at (125, 200) and (180, 200)
    print(f"2D Suit left lapel at (125, 200): {arr[200, 125]}")
    print(f"2D Suit right lapel at (180, 200): {arr[200, 180]}")
    print(f"2D Suit shoulder at (110, 160): {arr[160, 110]}")
    print(f"2D Suit shoulder at (195, 160): {arr[160, 195]}")
    
    # 4. Orange fur on face:
    print(f"2D Fur forehead at (150, 45): {arr[45, 150]}")
    print(f"2D Fur cheek at (105, 85): {arr[85, 105]}")
    print(f"2D Fur cheek at (195, 85): {arr[85, 195]}")
    
    # 5. Green eyes:
    # Look for high green, low red: G > R + 20 in eye area Y in [60, 85]
    green_mask = (arr[60:85, :, 1] > arr[60:85, :, 0] + 20) & (arr[60:85, :, 1] > 100)
    eys, exs = np.where(green_mask)
    eys += 60
    if len(exs) > 0:
        print(f"2D Green eyes detected: X=[{exs.min()}, {exs.max()}], Y=[{eys.min()}, {eys.max()}]")

if __name__ == "__main__":
    analyze_features()
