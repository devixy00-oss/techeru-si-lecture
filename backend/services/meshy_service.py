import os
import json
import base64
import urllib.request
import urllib.error

MESHY_API_URL = "https://api.meshy.ai/v2/image-to-3d"

def get_meshy_api_key(override_key: str = None) -> str:
    return (override_key or os.getenv("MESHY_API_KEY", "")).strip()

def submit_image_to_3d(image_path: str, api_key: str = None) -> dict:
    key = get_meshy_api_key(api_key)
    if not key or key == "your_meshy_api_key_here":
        return {
            "success": False,
            "error": "API_KEY_REQUIRED",
            "message": "Meshy AI API Key required. Get a free API key at https://www.meshy.ai and add it to backend/.env or in the Classroom Settings.",
        }

    if not os.path.exists(image_path):
        return {
            "success": False,
            "error": "FILE_NOT_FOUND",
            "message": f"Image file not found at {image_path}",
        }

    try:
        with open(image_path, "rb") as f:
            encoded_bytes = base64.b64encode(f.read()).decode("utf-8")
        
        mime = "image/png" if image_path.lower().endswith(".png") else "image/jpeg"
        data_uri = f"data:{mime};base64,{encoded_bytes}"

        payload = {
            "image_url": data_uri,
            "enable_pbr": True,
            "should_remesh": True,
            "ai_model": "meshy-4",
            "topology": "quad",
        }

        req = urllib.request.Request(
            MESHY_API_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "User-Agent": "TecheruAI/1.0",
            },
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            task_id = data.get("result")
            return {
                "success": True,
                "task_id": task_id,
                "message": "3D generation task submitted successfully to Meshy AI.",
            }

    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        return {
            "success": False,
            "error": f"HTTP_{e.code}",
            "message": f"Meshy API error ({e.code}): {err_msg}",
        }
    except Exception as e:
        return {
            "success": False,
            "error": "SUBMISSION_FAILED",
            "message": str(e),
        }

def get_task_status(task_id: str, api_key: str = None) -> dict:
    key = get_meshy_api_key(api_key)
    if not key or key == "your_meshy_api_key_here":
        return {
            "success": False,
            "error": "API_KEY_REQUIRED",
            "message": "Meshy AI API Key required.",
        }

    try:
        url = f"{MESHY_API_URL}/{task_id}"
        req = urllib.request.Request(
            url,
            headers={
                "Authorization": f"Bearer {key}",
                "User-Agent": "TecheruAI/1.0",
            },
            method="GET"
        )

        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            status = data.get("status")
            progress = data.get("progress", 0)
            model_urls = data.get("model_urls", {})
            glb_url = model_urls.get("glb") if model_urls else None

            return {
                "success": True,
                "task_id": task_id,
                "status": status,
                "progress": progress,
                "glb_url": glb_url,
                "thumbnail_url": data.get("thumbnail_url"),
            }

    except Exception as e:
        return {
            "success": False,
            "error": "STATUS_CHECK_FAILED",
            "message": str(e),
        }

def download_glb_to_file(glb_url: str, target_path: str) -> bool:
    try:
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        urllib.request.urlretrieve(glb_url, target_path)
        return True
    except Exception as e:
        print(f"Error downloading GLB: {e}")
        return False
