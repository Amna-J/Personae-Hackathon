# Personae — AI Fashion Stylist

Personae analyzes a user's **skin tone, undertone, body shape, and face shape**, builds a personalised fashion profile, and — from a single moodboard image — decomposes the outfit, scores every item against the profile, and renders a **virtual try-on (VTO)** of the best-matching look on the user's own photo.

It is a full-stack app:

- **Backend** — Django REST Framework (Python) with a fuzzy-logic fashion recommendation engine, a vision-LLM moodboard decomposer, an LLM-powered item matcher with colour-fallback, and a real YouCam virtual try-on integration.
- **Frontend** — React + Vite with a "Desert Sage" design system (linen/earthen modes).

---

## Architecture

```
                    ┌─────────────────────────────────────────────────┐
                    │                    FRONTEND                     │
                    │           React + Vite + Tailwind v4            │
                    │      /skin-tone /under-tone /body-type          │
                    │      /face-shape /moodboard-check /AIchat       │
                    └────────────────────────┬────────────────────────┘
                                             │  axios / multipart
                                             ▼
                    ┌─────────────────────────────────────────────────┐
                    │                   BACKEND (Django)              │
                    │                                                  │
                    │  /api/predict/*        /api/users/*              │
                    │   skin-tone            register / login          │
                    │   undertone            profile / recommendations │
                    │   body-shape           style-check  ────────┐    │
                    │   face-shape                                ▼    │
                    └──────────────────────────────────────────────────┘
                                                      │
     ┌────────────────────────────────────────────────┼───────────────────────────┐
     │                                                │                           │
     ▼                                                ▼                           ▼
┌───────────────────┐   ┌──────────────────────┐   ┌────────────────────────┐  ┌──────────────┐
│ FuzzyRecommendation│   │   Groq vision LLM    │   │   item_matcher (LLM)   │  │  YouCam API   │
│  Engine (60 rules) │──▶│  decompose_moodboard │──▶│  color-fallback judge  │──▶│  VTO chain    │
│  10 fashion attrs  │   │   qwen/qwen3.6-27b   │   │   llama-3.3-70b        │  │  cloth/shoes/ │
└───────────────────┘   └──────────────────────┘   └────────────────────────┘  │  bag/skin-tone │
                                                                                └──────────────┘
```

### The style-check pipeline (in order)

1. **Vision-LLM profile** — a full-length photo is classified into `skin_tone`, `under_tone`, `body_shape` (fixed category sets, validated + retried). **Runs automatically when the user's profile is empty** — no prior analysis required.
2. **FuzzyRecommendationEngine** — 60-rule fuzzy logic engine derives 10 personalised fashion attributes (recommended/avoid colours, fitting style, materials, patterns, jewellery metal, colour-wheel regions, exaggeration guidance).
3. **decompose_moodboard()** — a Groq vision LLM (`qwen/qwen3.6-27b`) detects every distinct fashion item in the moodboard with `category`, `label`, `bounding_box`, `confidence`, `color`, `silhouette`, `pattern`, `material_texture`.
4. **Item matching** — every item is judged against the recommendation. Colours explicitly listed in the recommendation are scored by the standard judge (`llama-3.3-70b-versatile`); colours **not** in the lists are routed to a dedicated LLM **colour-fallback judge** so nothing is silently passed or rejected. Every verdict is tagged `verdict_source ∈ {fuzzy_engine, llm_color_fallback}`.
5. **VTO chain** — passing items are split into `core_items` (top/bottom/full_outfit, one per body region), reference crops are cut from the moodboard, and the real YouCam API renders the look onto the user's photo.
6. **API endpoint** — the full pipeline runs server-side via `POST /api/users/style-check/`.

---

## Repository layout

```
Personae/
├── backend/
│   ├── config/                  # Django project (settings, urls)
│   ├── users/                   # PersonaUser model, auth, profile,
│   │                            #   recommendations, style-check endpoints
│   ├── predictions/             # skin-tone / undertone / body-shape /
│   │                            #   face-shape predict endpoints
│   ├── ml/
│   │   ├── models/              # trained CV model weights (NOT in git)
│   │   ├── predictors/
│   │   │   ├── fuzzy_recommendation_engine.py   # 60-rule fuzzy engine
│   │   │   ├── recommendation_controller.py
│   │   │   ├── skin_tone.py / undertone.py
│   │   │   ├── body_shape.py / face_shape.py
│   │   ├── moodboard_decomposer.py  # Groq vision LLM item detection
│   │   ├── item_matcher.py          # LLM item judge + colour fallback
│   │   ├── vto_pipeline.py          # split / refs / render-status logic
│   │   ├── youcam_client.py         # real YouCam API client
│   │   ├── profile_classifier.py    # vision-LLM profile auto-classification
│   │   ├── registry.py              # loads trained CV models (lazy)
│   │   └── testimages/              # sample moodboard + person photos
│   ├── test_full_pipeline_e2e.py   # end-to-end integration test (real APIs)
│   ├── test_youcam_chain.py / test_body_shape.py / ...
│   ├── manage.py
│   └── .env                        # secrets (gitignored)
├── frontend/
│   ├── src/App.jsx                 # routes
│   ├── src/assets/Pages/           # React pages
│   ├── src/Components/             # Navbar, Footer, Button, AnalysisCard
│   ├── src/Data/                   # static content data
│   ├── THEME.md                    # Desert Sage design system
│   └── README.md
├── requirements.txt
└── db.sqlite3                      # local dev DB (gitignored)
```

---

## Getting started

### Prerequisites

- Python 3.13+
- Node.js 20+
- A [Groq](https://console.groq.com) API key (vision + judge LLMs)
- A [YouCam](https://www.perfectcorp.com) `s2s` API key (virtual try-on, skin-tone cross-check)

### Backend

```powershell
# from Personae/
python -m venv venv
.\venv\Scripts\Activate.ps1

pip install -r requirements.txt
cd backend

# environment — create backend/.env from the table below:

python manage.py migrate
python manage.py runserver    # http://127.0.0.1:8000
```

### `backend/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | yes | Groq API key (vision LLM, item judge, colour fallback) |
| `YOUCAM_API_KEY` | yes | YouCam s2s API key |
| `YOUCAM_BASE_URL` | no | YouCam API base URL (default `https://yce-api-01.makeupar.com`) |
| `DB_ENGINE` | no | `postgres` uses Postgres; anything else/unset uses local SQLite |
| `STYLE_CHECK_TIMEOUT_SECONDS` | no | Pipeline timeout for `/api/users/style-check/` (default `360`) |
| `YOUCAM_COLOR_TONE_CROSSCHECK` | no | `0` disables the YouCam skin-tone cross-check (default on) |

> `.env` is gitignored. Secrets never enter the repo. Optional Postgres vars: `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`.

### Frontend

```powershell
# from Personae/frontend
npm install
npm run dev        # http://localhost:5173
```

CORS allows `localhost:5173` / `127.0.0.1:5173` in `config/settings.py`.

---

## API reference

All endpoints are at `/api/`.

### Users (`users/urls.py`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/users/register/` | Register a user |
| POST | `/api/users/login/` | Login |
| POST | `/api/users/forgot-check-email/` | Verify an email exists |
| POST | `/api/users/forgot-reset-password/` | Reset a password |
| GET/PATCH | `/api/users/profile/?user_id=` | Read / update a profile |
| GET | `/api/users/recommendations/?user_id=` | Fuzzy recommendation from stored profile |
| POST | `/api/users/style-check/` | **Full style-check pipeline** (multipart) |

### `POST /api/users/style-check/`

`multipart/form-data`, all fields required:

- `user_id` — PersonaUser id (profile auto-classified from `person_photo` if `skin_tone`, `undertone`, `body_type` are not yet set)
- `moodboard_image` — flat-lay / outfit-inspiration image (used for decomposition + reference crops)
- `person_photo` — the user's own full-length photo (VTO source; never stored)

Response highlights:

- `status` — `completed` | `no_items_detected` | `no_items_passed` | `no_core_items` | `vto_skipped_*` | `vto_failed`
- `vto_status` — `rendered` | `skipped_*` | `failed` | `not_attempted`
- `items` — full scored list; each item has a `verdict` (`matches`, `confidence`, `matched_criteria`, `mismatched_criteria`, `reasoning`) and a `render_status` (`rendered`, `render_failed`, `not_rendered_category`, `superseded_by_higher_confidence`, `not_attempted`)
- `render_url` — chained VTO result URL (expires in 2 h) or `null`
- `split` — `core_items` / `superseded_items` / `scene_styled_items` / `excluded_items`
- `passed_item_count`

The endpoint is synchronous, bounded by `STYLE_CHECK_TIMEOUT_SECONDS`; on timeout it returns **504**.

### Predictions (`predictions/urls.py`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/predict/body-shape/` | Body shape from measurements (+ optional `image`) |
| POST | `/api/predict/skin-tone/` | Skin tone from a face selfie (with YouCam colour cross-check) |
| POST | `/api/predict/undertone/` | Undertone from an image |
| POST | `/api/predict/face-shape/` | Face shape from an image |

---

## Fuzzy recommendation engine

`ml/predictors/fuzzy_recommendation_engine.py`

- Inputs: `skin_tone` ∈ {Fair, Medium, Dark, Black}, `under_tone` ∈ {Warm, Cool, Neutral}, `body_shape` ∈ {Hourglass, Inverted Triangle, Pear, Apple, Rectangle}
- **60 rules** cover every combination; fuzzy membership functions give partial credit to neighbouring categories (e.g. borderline predictions still match adjacent rules).
- Outputs (10 attributes): recommended/avoid colours, fitting style, materials, patterns, jewellery metal, colour-wheel regions, and "don't exaggerate / do exaggerate" guidance.
- Throws `MissingModelValueError` with a UI redirect hint when profile fields are missing.

## Item matching (`ml/item_matcher.py`)

- `score_all_items()` — classic LLM judge for every item.
- `score_all_items_with_color_fallback()` — routes each item's colour:
  - **covered** by the recommendation's colour lists (`color_is_covered_by_recommendation()`, a deterministic word/substring heuristic) → standard judge, tagged `fuzzy_engine`
  - **not covered** → `score_color_match_via_llm()`, a dedicated colour-fit judge for the person's skin tone/undertone, tagged `llm_color_fallback`
- Verdict schema is identical for both paths, so downstream code (`passes_threshold`, split, VTO) is unchanged.

## VTO pipeline (`ml/vto_pipeline.py`, `ml/youcam_client.py`)

- `CORE_RENDER_CATEGORIES` — top, bottom, full_outfit (AI Clothes preserves background + identity).
- `SCENE_STYLED_CATEGORIES` — shoes/bag surface as `scene_styled_items` (the shoes/bag endpoints re-synthesize the whole scene and would destroy the preserved background).
- `EXCLUDED_CATEGORIES` — jewellery (2d-vto schema currently 400s); surfaced via `excluded_items`.
- **One item per body region** — top→upper_body, bottom→lower_body, full_outfit→both. The highest-confidence item claims the region; the rest become `superseded_items`.
- `chain_vto_steps()` — uploads the user photo once, then chains sequential swaps; **shoes/bag steps must run before cloth steps** (the shoes engine re-synthesizes the whole person, destroying applied garments).
- Reference crops must be clean garment-on-background (the moodboard, not a photo of a person wearing the items); crops with skin-pixel content are rejected by YouCam (`error_editing_failed`) — the client warns at >5% skin pixels.

## YouCam APIs used

Personae uses the following [Perfect Corp](https://www.perfectcorp.com) YouCam `s2s` APIs (all via `ml/youcam_client.py`):

| API | Endpoint feature | What it does |
|-----|-----------------|--------------|
| **AI Clothes** | `cloth` | Preserves the user's background and identity while swapping a garment (upper_body / lower_body / full_body) onto the person photo. Used for tops, bottoms, and full outfits. |
| **AI Shoes** | `shoes` | Re-synthesises a scene with new shoes applied. Exposed as `scene_styled_items` (not part of the default VTO chain, as it does not preserve the garment-rendered background). |
| **AI Bag** | `bag` | Re-synthesises a scene with a new bag applied. Surfaced as `scene_styled_items` for the same reason. |
| **AI Facial Color Tones Analyzer** | `skin-tone-analysis` | Optional one-shot skin-tone hex cross-check used alongside the skin-tone prediction page (configurable, not required for style-check). |

Files are uploaded via the YouCam **File API** (`/s2s/v2.0/file/{feature}`) and a presigned PUT; VTO results are polled via the **Task API** (`/s2s/v2.0/task/{feature}/{task_id}`) until `task_status == "success"`, returning a temporary S3 URL (valid 2 hours).

## Trained CV models (`ml/models/`, `ml/registry.py`)

The original per-attribute classifiers — Xception skin-tone, Keras undertone, LightGBM/RandomForest/PyTorch body-shape ensemble, face-shape landmark models — are **deliberately not committed** (large weights). Model loading is lazy and defensive: the app starts and the style-check pipeline runs without them, and the `/api/predict/*` endpoints return a clear error until the weights are restored under `backend/ml/models/` (see `backend/ml/models/README.md`). The style-check pipeline does not need them: it derives the profile with the vision LLM instead.

---

## Testing

No pytest needed — the tests are plain scripts that run with the venv Python.

### Unit / module tests

```powershell
# from Personae/backend with the venv active
python -m ml.test_vto_pipeline            # split / supersede / render-status logic
python ml/test_item_matcher_scores.py     # LLM item judge (real Groq API)
python test_body_shape.py
python test_youcam_chain.py               # YouCam client (real API)
```

### End-to-end integration test

`test_full_pipeline_e2e.py` runs the **whole real, unmocked pipeline** — vision-LLM profile → fuzzy recommendation → moodboard decomposition → item matching with colour-fallback → real YouCam VTO → the real `StyleCheckView` endpoint (with the LLM profile injected into the DB):

```powershell
# from Personae/backend
python test_full_pipeline_e2e.py
python test_full_pipeline_e2e.py --moodboard <flat-lay.jpg> --person <full-length.png>
python test_full_pipeline_e2e.py --skip-endpoint      # skip 2nd VTO render
```

| Flag | Default | Purpose |
|------|---------|---------|
| `--moodboard` | `ml/testimages/pinterest.jpg` | Moodboard / flat-lay image |
| `--person` | `ml/testimages/full look.png` | Full-length person photo |
| `--max-attempts` | `3` | Vision-LLM profile retries |
| `--threshold` | `0.6` | Matcher pass confidence |
| `--skip-endpoint` | off | Skip the endpoint stage (saves a second VTO render) |
| `--test-user-email` | `e2e.pipeline@personae.local` | PersonaUser injected for the endpoint stage (deleted after) |

Exit code is `0` only if all stages pass. Outputs go to `backend/test_output/` (gitignored): `results.json`, `final_render.jpg`, `refs/`. Each stage prints PASS/FAIL/SKIP; the summary also prints how many verdicts came from the fuzzy engine vs. the LLM colour-fallback.

> Both image defaults must be distinct files that are not crops of each other; the moodboard must be a flat-lay/product image (not a person photo).

---

## Frontend

- React 19 + Vite 7 + Tailwind CSS v4 + daisyUI + framer-motion + react-router-dom 7.
- Routes in `src/App.jsx`: home (`/`), analysis pages (`/skin-tone`, `/under-tone`, `/body-type`, `/face-shape`), `/style-dna`, `/jewelry-recommendations`, `/makeup-recommendations`, `/results`, `/moodboard-check`, `/AIchat`, `/auth`, `/profile`.
- Earthen-mode pages are wrapped by the `E` helper (`<div data-theme="earthen">`); Navbar/Footer always render in linen mode.
- Design system: see `frontend/THEME.md` ("Desert Sage"). Rules: no hardcoded hex in components (use CSS vars), no glow effects, WCAG AA contrast, `E` wrapper is the only mode source.

---

## Known constraints & notes

- **PersonaeUser stores only text profile fields** — photos are processed in-memory and never persisted.
- The style-check pipeline auto-classifies the user's profile from the `person_photo` via a vision LLM when profile fields are missing, so even a brand-new user can run the full style-check from just a moodboard + person photo with no prior analysis.
- The `/api/predict/*` endpoints require the trained CV weights under `backend/ml/models/`; the style-check pipeline does not use them.
- YouCam result URLs are temporary (2-hour S3 links).
- `StyleCheckView` uses the same `score_all_items_with_color_fallback()` matcher as the e2e test, so endpoint results are consistent with the direct pipeline stages.
- Chained VTO is a single synchronous request; run `python manage.py runserver` on a machine with network access to Groq/YouCam.

## 💡 Consumer & Retail Value

### For Consumers

Personae turns generic fashion inspiration into personalized recommendations.
Instead of asking users to determine whether an outfit will suit them on their
own, the system evaluates their visual profile and checks individual items
against their characteristics and preferences.

Key consumer benefits include:

- Personalized fashion recommendations
- Better understanding of suitable colors, silhouettes, patterns, and materials
- Moodboard-based outfit discovery
- Virtual try-on before committing to a look
- More confident and informed fashion decisions
- A single workflow from inspiration to personalized visualization

### For Retail & Fashion Businesses

Personae demonstrates how AI-powered personalization can enhance digital
fashion experiences by connecting product discovery with individual customer
characteristics.

Potential retail value includes:

- More personalized product discovery
- AI-assisted styling experiences
- Virtual visualization of recommended outfits
- Greater engagement during online shopping
- Potential reduction in unsuitable purchases and fashion returns
- Opportunities for personalized merchandising and customer experiences
