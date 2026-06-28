/* SF Pride 2026 — Road Closures interactive map + timeline */
(function () {
  "use strict";

  /* ---------- Analytics ----------
   * Umami (cookieless; script in index.html) auto-tracks pageviews and accepts
   * custom events via umami.track(). This wrapper routes our interaction events
   * there (and to Plausible if ever added). It must never throw and break the
   * UI, so every call is guarded. */
  function track(name, props) {
    try {
      if (window.umami && typeof window.umami.track === "function") window.umami.track(name, props);
      if (typeof window.plausible === "function") window.plausible(name, { props: props });
    } catch (e) { /* analytics is best-effort */ }
  }

  /* ---------- Time helpers ---------- */
  function nowHours() { return (Date.now() - ORIGIN_UTC) / 3600000; }
  function fmtHour(h) {
    const d = new Date(ORIGIN_UTC + h * 3600000);
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ, weekday: "short", hour: "numeric", minute: "2-digit",
    }).formatToParts(d);
    const get = t => (parts.find(p => p.type === t) || {}).value || "";
    return `${get("weekday")} ${get("hour")}:${get("minute")} ${get("dayPeriod")}`;
  }
  function statusOf(c, h) {
    if (h < c.startHour) return "upcoming";
    if (h >= c.reopenHour) return "reopened";
    return "active";
  }
  function phaseLabel(h) {
    if (h < CLOSURES.reduce((m, c) => Math.min(m, c.startHour), Infinity)) return "Before any closures";
    if (h >= 102) return "All streets reopened";
    if (h >= 81.5 && h < 90) return "🏳️‍🌈 Parade route closed";
    if (h >= 72) return "Parade-day closures in effect";
    return "Civic Center festival closures";
  }

  /* ---------- Map ---------- */
  const map = L.map("map", { zoomControl: true, scrollWheelZoom: true })
    .setView([37.784, -122.41], 14);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  }).addTo(map);

  const allBounds = L.latLngBounds([]);

  function popupHtml(c) {
    return `
      <div class="popup__street">${c.street}</div>
      <div class="popup__seg">${c.fromTo}</div>
      <div class="popup__row">Closes: <b>${c.startLabel}</b></div>
      <div class="popup__row">Reopens: <b>${c.reopenLabel}</b></div>
      ${c.note ? `<div class="popup__row" style="margin-top:6px;color:var(--ink-500)">${c.note}</div>` : ""}`;
  }

  const layers = CLOSURES.map(c => {
    c.path.forEach(p => allBounds.extend(p));
    const casing = L.polyline(c.path, {
      color: "#16131f", weight: c.rainbow ? 14 : 11, opacity: 0.18, lineCap: "round", lineJoin: "round",
    }).addTo(map);

    let lines;
    if (c.rainbow) {
      // one colored sub-line per path segment, cycling the flag palette
      lines = [];
      for (let i = 0; i < c.path.length - 1; i++) {
        lines.push(L.polyline([c.path[i], c.path[i + 1]], {
          color: RAINBOW[i % RAINBOW.length], weight: 9, opacity: 0.95, lineCap: "round",
        }).addTo(map));
      }
    } else {
      lines = [L.polyline(c.path, {
        color: c.color, weight: 7, opacity: 0.95, lineCap: "round", lineJoin: "round",
      }).addTo(map)];
    }
    const html = popupHtml(c);
    casing.bindPopup(html);
    lines.forEach(l => l.bindPopup(html));
    return { c, casing, lines };
  });
  map.fitBounds(allBounds, { padding: [40, 40] });

  /* ---------- DOM refs ---------- */
  const slider = document.getElementById("timeline-slider");
  const clockTime = document.getElementById("clock-time");
  const clockPhase = document.getElementById("clock-phase");
  const liveStatus = document.getElementById("live-status");
  const listEl = document.getElementById("closure-list");
  const countPill = document.getElementById("active-count");
  const chips = Array.from(document.querySelectorAll(".chip"));
  const playBtn = document.getElementById("play-btn");

  /* ---------- Closure list (grouped by category) ---------- */
  const rows = [];
  Object.keys(CATS).forEach(catKey => {
    const inCat = layers.filter(l => l.c.cat === catKey);
    if (!inCat.length) return;
    const head = document.createElement("li");
    head.className = "group";
    head.innerHTML = `<span>${CATS[catKey].label}</span><span class="group__sub">${CATS[catKey].sub}</span>`;
    listEl.appendChild(head);

    inCat.forEach(({ c }) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.className = "closure";
      const swatch = c.rainbow
        ? `<span class="closure__rail closure__rail--rainbow"></span>`
        : `<span class="closure__rail" style="background:${c.color}"></span>`;
      btn.innerHTML = `
        ${swatch}
        <span class="closure__main">
          <span class="closure__street">${c.street}</span>
          <span class="closure__seg">${c.fromTo}</span>
          <span class="closure__time">Closes ${c.startLabel}</span>
        </span>
        <span class="closure__badge"></span>`;
      btn.addEventListener("click", () => {
        map.fitBounds(L.latLngBounds(c.path).pad(0.4));
        const lyr = layers.find(l => l.c === c);
        lyr.lines[0].openPopup();
        track("closure_open", { id: c.id, street: c.street });
      });
      li.appendChild(btn);
      listEl.appendChild(li);
      rows.push({ c, btn, badge: btn.querySelector(".closure__badge") });
    });
  });

  /* ---------- Render ---------- */
  const STYLE = {
    active:   { mul: 1,    opacity: 0.95, dashArray: null, casing: 0.18 },
    upcoming: { mul: 0.6,  opacity: 0.4,  dashArray: "2 9", casing: 0.05 },
    reopened: { mul: 0.45, opacity: 0.16, dashArray: null, casing: 0.0 },
  };
  const BADGE = { active: "Closed", upcoming: "Upcoming", reopened: "Reopened" };

  function render(h) {
    layers.forEach(({ c, lines, casing }) => {
      const st = statusOf(c, h);
      const s = STYLE[st];
      const base = c.rainbow ? 9 : 7;
      lines.forEach(l => l.setStyle({ weight: base * s.mul, opacity: s.opacity, dashArray: s.dashArray }));
      casing.setStyle({ opacity: s.casing });
    });

    let active = 0;
    rows.forEach(({ c, btn, badge }) => {
      const st = statusOf(c, h);
      if (st === "active") active++;
      badge.textContent = BADGE[st];
      badge.className = "closure__badge badge--" + st;
      btn.classList.toggle("is-dim", st === "reopened");
    });

    clockTime.textContent = fmtHour(h);
    clockPhase.textContent = phaseLabel(h);
    countPill.textContent = active + " closed";
    liveStatus.innerHTML = `<span>At this time</span><b>${active} closure${active === 1 ? "" : "s"} active</b>`;

    chips.forEach(ch => {
      const ch_h = ch.dataset.hour !== undefined ? parseFloat(ch.dataset.hour) : null;
      ch.setAttribute("aria-pressed", ch_h !== null && Math.abs(ch_h - h) < 0.01 ? "true" : "false");
    });
  }

  function setHour(h, fromNow) {
    h = Math.max(TIMELINE_MIN, Math.min(TIMELINE_MAX, h));
    slider.value = h;
    render(h);
    if (fromNow) {
      chips.forEach(c => c.setAttribute("aria-pressed", "false"));
      document.querySelector(".chip--now").setAttribute("aria-pressed", "true");
    }
  }

  /* ---------- Interactions ---------- */
  slider.addEventListener("input", () => {
    stopPlay(); render(parseFloat(slider.value));
    chips.forEach(c => c.setAttribute("aria-pressed", "false"));
  });
  slider.addEventListener("change", () => track("timeline_scrub", { hour: Math.round(parseFloat(slider.value)) }));
  chips.forEach(ch => ch.addEventListener("click", () => {
    stopPlay();
    if (ch.dataset.now) setHour(Math.max(TIMELINE_MIN, Math.min(TIMELINE_MAX, nowHours())), true);
    else setHour(parseFloat(ch.dataset.hour));
    track("cutoff", { label: ch.textContent.trim() });
  }));

  /* ---------- Play ---------- */
  let playTimer = null;
  function stopPlay() {
    if (playTimer) { clearInterval(playTimer); playTimer = null; playBtn.classList.remove("is-playing"); playBtn.textContent = "▶ Play the weekend"; }
  }
  playBtn.addEventListener("click", () => {
    if (playTimer) { stopPlay(); return; }
    track("play");
    playBtn.classList.add("is-playing"); playBtn.textContent = "❚❚ Pause";
    let h = parseFloat(slider.value);
    if (h >= TIMELINE_MAX) h = TIMELINE_MIN;
    playTimer = setInterval(() => {
      h += 1;
      if (h >= TIMELINE_MAX) { setHour(TIMELINE_MAX); stopPlay(); return; }
      setHour(h);
    }, 55);
  });

  /* ---------- Init ---------- */
  const param = parseFloat(new URLSearchParams(location.search).get("t"));
  const liveNow = nowHours();
  if (!Number.isNaN(param)) setHour(param);                                  // deep-link to a time
  else if (liveNow >= TIMELINE_MIN && liveNow <= TIMELINE_MAX) setHour(liveNow, true);
  else setHour(82.5); // default: parade Sunday
  setTimeout(() => map.invalidateSize(), 200);
})();
