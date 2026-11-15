const equipmentId = window.location.pathname.replace("/equipment/", "").replace(/\/$/, "");
const HAS_MODEL = ["opportunity", "insight", "cassini"];

function escapeHTML(v) {
  return String(v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
}

function symbolFor(id, world) {
  const map = { "apollo-retroreflectors": "◇", "sojourner": "◈", "viking": "⌁", "curiosity": "⊕", "insight": "⊗", "cassini": "◉", "voyager-1": "⇥" };
  if (world === "Moon") return "☾";
  return map[id] || "✣";
}

async function loadEquipmentPage() {
  try {
    const res = await fetch(`/api/equipment/${encodeURIComponent(equipmentId)}`);
    if (!res.ok) throw new Error(res.status);
    const item = await res.json();
    renderPage(item);
  } catch (e) {
    document.getElementById("ep-main").innerHTML = `
      <div class="ep-error section-wrap">
        <h2>Mission story not found</h2>
        <p>The equipment record for <b>${escapeHTML(equipmentId)}</b> could not be loaded.</p>
        <a href="/" class="btn btn-primary">← Return to archive</a>
      </div>`;
  }
}

function renderPage(item) {
  document.title = `${item.name} | ABANDONED BUT NOT FORGOTTEN`;
  const story = item.story;
  const ug = item.uganda_connection;

  const chapters = [
    ["01", "THE DREAM",       "What problem was humanity trying to solve?",             story.dream],
    ["02", "THE JOURNEY",     "How did it get there?",                                  story.journey],
    ["03", "THE MISSION",     "What did it accomplish?",                                story.mission],
    ["04", "THE CHALLENGES",  "What threatened its mission?",                           story.challenges],
    ["05", "THE ABANDONMENT", "Why was it left behind?",                                story.abandonment],
    ["06", "THE EVIDENCE",    "What evidence did it leave behind?",                     story.evidence],
    ["07", "THE LEGACY",      "What can humanity learn from it today?",                 story.legacy],
  ];

  const timelineHTML = item.timeline?.length ? `
    <section class="ep-section">
      <div class="eyebrow">MISSION TIMELINE</div>
      <h2 class="ep-section-title">From launch to <span>legacy</span></h2>
      <div class="ep-timeline">
        ${item.timeline.map(e => `
          <div class="ep-tl-item">
            <div class="ep-tl-dot"></div>
            <strong>${escapeHTML(e.date)}</strong>
            <p>${escapeHTML(e.event)}</p>
          </div>`).join("")}
      </div>
    </section>` : "";

  const instrumentsHTML = item.instruments_and_technologies?.length ? `
    <section class="ep-section ep-section-dark">
      <div class="section-wrap">
        <div class="eyebrow">INSTRUMENTS & TECHNOLOGIES</div>
        <h2 class="ep-section-title">How it <span>worked</span></h2>
        <div class="ep-instruments">
          ${item.instruments_and_technologies.map(inst => {
            const [name, ...desc] = inst.split(" – ");
            return `<div class="ep-instrument-card">
              <div class="ep-inst-name">${escapeHTML(name)}</div>
              ${desc.length ? `<p>${escapeHTML(desc.join(" – "))}</p>` : ""}
            </div>`;
          }).join("")}
        </div>
      </div>
    </section>` : "";

  const ugandaHTML = ug ? `
    <section class="ep-section ep-uganda-section">
      <div class="section-wrap">
        <div class="eyebrow" style="color:#64c9a5">UGANDA CONNECTION</div>
        <h2 class="ep-section-title">${escapeHTML(ug.topic)}</h2>
        <p class="ep-body-text">${escapeHTML(ug.local_link)}</p>
        <button class="btn-translate" id="ep-translate-btn" data-text="${escapeHTML(ug.local_link)}">↔ Translate to Swahili</button>
        <div id="ep-translate-result" class="translate-result hidden"></div>
        <div class="ep-activity-box">
          <div class="eyebrow" style="color:#64c9a5;margin-bottom:8px">TRY THIS LOCALLY</div>
          <p>${escapeHTML(ug.local_activity)}</p>
        </div>
        <div class="curriculum-tag" style="margin-top:14px"><b>Uganda curriculum (UNEB):</b> ${escapeHTML(ug.curriculum)}</div>
      </div>
    </section>` : "";

  const sourcesHTML = story.sources?.length ? `
    <section class="ep-section">
      <div class="section-wrap">
        <div class="source-panel">
          <div class="eyebrow">NASA SOURCES & FURTHER READING</div>
          ${story.sources.map(s => `<a href="${escapeHTML(s.url)}" target="_blank" rel="noopener">${escapeHTML(s.label)} ↗</a>`).join("")}
        </div>
      </div>
    </section>` : "";

  document.getElementById("ep-main").innerHTML = `

    <!-- HERO -->
    <section class="ep-hero">
      <div class="section-wrap ep-hero-inner">
        <div class="ep-hero-content">
          <div class="ep-world-pill">${escapeHTML(item.world)}</div>
          <div class="ep-symbol">${symbolFor(item.id, item.world)}</div>
          <h1 class="ep-title">${escapeHTML(item.name)}</h1>
          <div class="ep-meta">${escapeHTML(item.mission)} · ${escapeHTML(item.years)}</div>
          <div class="ep-status-badge ${item.status === "Active" || item.status === "Still operational" ? "ep-status-active" : ""}">${escapeHTML(item.status)}</div>
          <p class="ep-purpose">${escapeHTML(item.purpose)}</p>
        </div>
      </div>
    </section>

    <!-- VOICE -->
    ${item.voice ? `
    <section class="ep-section ep-voice-section">
      <div class="section-wrap">
        <div class="equipment-voice">
          <div class="eyebrow">THE EQUIPMENT SPEAKS</div>
          <blockquote class="voice-quote" id="ep-voice-text">${escapeHTML(item.voice)}</blockquote>
          <button class="btn-listen" id="ep-listen-btn" data-voice="${escapeHTML(item.voice)}">▶ Listen</button>
        </div>
      </div>
    </section>` : ""}

    <!-- 3D MODEL -->
    ${HAS_MODEL.includes(item.id) ? `
    <section class="ep-section">
      <div class="section-wrap">
        <div class="model-viewer-section">
          <div class="eyebrow">NASA 3D MODEL</div>
          <h3>${escapeHTML(item.name)} — interactive 3D</h3>
          <p class="model-viewer-note">Official NASA GLB model · drag to rotate · scroll to zoom</p>
          <model-viewer
            src="/static/models/${item.id}.glb"
            alt="${escapeHTML(item.name)} 3D model"
            auto-rotate camera-controls
            shadow-intensity="1" exposure="1.2"
            class="equipment-model-viewer ep-model-viewer">
          </model-viewer>
        </div>
      </div>
    </section>` : ""}

    <!-- NASA IMAGES -->
    <section class="ep-section">
      <div class="section-wrap">
        <div class="original-gallery" id="ep-gallery">
          <div class="eyebrow">ORIGINAL NASA PHOTOGRAPHS</div>
          <h3>See the actual hardware</h3>
          <div class="image-skeleton-grid">
            <div class="image-skeleton"></div><div class="image-skeleton"></div>
            <div class="image-skeleton"></div><div class="image-skeleton"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- STORY CHAPTERS -->
    <section class="ep-section ep-section-dark">
      <div class="section-wrap">
        <div class="eyebrow">THE STORY</div>
        <h2 class="ep-section-title">Seven chapters of <span>discovery</span></h2>
        <p class="ep-intro-text">${escapeHTML(story.why_sent)}</p>
        <div class="ep-chapters">
          ${chapters.map(([num, label, q, text]) => `
            <div class="ep-chapter">
              <div class="ep-ch-num">${num}</div>
              <div>
                <div class="chapter-label">${label}</div>
                <div class="story-question">${q}</div>
                <p>${escapeHTML(text)}</p>
              </div>
            </div>`).join("")}
        </div>
        <div class="ep-chapter ep-learned">
          <div class="ep-ch-num">✦</div>
          <div>
            <div class="story-question">What did humanity learn?</div>
            <p>${escapeHTML(story.learned)}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- KNOWLEDGE TODAY -->
    <section class="ep-section">
      <div class="section-wrap">
        <div class="eyebrow">THE KNOWLEDGE TODAY</div>
        <h2 class="ep-section-title">What can we do with what it <span>taught us?</span></h2>
        <p class="ep-body-text">${escapeHTML(story.now)}</p>
        <div class="student-takeaway"><b>What can inspire the next generation?</b> ${escapeHTML(story.inspire)}</div>
      </div>
    </section>

    <!-- SCHOOL LAB -->
    <section class="ep-section ep-section-dark">
      <div class="section-wrap">
        <div class="student-lab school-lab" style="background:none;border:none;padding:0">
          <div class="eyebrow">FOR SCHOOL-AGE EXPLORERS</div>
          <h2 class="ep-section-title">What can students <span>learn?</span></h2>
          <p class="ep-body-text">${escapeHTML(story.school)}</p>
          <div class="student-takeaway"><b>Try this challenge:</b> ${escapeHTML(item.student_activity || "")}</div>
          ${item.student_takeaway ? `<div class="student-takeaway" style="margin-top:10px"><b>Key idea:</b> ${escapeHTML(item.student_takeaway)}</div>` : ""}
        </div>
      </div>
    </section>

    <!-- UGANDA -->
    ${ugandaHTML}

    <!-- TIMELINE -->
    ${timelineHTML ? `<section class="ep-section"><div class="section-wrap">${timelineHTML.replace(/<section[^>]*>|<\/section>/g, "")}</div></section>` : ""}

    <!-- INSTRUMENTS -->
    ${instrumentsHTML}

    <!-- SOURCES -->
    ${sourcesHTML}

    <!-- CTA -->
    <section class="ep-section ep-cta-section">
      <div class="section-wrap ep-cta-inner">
        <div class="ep-cta-text">
          <div class="eyebrow">KEEP EXPLORING</div>
          <h2>Every machine has <span>a story.</span></h2>
          <p>Return to the archive to discover more forgotten explorers.</p>
          <a href="/" class="btn btn-primary">← Back to archive</a>
          <a href="/#quiz" class="btn" style="background:#172438;color:var(--cyan);border:1px solid var(--cyan);margin-left:10px">Take the quiz ↗</a>
        </div>
      </div>
    </section>

    <p class="content-note section-wrap" style="padding-bottom:30px">Educational interpretation based on published NASA mission data. Suggested student projects are learning applications; they are not claims that NASA tested this hardware for those uses on Earth.</p>
  `;

  // Wire up listen button
  const listenBtn = document.getElementById("ep-listen-btn");
  if (listenBtn) {
    listenBtn.addEventListener("click", () => {
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
        listenBtn.textContent = "▶ Listen";
        return;
      }
      const utter = new SpeechSynthesisUtterance(listenBtn.dataset.voice);
      utter.rate = 0.92; utter.pitch = 0.85;
      const voices = speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang === "en-GB" && v.localService) ||
                        voices.find(v => v.lang.startsWith("en") && v.localService) ||
                        voices.find(v => v.lang.startsWith("en"));
      if (preferred) utter.voice = preferred;
      utter.onstart = () => { listenBtn.textContent = "⏹ Stop"; };
      utter.onend = utter.onerror = () => { listenBtn.textContent = "▶ Listen"; };
      speechSynthesis.speak(utter);
    });
  }

  // Wire up translate button
  const transBtn = document.getElementById("ep-translate-btn");
  if (transBtn) {
    transBtn.addEventListener("click", async () => {
      const resultEl = document.getElementById("ep-translate-result");
      transBtn.textContent = "↔ Translating…";
      transBtn.disabled = true;
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: transBtn.dataset.text }),
        });
        const data = await res.json();
        resultEl.textContent = data.translation;
        resultEl.classList.remove("hidden");
        transBtn.textContent = "↔ Show English";
        transBtn.disabled = false;
        transBtn.onclick = () => {
          resultEl.classList.toggle("hidden");
          transBtn.textContent = resultEl.classList.contains("hidden") ? "↔ Show Swahili" : "↔ Show English";
        };
      } catch {
        resultEl.textContent = "Translation unavailable.";
        resultEl.classList.remove("hidden");
        transBtn.textContent = "↔ Translate to Swahili";
        transBtn.disabled = false;
      }
    });
  }

  // Load NASA images
  loadImages(item.id);
}

async function loadImages(id) {
  const gallery = document.getElementById("ep-gallery");
  if (!gallery) return;
  try {
    const res = await fetch(`/api/equipment/${encodeURIComponent(id)}/images?limit=12`);
    const result = await res.json();
    if (!result.images.length) {
      gallery.innerHTML = `<div class="eyebrow">ORIGINAL NASA PHOTOGRAPHS</div><h3>Image archive</h3><p>No original image files returned for this search.</p><a href="https://images.nasa.gov/" target="_blank" rel="noopener">Search NASA Images ↗</a>`;
      return;
    }
    gallery.innerHTML = `
      <div class="eyebrow">ORIGINAL NASA PHOTOGRAPHS</div>
      <h3>See the actual hardware</h3>
      <p style="font-size:12px;color:var(--muted)">Retrieved from NASA's image archive. Select an image to view the original file.</p>
      <div class="original-image-grid">
        ${result.images.map(img => `
          <article class="original-image-card">
            <a href="${escapeHTML(img.image_url)}" target="_blank" rel="noopener">
              <img src="${escapeHTML(img.image_url)}" alt="${escapeHTML(img.title)}" loading="lazy">
            </a>
            <div class="original-image-meta">
              <b>${escapeHTML(img.title)}</b>
              <span>${escapeHTML(img.date_created || "Date not listed")} · ${escapeHTML(img.credit || "NASA")}</span>
              <a href="${escapeHTML(img.nasa_record_url)}" target="_blank" rel="noopener">NASA image record ↗</a>
            </div>
          </article>`).join("")}
      </div>
      <p class="image-credit-note">NASA Image and Video Library. Images remain hosted by NASA.</p>`;
  } catch {
    gallery.innerHTML = `<div class="eyebrow">ORIGINAL NASA PHOTOGRAPHS</div><h3>Image archive temporarily unavailable</h3><a href="https://images.nasa.gov/" target="_blank" rel="noopener">Open NASA Image and Video Library ↗</a>`;
  }
}

async function loadSidebar() {
  try {
    const all = await fetch("/api/equipment").then(r => r.json());
    const worlds = { Moon: [], Mars: [], Saturn: [], "Interstellar Space": [] };
    all.forEach(item => { (worlds[item.world] || (worlds["Other"] = worlds["Other"] || [])).push(item); });
    const worldOrder = ["Moon", "Mars", "Saturn", "Interstellar Space"];
    const list = document.getElementById("ep-sidebar-list");
    list.innerHTML = worldOrder.filter(w => worlds[w]?.length).map(w => `
      <div class="ep-sb-group">
        <div class="ep-sb-world">${w}</div>
        ${worlds[w].map(item => `
          <a href="/equipment/${encodeURIComponent(item.id)}"
             class="ep-sb-item ${item.id === equipmentId ? "ep-sb-active" : ""}">
            <span class="ep-sb-dot ${item.status === "Active" || item.status === "Still operational" ? "ep-sb-dot-active" : ""}"></span>
            <span>${escapeHTML(item.name)}</span>
          </a>`).join("")}
      </div>`).join("");
  } catch { /* sidebar is non-critical */ }
}

function initSidebarToggle() {
  const toggle = document.getElementById("ep-sidebar-toggle");
  const sidebar = document.getElementById("ep-sidebar");
  const overlay = document.getElementById("ep-sidebar-overlay");
  const close = document.getElementById("ep-sidebar-close");
  const open = () => { sidebar.classList.add("ep-sidebar-open"); overlay.classList.add("ep-sidebar-open"); };
  const shut = () => { sidebar.classList.remove("ep-sidebar-open"); overlay.classList.remove("ep-sidebar-open"); };
  toggle?.addEventListener("click", open);
  close?.addEventListener("click", shut);
  overlay?.addEventListener("click", shut);
}

loadSidebar();
initSidebarToggle();
loadEquipmentPage();
