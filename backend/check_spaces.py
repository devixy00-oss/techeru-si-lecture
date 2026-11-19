from huggingface_hub import HfApi

api = HfApi()
spaces_to_check = [
    "TencentARC/InstantMesh",
    "trellis-community/TRELLIS",
    "WeReCooking2/Dust3R-TripoSR",
    "dave1010101/Dust3R-TripoSR",
    "stabilityai/TripoSR",
    "JeffreyXiang/TRELLIS",
]

for s in spaces_to_check:
    try:
        runtime = api.get_space_runtime(s)
        print(f"Space: {s} -> Stage: {runtime.stage}")
    except Exception as e:
        print(f"Space: {s} -> Error: {e}")
