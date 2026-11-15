from pathlib import Path
import json
import sqlite3
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(
    title="SPACE LEGACY API",
    description="An educational prototype exploring NASA equipment and the science it made possible.",
    version="0.2.0"
)

# Data cached at startup — avoids re-reading disk on every request
_equipment: list = json.loads((DATA_DIR / "equipment.json").read_text(encoding="utf-8"))
_lessons: list = json.loads((DATA_DIR / "lessons.json").read_text(encoding="utf-8"))

# Quiz bank — answers kept server-side only
QUIZ_BANK = [
    {"id": 1, "question": "What can hematite-rich deposits on Mars help scientists investigate?", "options": ["Ancient water activity", "Modern forests", "The existence of dinosaurs"], "answer": 0, "explanation": "Hematite-rich concretions found by Opportunity provided evidence that helped scientists investigate ancient water activity."},
    {"id": 2, "question": "What does a seismometer measure?", "options": ["The colour of a planet", "Vibrations and seismic waves", "The age of sunlight"], "answer": 1, "explanation": "Seismometers measure vibrations and seismic waves, which can reveal information about a body's interior."},
    {"id": 3, "question": "What is astrobiology?", "options": ["The study of possible life in the universe", "The study of rocket fuel only", "The study of Earth's weather only"], "answer": 0, "explanation": "Astrobiology investigates the origin, evolution and potential for life in the universe."},
    {"id": 4, "question": "Why are mobile rovers useful compared with stationary landers?", "options": ["They can explore multiple locations", "They do not need power", "They can breathe Martian air"], "answer": 0, "explanation": "Rovers can travel to different locations and examine a wider variety of rocks and soil."},
    {"id": 5, "question": "Why did the Opportunity rover stop communicating in 2018?", "options": ["A dust storm blocked its solar panels", "It was deliberately switched off", "It left Mars orbit"], "answer": 0, "explanation": "A planet-wide dust storm blocked sunlight from Opportunity's solar panels, depleting its battery and ending the mission."},
    {"id": 6, "question": "What did Viking's biology experiments conclusively prove?", "options": ["That life definitely existed on Mars", "That life could never exist on Mars", "The results were scientifically interesting but ambiguous"], "answer": 2, "explanation": "Viking's results were intriguing but ambiguous — they did not establish the presence or permanent absence of life on Mars."},
    {"id": 7, "question": "What technology did Sojourner demonstrate for the first time on Mars?", "options": ["Nuclear-powered drilling", "A mobile wheeled robot that could examine rocks", "Atmospheric flight"], "answer": 1, "explanation": "Sojourner was the first successful wheeled rover to operate on Mars, demonstrating that mobile robots could explore another planet."},
    {"id": 8, "question": "How can seismic data reveal a planet's internal structure?", "options": ["By measuring how fast waves travel through different materials", "By photographing underground rock layers", "By counting craters from orbit"], "answer": 0, "explanation": "Seismic waves change speed and direction when passing through different materials, revealing internal layers and properties."},
    {"id": 9, "question": "What instrument did InSight use to detect marsquakes?", "options": ["Panoramic Camera", "Seismometer (SEIS)", "Rock Abrasion Tool"], "answer": 1, "explanation": "InSight's SEIS (Seismic Experiment for Interior Structure) was the most sensitive seismometer ever sent to another planet."},
    {"id": 10, "question": "Why is finding silica-rich material on Mars scientifically significant?", "options": ["Silica confirms the presence of dinosaurs", "Silica can form in hydrothermal or water-related environments", "Silica proves Mars was once covered by forests"], "answer": 1, "explanation": "Silica-rich deposits can form in hot-spring or hydrothermal settings, suggesting past water-related environments."},
    {"id": 11, "question": "What does Curiosity use as its power source, unlike Opportunity?", "options": ["Solar panels", "A radioisotope thermoelectric generator (RTG)", "Wind turbines"], "answer": 1, "explanation": "Curiosity uses an RTG, which converts heat from radioactive decay — unlike solar-powered rovers, it works through dust storms."},
    {"id": 12, "question": "The Apollo retroreflectors were placed on the Moon in 1969. Are they still used for science today?", "options": ["No — they stopped working after a few years", "Yes — laser observatories worldwide still bounce pulses off them to measure the Earth-Moon distance", "Only one still works"], "answer": 1, "explanation": "All major Apollo retroreflectors are still operational. Laser ranging stations continue to use them to measure the Earth-Moon distance to millimetre precision and test Einstein's theory of general relativity."},
]


@app.get("/", include_in_schema=False)
def home():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/api/health")
def health():
    return {"status": "ok", "application": "ABANDONED BUT NOT FORGOTTEN"}


@app.get("/api/equipment")
def get_equipment(world: str | None = None, q: str | None = None):
    records = _equipment
    if world and world.lower() != "all":
        records = [item for item in records if item["world"].lower() == world.lower()]
    if q:
        term = q.lower()[:100]  # cap length to prevent abuse
        records = [
            item for item in records
            if term in item["name"].lower()
            or term in item["purpose"].lower()
            or term in item.get("science", "").lower()
            or term in item.get("lesson", "").lower()
            or term in " ".join([
                item.get("story", {}).get("dream", ""),
                item.get("story", {}).get("mission", ""),
                item.get("story", {}).get("legacy", ""),
                item.get("uganda_connection", {}).get("local_link", ""),
            ]).lower()
        ]
    return records


@app.get("/api/equipment/{equipment_id}")
def get_equipment_detail(equipment_id: str):
    for item in _equipment:
        if item["id"] == equipment_id:
            return item
    raise HTTPException(status_code=404, detail="Equipment record not found")


# NASA Image and Video Library
NASA_IMAGE_API = "https://images-api.nasa.gov"
IMAGE_SEARCH_TERMS = {
    "opportunity": "Mars Exploration Rover Opportunity rover NASA",
    "spirit": "Mars Exploration Rover Spirit rover NASA",
    "apollo-seismometer": "Apollo Lunar Surface Experiments Package ALSEP seismic experiment",
    "viking": "Viking 1 Viking 2 Mars lander NASA",
    "sojourner": "Mars Pathfinder Sojourner rover NASA",
    "curiosity": "Mars Science Laboratory Curiosity rover Gale Crater NASA",
    "insight": "InSight Mars lander seismometer marsquake NASA",
    "apollo-retroreflectors": "Apollo lunar laser ranging retroreflector experiment Moon",
}

REQUIRED_TERMS = {
    "opportunity": ("opportunity", "rover"),
    "spirit": ("spirit", "rover"),
    "apollo-seismometer": ("alsep", "seismic"),
    "viking": ("viking", "lander"),
    "sojourner": ("sojourner", "rover"),
    "curiosity": ("curiosity", "rover"),
    "insight": ("insight",),
    "apollo-retroreflectors": ("retroreflector",),
}


def nasa_json(url: str):
    request = Request(url, headers={"User-Agent": "SPACE-LEGACY-educational-prototype/1.0"})
    with urlopen(request, timeout=18) as response:
        return json.loads(response.read().decode("utf-8"))


def get_nasa_original_images(equipment_id: str, limit: int = 12):
    if equipment_id not in IMAGE_SEARCH_TERMS:
        raise HTTPException(status_code=404, detail="No NASA image search configured for this equipment")
    query = urlencode({"q": IMAGE_SEARCH_TERMS[equipment_id], "media_type": "image", "page_size": limit})
    required_terms = REQUIRED_TERMS.get(equipment_id, (equipment_id,))
    try:
        payload = nasa_json(f"{NASA_IMAGE_API}/search?{query}")
        items = payload.get("collection", {}).get("items", [])
        results = []
        for item in items:
            metadata = (item.get("data") or [{}])[0]
            nasa_id = metadata.get("nasa_id")
            if not nasa_id:
                continue
            searchable = " ".join([
                str(metadata.get("title", "")),
                str(metadata.get("description", "")),
                " ".join(metadata.get("keywords", []) if isinstance(metadata.get("keywords"), list) else []),
            ]).lower()
            if not all(term in searchable for term in required_terms):
                continue
            try:
                manifest = nasa_json(f"{NASA_IMAGE_API}/asset/{nasa_id}")
                assets = manifest.get("collection", {}).get("items", [])
            except (URLError, HTTPError, TimeoutError, ValueError):
                continue
            asset_urls = [a.get("href", "") for a in assets if a.get("href", "").lower().endswith((".jpg", ".jpeg", ".png", ".tif", ".tiff"))]
            original = next((u for u in asset_urls if "~orig." in u.lower()), None)
            if not original:
                non_thumbnails = [u for u in asset_urls if not any(tag in u.lower() for tag in ("~thumb", "~small", "~medium"))]
                original = non_thumbnails[0] if non_thumbnails else None
            if not original:
                continue
            results.append({
                "nasa_id": nasa_id,
                "title": metadata.get("title", "NASA image"),
                "description": metadata.get("description", ""),
                "date_created": metadata.get("date_created", ""),
                "center": metadata.get("center", "NASA"),
                "photographer": metadata.get("photographer", ""),
                "image_url": original.replace("http://", "https://", 1),
                "nasa_record_url": f"https://images.nasa.gov/details/{nasa_id}",
                "credit": metadata.get("secondary_creator") or metadata.get("photographer") or "NASA",
            })
        return results
    except (URLError, HTTPError, TimeoutError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=f"NASA image service could not be reached: {exc}")


@app.get("/api/equipment/{equipment_id}/images")
def equipment_original_images(equipment_id: str, limit: int = 12):
    return {"equipment_id": equipment_id, "source": "NASA Image and Video Library", "images": get_nasa_original_images(equipment_id, max(1, min(limit, 30)))}


@app.get("/api/lessons")
def get_lessons():
    return _lessons


@app.get("/api/quiz")
def get_quiz():
    # Answers NOT returned to client — validated server-side via POST /api/quiz/check
    return [{"id": q["id"], "question": q["question"], "options": q["options"]} for q in QUIZ_BANK]


class QuizAnswer(BaseModel):
    question_id: int
    selected: int


@app.post("/api/quiz/check")
def check_quiz_answer(body: QuizAnswer):
    for q in QUIZ_BANK:
        if q["id"] == body.question_id:
            correct = body.selected == q["answer"]
            return {"correct": correct, "correct_index": q["answer"], "explanation": q["explanation"]}
    raise HTTPException(status_code=404, detail="Question not found")


# ── Leaderboard ───────────────────────────────────────────────────────────────
DB_PATH = BASE_DIR / "leaderboard.db"

def _init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS leaderboard (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                name         TEXT    NOT NULL,
                score        INTEGER NOT NULL,
                total        INTEGER NOT NULL,
                submitted_at TEXT    DEFAULT (datetime('now'))
            )
        """)

_init_db()


class ScoreSubmission(BaseModel):
    name: str
    score: int
    total: int


@app.get("/api/leaderboard")
def get_leaderboard():
    with sqlite3.connect(DB_PATH) as conn:
        rows = conn.execute(
            "SELECT name, score, total, submitted_at FROM leaderboard "
            "ORDER BY score DESC, submitted_at ASC LIMIT 10"
        ).fetchall()
    return [{"name": r[0], "score": r[1], "total": r[2], "submitted_at": r[3]} for r in rows]


@app.post("/api/leaderboard")
def submit_score(body: ScoreSubmission):
    name = body.name.strip()[:30]
    if not name:
        raise HTTPException(status_code=400, detail="Name required")
    if body.score < 0 or body.total <= 0 or body.score > body.total:
        raise HTTPException(status_code=400, detail="Invalid score")
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO leaderboard (name, score, total) VALUES (?, ?, ?)",
            (name, body.score, body.total),
        )
    return {"ok": True}


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
