# 3D CHARACTER MODELING SPECIFICATION
## PROJECT: AI FACE-TO-FACE TEACHER CAT ("TECHERU")

> **PRIMARY & AUTHORITATIVE REFERENCE:** See turn-around image `media_1791213886130.jpg` in user uploads.
> The final 3D character must match the exact visual identity, colors, outfit, and proportions from this reference sheet.

---

### 1. Character Identity
- **Species & Type:** Anthropomorphic orange tabby cat teacher.
- **Personality:** Intelligent, friendly, professional, educator.
- **Fur:** Orange tabby with darker orange stripes on forehead, cheeks, back, and tail. Cream/white muzzle and chin. Pink nose and pink inner ears.
- **Eyes:** Large, expressive green irises with dark pupils and bright highlights.
- **Glasses:** Dark rectangular frames with dual transparent lenses, nose bridge, and temple arms.
- **Outfit:** Navy blue jacket and trousers, crisp white collared shirt, navy tie with diagonal golden/white stripes, brown leather oxford shoes.
- **Tail:** Long, plush, striped orange tail with 7-bone rig (`Tail_01` to `Tail_07`).

---

### 2. Technical Deliverables (`/frontend/public/models/`)
- **Format:** `teacher-cat.glb` (GLTF 2.0 Binary)
- **Materials:** PBR (BaseColor, Normal, Roughness, Metallic/AO).
- **Target Polygons:** Optimized for WebGL/Three.js (approx. 25k–45k triangles).
- **Textures:** 2048x2048 max, compressed for web.

---

### 3. Rigging & Blendshapes Specification
#### Skeleton (Humanoid compatible):
- `Root` > `Hips` > `Spine` > `Chest` > `Neck` > `Head`
- Left/Right Arm: `Shoulder` > `UpperArm` > `Forearm` > `Hand`
- Left/Right Leg: `UpperLeg` > `LowerLeg` > `Foot`
- Tail: `Tail_01` through `Tail_07`
- Head details: `Jaw`, `Eye_L`, `Eye_R`, `Ear_L`, `Ear_R`

#### Morph Targets / Visemes (Lip-Sync & Expression):
- **Visemes:** `Mouth_A`, `Mouth_E`, `Mouth_I`, `Mouth_O`, `Mouth_U`, `Mouth_Closed`, `Mouth_Open`
- **Eyes:** `Blink_L`, `Blink_R`, `Look_L`, `Look_R`, `Look_Up`, `Look_Down`
- **Emotions:** `Smile`, `Sad`, `Surprised`, `Confused`, `Angry`, `Happy`, `Thinking`

#### Core Animations Included:
- `Idle` / `Breathing`
- `Wave` / `Welcome`
- `Talk` / `Explain` / `Point`
- `Nod` / `Thinking`
- `Walk` / `Run`

---

### 4. Web Engine Integration Status
- Component: `src/components/TeacherCat3D.tsx`
- Engine: Three.js WebGL with studio 3-point lighting.
- Path: `frontend/public/models/teacher-cat.glb`
- Fallback: High-resolution animated multi-pose sprite system is actively engaged until the `.glb` file is dropped into the folder.
