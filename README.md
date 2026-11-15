# Abandoned But Not Forgotten (ABNF)

A NASA Space Apps Challenge project. Tells the stories of retired NASA equipment left on the Moon, Mars and beyond — and connects their science to hands-on learning, with a specific focus on Uganda's secondary school curriculum.

Built with FastAPI + vanilla JS. No paid APIs. No framework.

---

## How to run

**Requirements:** Python 3.10+, internet connection (for Google Fonts and NASA image API).

```powershell
# 1. Clone the repo
git clone https://github.com/libbynuwasiima9/Abandoned_But_Not_Forgotten.git
cd Abandoned_But_Not_Forgotten

# 2. Create and activate a virtual environment
py -m venv .venv
.venv\Scripts\activate

# 3. Install dependencies
py -m pip install -r requirements.txt

# 4. Start the server
py -m uvicorn main:app --reload
```

> If `py` isn't recognised, use `python` instead.

Then open: **http://127.0.0.1:8000**

| URL | What it is |
|---|---|
| `http://127.0.0.1:8000` | The app |
| `http://127.0.0.1:8000/docs` | Auto-generated API docs |
| `http://127.0.0.1:8000/api/health` | Health check |

Stop the server: `Ctrl+C`

---

## First run note

`sentence-transformers` and `torch` are heavy — the first `pip install` takes a few minutes. Subsequent installs use the cache.

The leaderboard is stored in `leaderboard.db` (SQLite, auto-created on first run). It is gitignored.

---

## Project structure

```
Abandoned_But_Not_Forgotten/
├── main.py                        # FastAPI app — routes, quiz logic, leaderboard, NASA image proxy
├── requirements.txt
├── data/
│   ├── equipment.json             # All mission records (story, instruments, Uganda connection, etc.)
│   └── lessons.json               # Science lab learning pathways
└── static/
    ├── index.html                 # Main page
    ├── equipment.html             # Equipment detail page
    ├── css/
    │   ├── style.css
    │   └── equipment-page.css
    ├── js/
    │   ├── app.js                 # Main page logic
    │   └── equipment.js           # Detail page logic
    └── models/
        ├── opportunity.glb        # 3D model — Opportunity rover
        ├── insight.glb            # 3D model — InSight lander
        └── cassini.glb            # 3D model — Cassini spacecraft
```

---

## What's in the app

- **Equipment archive** — gallery with world filter and deep search across all mission fields
- **Equipment detail pages** — 7-chapter mission story, 3D model viewer, first-person voice, Uganda connection, NASA image gallery, source links
- **Science Lab** — five learning pathways across missions
- **Virtual Science Investigation** — examine evidence cards, record observations, pick a hypothesis, get feedback
- **Surface map** — Moon and Mars with clickable mission markers
- **Mission timelines** — launch to silence for each mission
- **Quiz** — four questions, server-side answer validation
- **Leaderboard** — SQLite-backed, submit your score after the quiz
- **Uganda localisation** — every mission record has a local activity tied to Uganda's S3–S5 physics/biology curriculum and a Swahili glossary

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/equipment` | All equipment records |
| GET | `/api/equipment/{id}` | Single record |
| GET | `/api/equipment/{id}/images` | NASA image library results |
| GET | `/api/lessons` | Science lab lessons |
| GET | `/api/quiz` | Quiz questions (no answers) |
| POST | `/api/quiz/check` | Check an answer |
| GET | `/api/leaderboard` | Top scores |
| POST | `/api/leaderboard` | Submit a score |
| POST | `/api/search` | Semantic search across equipment |
| GET | `/equipment/{id}` | Equipment detail page |

---

## Content notes

- This is a prototype, not an official NASA product.
- Equipment records are summaries. Verify dates, instrument names and mission status against NASA primary sources before formal use.
- NASA images are fetched live from `images-api.nasa.gov` and require an internet connection.
- Quiz answers are validated server-side only — the client never receives the answer key.
- Evidence cards in the Virtual Investigation are simplified teaching simulations, not raw telemetry.
