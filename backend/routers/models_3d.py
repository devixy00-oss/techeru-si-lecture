from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
from services import meshy_service

router = APIRouter(prefix="/api/3d", tags=["3d-model"])

class GenerateRequest(BaseModel):
    api_key: Optional[str] = None
    image_path: Optional[str] = None

class StatusCheckRequest(BaseModel):
    task_id: str
    api_key: Optional[str] = None

@router.get("/info")
def get_3d_info():
    glb_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/public/models/teacher-cat.glb"))
    exists = os.path.exists(glb_path)
    size = os.path.getsize(glb_path) if exists else 0
    ref_image = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/public/character/official_cat_ref.jpg"))

    return {
        "model_name": "Techeru Teacher Cat 3D",
        "format": "glTF 2.0 Binary (.GLB)",
        "file_exists": exists,
        "file_size_bytes": size,
        "reference_image_exists": os.path.exists(ref_image),
        "meshy_configured": bool(os.getenv("MESHY_API_KEY", "").strip() and os.getenv("MESHY_API_KEY") != "your_meshy_api_key_here"),
        "render_mode": "WebGL Three.js (Parametric Organic Sculpted + glTF 2.0)",
    }

@router.post("/generate")
def start_3d_generation(req: GenerateRequest):
    ref_image = req.image_path or os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/public/character/official_cat_ref.jpg"))
    result = meshy_service.submit_image_to_3d(ref_image, req.api_key)
    return result

@router.get("/status/{task_id}")
def check_3d_status(task_id: str, api_key: Optional[str] = None):
    res = meshy_service.get_task_status(task_id, api_key)
    if res.get("success") and res.get("status") == "SUCCEEDED" and res.get("glb_url"):
        target_glb = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/public/models/teacher-cat.glb"))
        meshy_service.download_glb_to_file(res["glb_url"], target_glb)
        res["downloaded_locally"] = True
    return res
