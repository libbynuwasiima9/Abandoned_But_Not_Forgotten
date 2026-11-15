const API = "";
let equipmentRecords = [];
let quizQuestions = [];
let currentQuestion = 0;
let selectedOption = null;
let quizScore = 0;
let answered = false;

const $ = (id) => document.getElementById(id);

async function api(path) {
  const response = await fetch(`${API}${path}`);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function symbolFor(item) {
  if (item.world === "Moon") return "☾";
  if (item.id === "sojourner") return "◈";
  if (item.id === "viking") return "⌁";
  if (item.id === "curiosity") return "⊕";
  if (item.id === "insight") return "⊗";
  if (item.id === "apollo-retroreflectors") return "◇";
  return "✣";
}

function renderEquipment(items) {
  const grid = $("equipment-grid");
  if (!items.length) {
    grid.innerHTML = '<div class="empty">No equipment matched your search. Try another keyword or world.</div>';
    return;
  }
  grid.innerHTML = items.map(item => `
    <article class="equipment-card">
      <div class="card-art ${item.world === "Moon" ? "moon" : ""}">
        <span class="world-pill">${escapeHTML(item.world)}</span>
        <span class="planet-disc"></span>
        <span class="card-symbol">${symbolFor(item)}</span>
      </div>
      <div class="card-body">
        <div class="card-meta">${escapeHTML(item.mission)} · ${escapeHTML(item.years)}</div>
        <h3>${escapeHTML(item.name)}</h3>
        <p>${escapeHTML(item.purpose)}</p>
        <div class="card-bottom">
          <span class="status ${item.status === "Active" || item.status === "Still operational" ? "status-active" : ""}">${escapeHTML(item.status)}</span>
          <button data-open="${escapeHTML(item.id)}">Explore story ↗</button>
        </div>
      </div>
    </article>`).join("");
  grid.querySelectorAll("[data-open]").forEach(button => {
    button.addEventListener("click", () => openEquipment(button.dataset.open));
  });
}

async function loadEquipment() {
  try {
    equipmentRecords = await api("/api/equipment");
    renderEquipment(equipmentRecords);
    // Update hero stats dynamically
    const statEl = document.querySelector(".hero-stats div:nth-child(2) strong");
    const statLabel = document.querySelector(".hero-stats div:nth-child(2) span");
    if (statEl) statEl.textContent = equipmentRecords.length;
    if (statLabel) statLabel.textContent = "missions in the archive";
  } catch (error) {
    $("equipment-grid").innerHTML = `<div class="empty">Could not load equipment. Check that the Python server is running.</div>`;
  }
}

function filterEquipment() {
  const world = $("world-filter").value;
  const term = $("search-input").value.trim().toLowerCase();
  const filtered = equipmentRecords.filter(item => {
    const worldMatch = world === "all" || item.world === world;
    const story = item.story || {};
    const ug = item.uganda_connection || {};
    const haystack = [
      item.name, item.purpose, item.science, item.lesson, item.world,
      story.dream, story.mission, story.legacy, story.learned,
      ug.local_link || "", ug.topic || ""
    ].join(" ").toLowerCase();
    return worldMatch && haystack.includes(term);
  });
  renderEquipment(filtered);
}

async function openEquipment(id) {
  try {
    const item = await api(`/api/equipment/${encodeURIComponent(id)}`);
    const story = item.story;
    const ug = item.uganda_connection;
    const chapters = [
      ["THE DREAM", "What problem was humanity trying to solve?", story.dream],
      ["THE JOURNEY", "How did it get there, and what made the journey possible?", story.journey],
      ["THE MISSION", "What did it accomplish?", story.mission],
      ["THE CHALLENGES", "What threatened its mission?", story.challenges],
      ["THE ABANDONMENT", "Why was it left behind?", story.abandonment],
      ["THE EVIDENCE", "What evidence did it leave behind?", story.evidence],
      ["THE LEGACY", "What can humanity learn, and how can it help us today?", story.legacy]
    ];
    $("modal-content").innerHTML = `
      <div class="modal-kicker">${escapeHTML(item.world)} · ${escapeHTML(item.mission)} · ${escapeHTML(item.years)}</div>
      <h2 class="modal-title">${escapeHTML(item.name)}</h2>
      <p class="modal-intro">${escapeHTML(story.why_sent)}</p>
      <section class="original-gallery" id="original-image-gallery">
        <div class="eyebrow">ORIGINAL NASA PHOTOGRAPHS</div>
        <h3>See the actual hardware</h3>
        <div class="image-skeleton-grid">
          <div class="image-skeleton"></div><div class="image-skeleton"></div>
          <div class="image-skeleton"></div><div class="image-skeleton"></div>
        </div>
      </section>
      <div class="story-chapters">${chapters.map((chapter, i) => `
        <section class="story-step"><div class="story-number">${String(i + 1).padStart(2, "0")}</div>
        <div><div class="chapter-label">${chapter[0]}</div><div class="story-question">${chapter[1]}</div><p>${escapeHTML(chapter[2])}</p></div></section>`).join("")}</div>
      <section class="student-lab">
        <div class="eyebrow">THE KNOWLEDGE TODAY</div><h3>What can we do with what it taught us?</h3>
        <p>${escapeHTML(story.now)}</p>
        <div class="student-takeaway"><b>What can inspire the next generation?</b> ${escapeHTML(story.inspire)}</div>
      </section>
      <section class="student-lab school-lab">
        <div class="eyebrow">FOR SCHOOL-AGE EXPLORERS</div><h3>What can students learn from this hardware?</h3>
        <p>${escapeHTML(story.school)}</p>
        <div class="student-takeaway"><b>Try this challenge:</b> ${escapeHTML(item.student_activity)}</div>
      </section>
      ${ug ? `
      <section class="student-lab uganda-lab">
        <div class="eyebrow">UGANDA CONNECTION</div>
        <h3>${escapeHTML(ug.topic)}</h3>
        <p>${escapeHTML(ug.local_link)}</p>
        <div class="student-takeaway"><b>Try this locally:</b> ${escapeHTML(ug.local_activity)}</div>
        <div class="curriculum-tag"><b>Uganda curriculum:</b> ${escapeHTML(ug.curriculum)}</div>
      </section>` : ""}
      <section class="story-step"><div class="story-number">✦</div><div><div class="story-question">What did humanity learn from its work?</div><p>${escapeHTML(story.learned)}</p></div></section>
      <div class="source-panel"><div class="eyebrow">NASA SOURCES & FURTHER READING</div>${story.sources.map(source => `<a href="${escapeHTML(source.url)}" target="_blank" rel="noopener">${escapeHTML(source.label)} ↗</a>`).join("")}</div>
      <p class="content-note">Educational interpretation. Suggested student projects are learning applications inspired by the mission; they are not claims that NASA tested this hardware for those uses on Earth.</p>`;
    $("equipment-modal").showModal();
    loadOriginalImages(item.id);
    // Three.js modal planet — slight delay lets dialog layout settle
    setTimeout(() => { window.SpaceScene?.initModalPlanet(item.world); }, 60);
  } catch (error) {
    alert("Unable to load this equipment story.");
  }
}

async function loadOriginalImages(equipmentId) {
  const gallery = $("original-image-gallery");
  if (!gallery) return;
  try {
    const result = await api(`/api/equipment/${encodeURIComponent(equipmentId)}/images?limit=12`);
    if (!result.images.length) {
      gallery.innerHTML = '<div class="eyebrow">ORIGINAL NASA PHOTOGRAPHS</div><h3>Image archive</h3><p>No original image files were returned for this search. Try the NASA record search below.</p><a href="https://images.nasa.gov/" target="_blank" rel="noopener">Search NASA Images ↗</a>';
      return;
    }
    gallery.innerHTML = `<div class="eyebrow">ORIGINAL NASA PHOTOGRAPHS</div><h3>See the actual hardware</h3><p>These files are retrieved from NASA's image archive. Select an image to view the original-resolution file.</p><div class="original-image-grid">${result.images.map(image => `
      <article class="original-image-card">
        <a href="${escapeHTML(image.image_url)}" target="_blank" rel="noopener"><img src="${escapeHTML(image.image_url)}" alt="${escapeHTML(image.title)}" loading="lazy"></a>
        <div class="original-image-meta"><b>${escapeHTML(image.title)}</b><span>${escapeHTML(image.date_created || "Date not listed")} · ${escapeHTML(image.credit || "NASA")}</span><a href="${escapeHTML(image.nasa_record_url)}" target="_blank" rel="noopener">NASA image record ↗</a></div>
      </article>`).join("")}</div><p class="image-credit-note">NASA Image and Video Library. Images remain hosted by NASA; titles, dates and credits are shown from NASA catalogue metadata.</p>`;
  } catch (error) {
    gallery.innerHTML = '<div class="eyebrow">ORIGINAL NASA PHOTOGRAPHS</div><h3>NASA image archive temporarily unavailable</h3><p>The mission story is available, but the live image lookup failed. You can search the NASA archive directly.</p><a href="https://images.nasa.gov/" target="_blank" rel="noopener">Open NASA Image and Video Library ↗</a>';
  }
}

// Key science terms in Swahili (widely spoken in Uganda) for classroom reference
const SWAHILI_TERMS = [
  ["Sayansi", "Science"],
  ["Sayari", "Planet"],
  ["Mwamba / Miamba", "Rock / Rocks"],
  ["Madini", "Mineral"],
  ["Maji", "Water"],
  ["Tetemeko la ardhi", "Earthquake / Seismic event"],
  ["Roboti", "Robot / Rover"],
  ["Angani", "Space / Sky"],
  ["Jua", "Sun / Solar"],
  ["Uvumbuzi", "Discovery"],
];

async function loadLessons() {
  try {
    const lessons = await api("/api/lessons");
    const icons = { geology: "◈", astrobiology: "✧", seismology: "〰", robotics: "⚙", chemistry: "⚗", physics: "◇" };
    $("lesson-grid").innerHTML = lessons.map((lesson, index) => `
      <button class="lesson-card ${index === 0 ? "active" : ""}" data-lesson="${escapeHTML(lesson.id)}">
        <span class="lesson-icon">${icons[lesson.id] || "✦"}</span>
        <h3>${escapeHTML(lesson.title)}</h3>
        <p>${escapeHTML(lesson.subtitle)}</p>
      </button>`).join("");
    $("lesson-grid").querySelectorAll("[data-lesson]").forEach(button => {
      button.addEventListener("click", () => {
        $("lesson-grid").querySelectorAll(".lesson-card").forEach(x => x.classList.remove("active"));
        button.classList.add("active");
        showLesson(lessons.find(x => x.id === button.dataset.lesson));
      });
    });
    showLesson(lessons[0]);

    // Swahili glossary (static, appended once after lessons load)
    const scienceBand = document.querySelector(".science-band .section-wrap");
    if (scienceBand && !document.getElementById("swahili-glossary")) {
      const glossaryEl = document.createElement("div");
      glossaryEl.id = "swahili-glossary";
      glossaryEl.className = "swahili-glossary";
      glossaryEl.innerHTML = `
        <div class="eyebrow">SCIENCE VOCABULARY · SWAHILI (SPOKEN ACROSS UGANDA)</div>
        <div class="glossary-grid">${SWAHILI_TERMS.map(([sw, en]) =>
          `<div class="glossary-item"><span class="glossary-sw">${escapeHTML(sw)}</span><span class="glossary-en">${escapeHTML(en)}</span></div>`
        ).join("")}</div>
        <p class="glossary-note">Swahili is a national language in Uganda alongside English. These terms support bilingual science teaching.</p>`;
      scienceBand.appendChild(glossaryEl);
    }
  } catch (error) {
    $("lesson-grid").innerHTML = '<div class="empty">Science lessons could not be loaded.</div>';
  }
}

function showLesson(lesson) {
  const related = lesson.equipment.map(id => equipmentRecords.find(item => item.id === id)?.name).filter(Boolean);
  const detail = $("lesson-detail");
  detail.classList.remove("hidden");
  const curriculumHTML = lesson.curriculum_alignment ? `
    <div class="curriculum-panel">
      <div class="eyebrow">UGANDA CURRICULUM ALIGNMENT (UNEB)</div>
      <div class="curriculum-grid">${lesson.curriculum_alignment.map(c =>
        `<div class="curriculum-item"><strong>${escapeHTML(c.level)}</strong><span>${escapeHTML(c.subject)}: ${escapeHTML(c.topic)}</span></div>`
      ).join("")}</div>
    </div>` : "";
  detail.innerHTML = `
    <div>
      <div class="eyebrow">SCIENCE PATHWAY</div>
      <h3>${escapeHTML(lesson.title)}</h3>
      <p>${escapeHTML(lesson.description)}</p>
      <p><b>Related equipment:</b> ${related.map(escapeHTML).join(", ")}</p>
      <p><b>Key idea:</b> ${escapeHTML(lesson.takeaway)}</p>
      ${curriculumHTML}
    </div>
    <div class="activity">
      <div class="eyebrow">TRY THIS INVESTIGATION</div>
      <p>${escapeHTML(lesson.activity)}</p>
      <p style="color:var(--gold);font-size:11px">Think about the evidence. What would you observe or measure?</p>
    </div>`;
}

async function loadTimeline() {
  try {
    const items = await api("/api/equipment");
    $("timeline-select").innerHTML = items.map(item => `<option value="${escapeHTML(item.id)}">${escapeHTML(item.name)}</option>`).join("");
    $("timeline-select").addEventListener("change", renderTimeline);
    renderTimeline();
  } catch (error) {
    $("timeline-content").textContent = "Timeline unavailable.";
  }
}

function renderTimeline() {
  const item = equipmentRecords.find(x => x.id === $("timeline-select").value);
  if (!item) return;
  $("timeline-content").innerHTML = `
    <div class="timeline-title">${escapeHTML(item.name)} <span style="color:var(--muted);font-size:12px">· ${escapeHTML(item.world)}</span></div>
    <div class="timeline-list">${item.timeline.map(event => `
      <div class="timeline-item"><strong>${escapeHTML(event.date)}</strong><p>${escapeHTML(event.event)}</p></div>
    `).join("")}</div>`;
}

async function loadQuiz() {
  try {
    quizQuestions = await api("/api/quiz");
    renderQuestion();
  } catch (error) {
    $("quiz-content").textContent = "Quiz unavailable.";
  }
}

function renderQuestion() {
  const q = quizQuestions[currentQuestion];
  if (!q) {
    $("quiz-progress").textContent = "CHALLENGE COMPLETE";
    const pct = Math.round((quizScore / quizQuestions.length) * 100);
    $("quiz-content").innerHTML = `
      <h3 class="quiz-question">You scored ${quizScore} out of ${quizQuestions.length}!</h3>
      <div class="score-bar-wrap"><div class="score-bar" style="width:${pct}%"></div></div>
      <p style="color:var(--muted);margin-top:8px">${pct >= 80 ? "Excellent work, Space Explorer." : pct >= 50 ? "Good effort — keep exploring the archive." : "Keep discovering — revisit the mission stories."}</p>
      <div class="score-submit-panel" id="score-submit-panel">
        <div class="eyebrow" style="margin-bottom:8px">SUBMIT TO LEADERBOARD</div>
        <div class="score-submit-row">
          <input id="player-name-input" type="text" placeholder="Your name…" maxlength="30" class="score-name-input">
          <button id="submit-score-btn" class="btn btn-primary">Submit ↗</button>
        </div>
        <span id="score-submit-feedback" class="score-feedback"></span>
      </div>`;
    $("quiz-next").textContent = "Try again";
    $("quiz-next").disabled = false;
    $("quiz-next").onclick = resetQuiz;
    $("quiz-feedback").textContent = "";
    const btn = $("submit-score-btn");
    if (btn) btn.addEventListener("click", submitScoreToLeaderboard);
    return;
  }
  answered = false;
  selectedOption = null;
  $("quiz-progress").textContent = `QUESTION ${currentQuestion + 1} OF ${quizQuestions.length}`;
  $("quiz-content").innerHTML = `<h3 class="quiz-question">${escapeHTML(q.question)}</h3>` +
    q.options.map((option, index) => `<button class="quiz-option" data-option="${index}">${String.fromCharCode(65 + index)}. ${escapeHTML(option)}</button>`).join("");
  $("quiz-content").querySelectorAll("[data-option]").forEach(button => {
    button.addEventListener("click", () => {
      if (answered) return;
      selectedOption = Number(button.dataset.option);
      $("quiz-content").querySelectorAll(".quiz-option").forEach(x => x.classList.remove("selected"));
      button.classList.add("selected");
      $("quiz-next").disabled = false;
    });
  });
  $("quiz-next").textContent = "Check answer";
  $("quiz-next").disabled = true;
  $("quiz-next").onclick = checkAnswer;
  $("quiz-feedback").textContent = "";
}

async function checkAnswer() {
  const q = quizQuestions[currentQuestion];
  if (!answered) {
    if (selectedOption === null) return;
    answered = true;
    $("quiz-next").disabled = true;
    try {
      const res = await fetch(`${API}/api/quiz/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question_id: q.id, selected: selectedOption })
      });
      if (!res.ok) throw new Error("check failed");
      const data = await res.json();
      const buttons = $("quiz-content").querySelectorAll(".quiz-option");
      buttons.forEach((button, index) => {
        if (index === data.correct_index) button.classList.add("correct");
        else if (index === selectedOption && !data.correct) button.classList.add("incorrect");
      });
      if (data.correct) {
        quizScore++;
        $("quiz-feedback").textContent = "Correct! " + data.explanation;
      } else {
        $("quiz-feedback").textContent = "Not quite. " + data.explanation;
      }
    } catch (e) {
      $("quiz-feedback").textContent = "Could not check answer. Is the server running?";
      answered = false;
      $("quiz-next").disabled = false;
      return;
    }
    $("quiz-next").textContent = currentQuestion === quizQuestions.length - 1 ? "See my score" : "Next question";
    $("quiz-next").disabled = false;
  } else {
    currentQuestion++;
    renderQuestion();
  }
}

function resetQuiz() {
  currentQuestion = 0;
  quizScore = 0;
  renderQuestion();
}

const _refreshBtn = $("refresh-leaderboard");
if (_refreshBtn) _refreshBtn.addEventListener("click", loadLeaderboard);

$("world-filter").addEventListener("change", filterEquipment);
$("search-input").addEventListener("input", filterEquipment);
$("modal-close").addEventListener("click", () => { $("equipment-modal").close(); window.SpaceScene?.disposeModalPlanet(); });
$("equipment-modal").addEventListener("click", event => {
  if (event.target === $("equipment-modal")) { $("equipment-modal").close(); window.SpaceScene?.disposeModalPlanet(); }
});
$("menu-toggle").addEventListener("click", () => $("main-nav").classList.toggle("open"));
$("main-nav").querySelectorAll("a").forEach(a => a.addEventListener("click", () => $("main-nav").classList.remove("open")));

async function loadLeaderboard() {
  const content = $("leaderboard-content");
  if (!content) return;
  try {
    const scores = await api("/api/leaderboard");
    if (!scores.length) {
      content.innerHTML = '<div class="empty">No scores yet. Complete the quiz to be first on the board!</div>';
      return;
    }
    content.innerHTML = `<table class="leaderboard-table">
      <thead><tr><th>Rank</th><th>Explorer</th><th>Score</th><th>Date</th></tr></thead>
      <tbody>${scores.map((s, i) => `
        <tr class="${i === 0 ? "lb-first" : i === 1 ? "lb-second" : i === 2 ? "lb-third" : ""}">
          <td class="lb-rank">${i === 0 ? "✦" : i + 1}</td>
          <td>${escapeHTML(s.name)}</td>
          <td class="lb-score">${s.score} <span>/ ${s.total}</span></td>
          <td class="lb-date">${escapeHTML((s.submitted_at || "").slice(0, 10))}</td>
        </tr>`).join("")}
      </tbody>
    </table>`;
  } catch (e) {
    content.innerHTML = '<div class="empty">Leaderboard unavailable. Is the server running?</div>';
  }
}

async function submitScoreToLeaderboard() {
  const nameEl = $("player-name-input");
  const feedbackEl = $("score-submit-feedback");
  if (!nameEl || !feedbackEl) return;
  const name = nameEl.value.trim();
  if (!name) { feedbackEl.textContent = "Enter your name first."; return; }
  try {
    const res = await fetch(`${API}/api/leaderboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, score: quizScore, total: quizQuestions.length }),
    });
    if (!res.ok) throw new Error();
    const panel = $("score-submit-panel");
    if (panel) panel.innerHTML = `<p class="submit-success">Score submitted! <a href="#leaderboard">See the leaderboard ↗</a></p>`;
    loadLeaderboard();
  } catch (e) {
    feedbackEl.textContent = "Could not submit. Try again.";
  }
}

async function init() {
  await loadEquipment();
  loadInvestigation();
  await loadLessons();
  await loadTimeline();
  await loadQuiz();
  await loadLeaderboard();
  // Three.js — init after DOM ready, non-blocking
  requestAnimationFrame(() => {
    if (window.SpaceScene) {
      window.SpaceScene.initStarfield();
      window.SpaceScene.initHeroPlanet();
    }
  });
}
init();

// Virtual investigation scenarios — evidence cards are simplified teaching simulations
const investigationScenarios = {
  opportunity: {
    title: "Did water shape these Martian rocks?",
    question: "What can rock textures and mineral clues tell us about the past environment at Meridiani Planum?",
    brief: "You are part of a planetary geology team examining clues collected by the Opportunity rover. Study the simplified evidence before deciding what environment may have formed these rocks.",
    evidence: [
      { type: "Image observation", title: "Layered rock outcrop", value: "Visible layers", description: "The rock exposure shows thin, repeated layers. Layering can form through several processes, including deposition by water, wind or volcanic activity." },
      { type: "Mineral clue", title: "Hematite-rich spherules", value: "Small round grains", description: "Opportunity found iron-rich, spherical concretions nicknamed 'blueberries'. On Earth, similar hematite features can form in water-related settings." },
      { type: "Geological context", title: "Salt-rich minerals", value: "Chemical evidence", description: "Rocks at Meridiani Planum contain minerals and textures consistent with past interaction with liquid water, including acidic and salty conditions." }
    ],
    options: ["Liquid water played a role in forming or altering these rocks", "The rocks prove that plants once grew on Mars", "The rocks were certainly formed by recent volcanic eruptions"],
    best: 0,
    explanation: "The strongest interpretation is that liquid water played a role in the rocks' formation or alteration. The evidence supports past wet environments; it does not prove that life existed.",
    conclusion: "Opportunity found geological evidence that parts of Meridiani Planum experienced liquid water in the past, including conditions that were acidic and salty. Scientists combine textures, mineral chemistry and geological context rather than relying on one clue alone.",
    takeaway: "Evidence of past water is not the same as evidence of past life. Scientists need multiple independent lines of evidence.",
    source: "NASA: Opportunity mission and science instruments", sourceUrl: "https://science.nasa.gov/mission/mer-opportunity/"
  },
  spirit: {
    title: "What does bright soil tell us about ancient Mars?",
    question: "Could a pale, silica-rich deposit be a clue to ancient hot-spring or hydrothermal activity?",
    brief: "Spirit explored Gusev Crater. Imagine you are reviewing a simplified field report from a location where the rover's wheel disturbed the soil and exposed a pale material.",
    evidence: [
      { type: "Surface observation", title: "Pale material exposed", value: "Bright soil patch", description: "A wheel disturbance exposed a light-toned patch that looked different from the surrounding darker soil." },
      { type: "Composition clue", title: "Silica-rich material", value: "High silica", description: "Spirit's measurements identified a deposit rich in silica. Silica can occur in environments such as hot springs and hydrothermal systems." },
      { type: "Environmental clue", title: "Possible alteration by water", value: "Hydrothermal possibility", description: "The mineral evidence is consistent with past water-related processes, but scientists need geological context and additional measurements to assess how it formed." }
    ],
    options: ["The deposit may record past hydrothermal or hot-spring activity", "The pale colour alone proves that living organisms made it", "The deposit proves that liquid water is flowing there today"],
    best: 0,
    explanation: "Silica-rich deposits can form in hydrothermal settings, so this is a reasonable interpretation. The evidence is not proof of life and does not mean water is flowing today.",
    conclusion: "Spirit discovered silica-rich materials at a site where the geological context suggested past hydrothermal activity. This expanded the range of ancient environments scientists considered when studying Mars.",
    takeaway: "A mineral can preserve clues about the environment in which it formed, but more than one explanation may need to be tested.",
    source: "NASA: Mars Exploration Rovers — Spirit and Opportunity", sourceUrl: "https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/"
  },
  "apollo-seismometer": {
    title: "What is inside the Moon?",
    question: "How can vibrations recorded at the surface help scientists infer the Moon's internal structure?",
    brief: "You are a lunar seismologist. A seismometer records ground motion over time. Use the simplified wave report to think about what seismic signals can reveal beneath the lunar surface.",
    evidence: [
      { type: "Instrument reading", title: "Ground motion detected", value: "Wave signal", description: "A seismometer records vibrations as a changing signal. The signal's timing and shape can be studied after a moonquake or impact." },
      { type: "Wave behaviour", title: "Different arrival times", value: "Early + later waves", description: "Seismic waves can travel at different speeds and follow different paths through materials. Their arrival times provide clues about what lies underground." },
      { type: "Scientific method", title: "Compare many events", value: "Repeated records", description: "Scientists compare signals from multiple events and stations to build and refine models of the Moon's interior." }
    ],
    options: ["Seismic waves can reveal layers and properties inside the Moon", "A seismometer directly photographs the Moon's core", "One vibration proves the Moon is hollow"],
    best: 0,
    explanation: "Seismic waves change as they travel through different materials. Comparing many records helps scientists infer internal layers and properties.",
    conclusion: "Apollo seismic experiments recorded moonquakes and impacts. The data helped scientists investigate the Moon's internal structure and showed how instruments left on the lunar surface could continue doing science after astronauts departed.",
    takeaway: "Scientists often infer what they cannot see directly by measuring how waves travel through a material.",
    source: "NASA: Apollo 11 Seismic Experiment", sourceUrl: "https://science.nasa.gov/resource/apollo-11-seismic-experiment/"
  },
  viking: {
    title: "Did Viking find life on Mars?",
    question: "How should scientists interpret a chemical or biological test that gives an unexpected result?",
    brief: "You are reviewing simplified results from the Viking landers' life-detection experiments. Your task is to decide whether the evidence is enough to claim that life was found.",
    evidence: [
      { type: "Biology experiment", title: "Soil response", value: "Unexpected reaction", description: "One experiment detected a response after nutrients were added to a soil sample. A response alone does not identify its cause." },
      { type: "Chemical analysis", title: "Organic molecules", value: "No clear detection", description: "The Viking gas chromatograph–mass spectrometer did not find the expected organic compounds in the tested soil samples at its detection limits." },
      { type: "Interpretation", title: "Competing explanations", value: "Ambiguous evidence", description: "Chemical reactions can sometimes occur without biology. Scientists must compare biological and non-biological explanations and consider instrument limits." }
    ],
    options: ["The results were interesting but did not establish that life was present", "The reaction conclusively proves living organisms were found", "A negative organic result proves life can never exist on Mars"],
    best: 0,
    explanation: "The Viking results were scientifically important but ambiguous. They did not establish that life was present, and they do not prove that life could never exist on Mars.",
    conclusion: "Viking carried out the first direct experiments designed to test for life on Mars. The results did not provide conclusive evidence of life. They shaped later discussions about the chemistry of Martian soil and how future life-detection experiments should be designed.",
    takeaway: "A surprising result is not automatically proof. Strong scientific claims require controls, alternative explanations and appropriate follow-up tests.",
    source: "NASA: Viking mission resources", sourceUrl: "https://science.nasa.gov/mars/resources/viking-mission-resources/"
  },
  sojourner: {
    title: "How can a small rover explore a whole new world?",
    question: "How can mobility, cameras and measurements help a rover investigate rocks beyond its landing site?",
    brief: "You are planning a short traverse for Sojourner at Ares Vallis. Choose what evidence to collect and consider why a mobile robot can learn more than a stationary lander alone.",
    evidence: [
      { type: "Mobility record", title: "Three nearby targets", value: "A · B · C", description: "A small rover can move between nearby rocks and soil patches, allowing scientists to compare different materials at one landing site." },
      { type: "Camera observation", title: "Rock textures differ", value: "Rounded + angular", description: "Images can document shape, texture and context. Rounded rocks may have been transported or worn, but shape alone does not identify the process." },
      { type: "Instrument measurement", title: "Composition matters", value: "APXS analysis", description: "An Alpha Particle X-ray Spectrometer can help determine the elemental composition of rocks and soil, adding information beyond appearance." }
    ],
    options: ["Mobility lets scientists compare several targets using images and instrument measurements", "A camera image alone identifies every mineral with certainty", "A rover can explore without power, communication or planning"],
    best: 0,
    explanation: "A rover combines mobility, imaging and scientific measurements to compare targets. Each type of evidence has limits, so scientists use them together.",
    conclusion: "Sojourner demonstrated that a small wheeled rover could operate on Mars, approach rocks and collect useful images and measurements. It helped establish the value of mobile robotic exploration for later missions.",
    takeaway: "Robotic exploration combines engineering and science: mobility reaches targets, cameras provide context and instruments measure properties that eyes cannot determine.",
    source: "NASA Space Place: The Mars Rovers — Sojourner", sourceUrl: "https://spaceplace.nasa.gov/mars-sojourner/en/"
  }
};

function loadInvestigation() {
  const select = $("investigation-select");
  if (!select) return;
  select.innerHTML = equipmentRecords.map(item => `<option value="${escapeHTML(item.id)}">${escapeHTML(item.name)}</option>`).join("");
  select.addEventListener("change", renderInvestigation);
  $("submit-investigation").addEventListener("click", submitInvestigation);
  renderInvestigation();
}

function renderInvestigation() {
  const id = $("investigation-select").value || equipmentRecords[0]?.id;
  const scenario = investigationScenarios[id];
  if (!scenario) {
    $("investigation-brief").innerHTML = `<p class="mission-question">No virtual investigation is currently configured for this mission. Open the equipment story to find learning activities and student challenges.</p>`;
    $("evidence-grid").innerHTML = "";
    $("hypothesis-select").innerHTML = "";
    $("submit-investigation").style.display = "none";
    $("investigation-feedback").className = "investigation-feedback";
    $("investigation-feedback").textContent = "";
    $("scientist-conclusion").classList.add("hidden");
    return;
  }
  $("submit-investigation").style.display = "";
  $("investigation-brief").innerHTML = `<h3>${escapeHTML(scenario.title)}</h3><p>${escapeHTML(scenario.brief)}</p><p class="mission-question"><b>Investigation question:</b> ${escapeHTML(scenario.question)}</p>`;
  $("evidence-grid").innerHTML = scenario.evidence.map((item, index) => `
    <article class="evidence-card"><div class="evidence-type">Evidence ${index + 1} · ${escapeHTML(item.type)}</div><h4>${escapeHTML(item.title)}</h4><div class="evidence-value">${escapeHTML(item.value)}</div><p>${escapeHTML(item.description)}</p></article>`).join("");
  $("hypothesis-select").innerHTML = `<option value="">Select the explanation that best fits the evidence…</option>` + scenario.options.map((option, index) => `<option value="${index}">${escapeHTML(option)}</option>`).join("");
  $("student-observations").value = "";
  $("investigation-feedback").className = "investigation-feedback";
  $("investigation-feedback").textContent = "";
  $("scientist-conclusion").classList.add("hidden");
  $("scientist-conclusion").innerHTML = "";
}

function submitInvestigation() {
  const id = $("investigation-select").value;
  const scenario = investigationScenarios[id];
  if (!scenario) return;
  const observations = $("student-observations").value.trim();
  const hypothesis = $("hypothesis-select").value;
  const feedback = $("investigation-feedback");
  if (observations.length < 20) {
    feedback.className = "investigation-feedback error";
    feedback.textContent = "Add at least two observations in a few sentences before submitting. Describe what the evidence shows, not just what you think caused it.";
    $("student-observations").focus();
    return;
  }
  if (hypothesis === "") {
    feedback.className = "investigation-feedback error";
    feedback.textContent = "Choose the hypothesis that best fits the evidence, then submit again.";
    $("hypothesis-select").focus();
    return;
  }
  const correct = Number(hypothesis) === scenario.best;
  feedback.className = `investigation-feedback ${correct ? "success" : ""}`;
  feedback.innerHTML = `<b>${correct ? "Strong scientific reasoning." : "Good attempt — compare your explanation with the evidence."}</b> ${escapeHTML(scenario.explanation)} Your observations have been recorded in this session; they are not sent to a server or saved after you close or refresh the page.`;
  const conclusion = $("scientist-conclusion");
  conclusion.classList.remove("hidden");
  conclusion.innerHTML = `<h3>What did the scientists conclude?</h3><p>${escapeHTML(scenario.conclusion)}</p><p class="takeaway"><b>Investigator's takeaway:</b> ${escapeHTML(scenario.takeaway)}</p><p><b>Suggested NASA reading:</b> <a href="${escapeHTML(scenario.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHTML(scenario.source)}</a>.</p>`;
}
