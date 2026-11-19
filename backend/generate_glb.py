import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))
from services.export_glb import create_teacher_cat_glb

target = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/public/models/teacher-cat.glb"))
create_teacher_cat_glb(target)
size = os.path.getsize(target)
print(f"GLB regenerated successfully! Size: {size} bytes at {target}")
