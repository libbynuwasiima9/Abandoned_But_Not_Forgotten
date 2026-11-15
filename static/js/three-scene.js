// Three.js visual enhancements — starfield, hero planet, modal planet
(function () {
  if (typeof THREE === "undefined") return;

  // ── Helpers ──────────────────────────────────────────────────────────────
  function marsTexture(w, h) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0,   "#c1440e");
    g.addColorStop(0.3, "#a0522d");
    g.addColorStop(0.6, "#cd853f");
    g.addColorStop(1,   "#8b2500");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = Math.random() * 20 + 3;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = Math.random() > 0.5
        ? `rgba(60,20,5,${Math.random() * 0.22})`
        : `rgba(220,140,80,${Math.random() * 0.2})`;
      ctx.fill();
    }
    return new THREE.CanvasTexture(c);
  }

  function moonTexture(w, h) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#8a9bb0";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = Math.random() * 14 + 2;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(50,60,80,${Math.random() * 0.3})`;
      ctx.fill();
    }
    return new THREE.CanvasTexture(c);
  }

  // ── Starfield ─────────────────────────────────────────────────────────────
  function initStarfield() {
    const existing = document.querySelector(".starfield");
    if (existing) existing.style.display = "none";

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:-1";
    document.body.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 1;

    const count = 1800;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 1600;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.3, sizeAttenuation: false })));

    function animate() {
      requestAnimationFrame(animate);
      scene.rotation.y += 0.00007;
      scene.rotation.x += 0.00003;
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener("resize", () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    });
  }

  // ── Hero Mars planet ──────────────────────────────────────────────────────
  function initHeroPlanet() {
    const visual = document.querySelector(".hero-visual");
    if (!visual) return;

    // Hide CSS decorations — Three.js takes over
    visual.querySelectorAll(".planet, .orbit-one, .orbit-two, .rover-art").forEach(el => {
      el.style.opacity = "0";
      el.style.pointerEvents = "none";
    });

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none";
    visual.style.position = "relative";
    visual.insertBefore(canvas, visual.firstChild);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 3.5;

    // Mars sphere
    const mars = new THREE.Mesh(
      new THREE.SphereGeometry(1.1, 64, 64),
      new THREE.MeshPhongMaterial({ map: marsTexture(512, 256), shininess: 8, specular: new THREE.Color(0x331100) })
    );
    scene.add(mars);

    // Atmosphere glow
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.16, 32, 32),
      new THREE.MeshPhongMaterial({ color: 0xe8743a, transparent: true, opacity: 0.07, side: THREE.BackSide })
    ));

    // Orbit rings
    function addRing(rx, ry, rotX, color) {
      const pts = [];
      for (let i = 0; i <= 128; i++) {
        const a = (i / 128) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * rx, Math.sin(a) * ry, 0));
      }
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.28 })
      );
      line.rotation.x = rotX;
      scene.add(line);
    }
    addRing(1.9, 0.75, -0.5, 0x75d5d1);
    addRing(2.15, 1.05, 0.6, 0xff815b);

    // Lights
    const sun = new THREE.DirectionalLight(0xffddaa, 1.4);
    sun.position.set(-3, 2, 3);
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0x221108, 1.2));

    function resize() {
      const w = visual.offsetWidth, h = visual.offsetHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();

    let running = true;
    function animate() {
      if (!running) return;
      requestAnimationFrame(animate);
      mars.rotation.y += 0.003;
      renderer.render(scene, camera);
    }
    animate();

    // Pause when hero is off-screen to save GPU
    new IntersectionObserver(entries => {
      running = entries[0].isIntersecting;
      if (running) animate();
    }).observe(visual);

    window.addEventListener("resize", resize);
  }

  // ── Modal planet ──────────────────────────────────────────────────────────
  let _modalRenderer = null, _modalFrame = null;

  function initModalPlanet(world) {
    const wrap = document.getElementById("modal-planet-canvas");
    if (!wrap) return;

    if (_modalRenderer) {
      cancelAnimationFrame(_modalFrame);
      _modalRenderer.dispose();
      _modalRenderer = null;
    }
    wrap.innerHTML = "";

    const canvas = document.createElement("canvas");
    wrap.appendChild(canvas);

    const isMoon = world === "Moon";
    const W = wrap.offsetWidth || 340, H = 180;

    _modalRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    _modalRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    _modalRenderer.setSize(W, H);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.z = 2.8;

    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 48, 48),
      new THREE.MeshPhongMaterial({
        map: isMoon ? moonTexture(256, 128) : marsTexture(256, 128),
        shininess: isMoon ? 20 : 6,
      })
    );
    scene.add(planet);

    const light = new THREE.DirectionalLight(0xffffff, isMoon ? 1.1 : 1.3);
    light.position.set(-2, 1, 2);
    scene.add(light);
    scene.add(new THREE.AmbientLight(isMoon ? 0x334455 : 0x221108, 1.1));

    // Mouse drag to spin
    let dragging = false, lastX = 0, velX = 0;
    canvas.style.cursor = "grab";
    canvas.addEventListener("mousedown", e => { dragging = true; lastX = e.clientX; velX = 0; canvas.style.cursor = "grabbing"; });
    window.addEventListener("mouseup",   () => { dragging = false; canvas.style.cursor = "grab"; });
    canvas.addEventListener("mousemove", e => {
      if (!dragging) return;
      velX = (e.clientX - lastX) * 0.012;
      lastX = e.clientX;
    });

    // Touch support
    canvas.addEventListener("touchstart", e => { dragging = true; lastX = e.touches[0].clientX; velX = 0; });
    canvas.addEventListener("touchend",   () => { dragging = false; });
    canvas.addEventListener("touchmove",  e => {
      if (!dragging) return;
      velX = (e.touches[0].clientX - lastX) * 0.012;
      lastX = e.touches[0].clientX;
    });

    function animate() {
      _modalFrame = requestAnimationFrame(animate);
      if (dragging) {
        planet.rotation.y += velX;
      } else {
        planet.rotation.y += 0.004;
        velX *= 0.92;
      }
      _modalRenderer.render(scene, camera);
    }
    animate();
  }

  function disposeModalPlanet() {
    if (_modalRenderer) {
      cancelAnimationFrame(_modalFrame);
      _modalRenderer.dispose();
      _modalRenderer = null;
    }
  }

  window.SpaceScene = { initStarfield, initHeroPlanet, initModalPlanet, disposeModalPlanet };
})();
