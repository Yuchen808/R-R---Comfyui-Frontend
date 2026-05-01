# Workflows

Sanitized API-format ComfyUI workflows. Original sources from Zak's local stack
(file references and prompts redacted to placeholders since the originals contained
real client project filenames).

The agent (Phase 1, Python watchdog on Zak's box) hydrates these placeholders
at runtime and POSTs to `http://localhost:8188/prompt`.

## 01 — Image to Video (Wan 2.2 i2v)

| Frontend control | Workflow node · field |
|---|---|
| Input image upload | `113.image` |
| Prompt textarea | `112.text` |
| Duration slider (2–8s) | `205.value` |
| FPS select (24/30) | `122.frame_rate` ⚠️ workflow defaults to 16 — confirm with Zak |
| Seamless loop toggle | `122.pingpong` |
| Width / Height | `203.value` / `204.value` |
| Output video | from `122` (mp4/h264) |

**Models**: Wan 2.2 14B i2v lightx2v 4-step (GGUF Q5_1), UMT5 XXL CLIP, Wan 2.1 VAE
**Two-stage sampler**: nodes `114` (high-noise, steps 0-3) → `119` (low-noise, steps 3-6)
**Total frames** computed by `207` as `(duration*16)+1` (note: hardcoded 16, not FPS)

## 02 — Instruct Image (FLUX 2 Klein + Reference)

| Frontend control | Workflow node · field |
|---|---|
| Input image upload | `149.image` |
| **Reference image upload** ⚠️ NEW slot needed | `147.image` |
| Prompt textarea (positive) | `108.text` |
| Negative prompt | `109.text` |
| Edit strength | `153.strength` (color match) |
| Guidance / CFG | `102.cfg` |
| Steps (Quality preset) | `101.steps` |
| Seed | `105.noise_seed` |
| LoRA strength | `161.strength_model` |
| Output image | `118` (PreviewImage, color-matched) — confirm with Zak |

**Models**: FLUX 2 Klein 9B (fp8), Qwen 3 8B CLIP, FormFinder Flux LoRA
**Reference latent chain**: input + reference both VAE-encoded and conditioned via `ReferenceLatent` nodes (`113:76/77`, `145:158/160`)

## Open questions for next sync with Zak

1. **Two presets, one workflow?** — Are "AI photoshop" and "Day to Night" the same JSON with different prompts/refs, or two separate JSONs?
2. **Reference image** for Instruct Image — required or optional? If optional, what's the agent fallback when user doesn't supply one?
3. **Output node** for Instruct Image — node `118` (color-matched) or `157` (raw decode)? Default to `118`?
4. **FPS for Image-to-Video** — workflow hardcodes 16 fps but agent could expose 24/30. Need to confirm if changing fps breaks anything else.
5. **LoRA strength** for FormFinder — expose as a slider, or keep at `1` always?
6. **Custom nodes** Zak has installed (we need exact list to mirror on the agent's runtime):
   - ComfyUI-Easy-Use
   - rgthree-comfy
   - ComfyUI-VideoHelperSuite
   - ComfyUI-GGUF
   - ComfyUI_essentials (assumed)

## Frontend → workflow mapping next steps

The current frontend in `/src/data/workflowParams.ts` is mock — it doesn't yet
map 1:1 to these workflows. After confirming with Zak:
- Update `WORKFLOW_PARAMS` to expose only knobs Zak's workflows actually accept
- Add a second image upload slot for Instruct Image (reference)
- Update `Job.params` shape to match real fields
