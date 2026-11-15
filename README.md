# SPACE LEGACY — The Stories Left Behind

An educational web prototype that tells the stories of retired NASA equipment on the Moon and Mars. Each story follows the dream, journey, mission, challenges, abandonment, evidence and legacy of the hardware, then connects its lessons to hands-on learning for school-age enthusiasts.

## Features included

- Responsive, space-themed homepage
- Equipment gallery with Mars/Moon filter and text search
- Seven-chapter mission story for every equipment profile: the dream, journey, mission, challenges, abandonment, evidence and legacy
- Answers to why each machine was sent, what it experienced, what humanity learned and how its knowledge can be used today
- School-age learning outcomes and practical project ideas for every piece of hardware
- NASA primary-source links within each equipment story
- A practical student investigation activity and a key takeaway for every equipment profile
- Science Discovery Lab with five learning pathways
- Virtual Science Investigation with five mission-specific evidence activities, observation notes, hypotheses, feedback and scientist conclusions
- Mission timelines for each equipment record
- Interactive multiple-choice quiz with explanations
- FastAPI backend and JSON data files
- No paid API keys or database required


## Virtual Science Investigation

Open **Virtual Investigation** from the navigation bar. Choose one of the five missions, examine its three evidence cards, record at least two observations, select the hypothesis that best fits the evidence, and submit. The prototype then gives feedback and compares the learner's reasoning with the scientific conclusion.

The five investigations cover:

- Opportunity: rock layers, hematite-rich spherules and evidence of ancient water
- Spirit: silica-rich material and possible hydrothermal environments
- Apollo seismic experiments: how seismic waves reveal the Moon's interior
- Viking: interpreting ambiguous life-detection experiment results
- Sojourner: how rover mobility, cameras and APXS measurements work together

**Important:** evidence cards are simplified teaching simulations based on NASA mission findings. They are not raw instrument readings or original NASA telemetry. Observation notes stay in the current browser session and are not saved to a database. Each investigation includes a NASA source link for further reading.

## Requirements

- Python 3.10+
- VS Code (recommended)
- Internet connection only if you want Google Fonts to load; the app itself runs locally without it.

## Run on Windows 10/11

Open the project folder in VS Code. In the VS Code terminal, run:

```powershell
py -m venv .venv
.venv\Scripts\activate
py -m pip install -r requirements.txt
py -m uvicorn main:app --reload
```

If `py` is not recognized but `python` is, use `python` instead of `py`.

Open:

- Website: http://127.0.0.1:8000
- API documentation: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/api/health

Stop the server with `Ctrl+C`.

## Project structure

```text
SPACE_LEGACY/
├── main.py
├── requirements.txt
├── README.md
├── data/
│   ├── equipment.json
│   └── lessons.json
└── static/
    ├── index.html
    ├── css/style.css
    └── js/app.js
```

## Suggested 6-hour team plan

| Time | Work | Deliverable |
|---|---|---|
| 0:00–0:30 | Setup, install dependencies, run starter app | App opens locally |
| 0:30–1:30 | Verify equipment stories and source notes | Reliable content |
| 1:30–2:30 | Improve gallery, filters and equipment details | Explore experience |
| 2:30–3:30 | Improve science lessons and quiz | Learning experience |
| 3:30–4:30 | Add NASA images with captions and source links | Evidence-rich stories |
| 4:30–5:15 | Test on laptop and phone; fix bugs | Stable prototype |
| 5:15–6:00 | Prepare demo, pitch and submission notes | Competition presentation |

## Important content and competition notes

- This is a prototype, not an official NASA product.
- The equipment records are starter summaries. Verify every date, instrument, discovery and mission status against NASA primary sources before submitting.
- Clearly distinguish mission-ended hardware, inactive experiments and equipment whose mission status differs.
- Add image credits and follow NASA media usage guidance.
- The quiz endpoint exposes answer keys because this is a local demonstration. For a public deployment, move answer validation to the backend.
- Do not claim that evidence of ancient water proves life existed on Mars.

## Best next improvements

1. Add NASA image search/API integration and display source links.
2. Add one properly licensed 3D rover model using `<model-viewer>`.
3. Add a bibliography/source panel to every equipment story.
4. Add an optional teacher/learner mode and saved quiz scores.
5. Add AI only after the verified content library is ready.


## Five-question science story model

Every equipment record in `data/equipment.json` includes these fields:

1. `designed_to_do`
2. `instruments_and_technologies`
3. `scientific_question`
4. `discoveries`
5. `change_in_knowledge`

It also includes `student_activity` and `student_takeaway`, so each profile becomes a practical lesson rather than only a description. The equipment detail modal displays all five questions in order.


## Story structure in this version

Every equipment profile now answers: why was it sent into space; what problem was humanity trying to solve; how did it travel to its destination; what did it accomplish; what challenges threatened it; why was it left behind; what evidence did it return; what did humanity learn; what can learners do with that knowledge today; and how can the story inspire another generation?

The five starter stories are Opportunity, Spirit, Apollo lunar seismic experiments, Viking landers and Sojourner. Student activities are proposed educational applications inspired by the missions, not claims that NASA tested the equipment for those uses on Earth. Check the NASA source links inside each profile before formal publication.

## Original NASA equipment photographs

The equipment story dialog now requests photographs from NASA's Image and Video Library API:
`https://images-api.nasa.gov/search` and resolves each NASA asset through `/asset/{nasa_id}`.
The backend prefers the original `~orig` image file rather than a thumbnail and returns the NASA record URL, title, date and credit metadata.

Endpoint: `GET /api/equipment/{equipment_id}/images?limit=12`

Supported IDs: `opportunity`, `spirit`, `apollo-seismometer`, `viking`, `sojourner`.

The gallery requires an internet connection when the application is running. NASA API availability and the number of original files vary by mission. If no matching original asset is available, the interface provides a link to NASA's Image and Video Library rather than substituting an unrelated image. NASA API documentation: https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf
