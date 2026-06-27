/* SF Pride 2026 — Road Closures interactive map + timeline */
(function () {
  "use strict";

  /* ---------- Time helpers ---------- */
  // Current "hours since origin" using real Pacific time.
  function nowHours() {
    return (Date.now() - ORIGIN_UTC) / 3600000;
  }
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  // Format an hours-since-origin value into a friendly Pacific label.
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

  /* ---------- Map ---------- */
  const map = L.map("map", { zoomControl: true, scrollWheelZoom: true })
    .setView([37.7798, -122.4172], 15);

  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20,
    }
  ).addTo(map);

  // Each closure -> {casing, line} polylines, plus bounds for "fit".
  const allBounds = L.latLngBounds([]);
  const layers = CLOSURES.map(c => {
    c.path.forEach(p => allBounds.extend(p));
    const casing = L.polyline(c.path, {
      color: "#16131f", weight: 11, opacity: 0.18, lineCap: "round", lineJoin: "round",
    }).addTo(map);
    const line = L.polyline(c.path, {
      color: c.color, weight: 7, opacity: 0.95, lineCap: "round", lineJoin: "round",
    }).addTo(map);

    const popup = `
      <div class="popup__street">${c.street}</div>
      <div class="popup__seg">${c.fromTo}</div>
      <div class="popup__row">Closes: <b>${c.startLabel}</b></div>
      <div class="popup__row">Reopens: <b>${c.reopenLabel}</b></div>
      ${c.note ? `<div class="popup__row" style="margin-top:6px;color:var(--ink-500)">${c.note}</div>` : ""}`;
    line.bindPopup(popup);
    casing.bindPopup(popup);
    return { c, casing, line };
  });
  map.fitBounds(allBounds, { padding: [50, 50] });

  /* ---------- DOM refs ---------- */
  const slider = document.getElementById("timeline-slider");
  const clockTime = document.getElementById("clock-time");
  const clockPhase = document.getElementById("clock-phase");
  const liveStatus = document.getElementById("live-status");
  const listEl = document.getElementById("closure-list");
  const countPill = document.getElementById("active-count");
  const chips = Array.from(document.querySelectorAll(".chip"));
  const playBtn = document.getElementById("play-btn");

  /* ---------- Closure list (built once) ---------- */
  const rows = layers.map(({ c }) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "closure";
    btn.innerHTML = `
      <span class="closure__rail" style="background:${c.color}"></span>
      <span class="closure__main">
        <span class="closure__street">${c.street}</span>
        <span class="closure__seg">${c.fromTo}</span>
        <span class="closure__time">Closes ${c.startLabel.replace("Fri, Jun 26 · ", "Fri ").replace("Fri, Jun 26 (time not specified)", "Fri (time TBD)")}</span>
      </span>
      <span class="closure__badge"></span>`;
    btn.addEventListener("click", () => {
      map.fitBounds(L.latLngBounds(c.path).pad(0.6));
      const lyr = layers.find(l => l.c === c);
      lyr.line.openPopup();
    });
    li.appendChild(btn);
    listEl.appendChild(li);
    return { c, btn, badge: btn.querySelector(".closure__badge") };
  });

  /* ---------- Render for a given hour ---------- */
  const STYLE = {
    active:   { weight: 7, opacity: 0.95, dashArray: null, casing: 0.18 },
    upcoming: { weight: 4, opacity: 0.4,  dashArray: "2 9", casing: 0.05 },
    reopened: { weight: 3, opacity: 0.18, dashArray: null, casing: 0.0 },
  };
  const BADGE = { active: "Closed", upcoming: "Upcoming", reopened: "Reopened" };

  function phaseLabel(h) {
    if (h < 0.017) return "Before any closures";
    if (h >= 78) return "All streets reopened";
    if (h >= 58.5 && h < 62) return "🏳️‍🌈 Parade in progress";
    return "Closures in effect";
  }

  function render(h) {
    layers.forEach(({ c, line, casing }) => {
      const st = statusOf(c, h);
      const s = STYLE[st];
      line.setStyle({ weight: s.weight, opacity: s.opacity, dashArray: s.dashArray });
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
    liveStatus.innerHTML = `<span>At this time</span><b>${active} street${active === 1 ? "" : "s"} closed</b>`;

    // sync chip pressed-state
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
      const nowChip = document.querySelector(".chip--now");
      chips.forEach(c => c.setAttribute("aria-pressed", "false"));
      nowChip.setAttribute("aria-pressed", "true");
    }
  }

  /* ---------- Interactions ---------- */
  slider.addEventListener("input", () => { stopPlay(); render(parseFloat(slider.value)); chips.forEach(c => c.setAttribute("aria-pressed", "false")); });

  chips.forEach(ch => {
    ch.addEventListener("click", () => {
      stopPlay();
      if (ch.dataset.now) {
        const h = Math.max(TIMELINE_MIN, Math.min(TIMELINE_MAX, nowHours()));
        setHour(h, true);
      } else {
        setHour(parseFloat(ch.dataset.hour));
      }
    });
  });

  /* ---------- Play (animate through the weekend) ---------- */
  let playTimer = null;
  function stopPlay() {
    if (playTimer) { clearInterval(playTimer); playTimer = null; playBtn.classList.remove("is-playing"); playBtn.textContent = "▶ Play day-by-day"; }
  }
  playBtn.addEventListener("click", () => {
    if (playTimer) { stopPlay(); return; }
    playBtn.classList.add("is-playing");
    playBtn.textContent = "❚❚ Pause";
    let h = parseFloat(slider.value);
    if (h >= TIMELINE_MAX) h = TIMELINE_MIN;
    playTimer = setInterval(() => {
      h += 0.75;
      if (h >= TIMELINE_MAX) { setHour(TIMELINE_MAX); stopPlay(); return; }
      setHour(h);
    }, 60);
  });

  /* ---------- Init: start at real "Now" if within the weekend, else Fri 8 PM ---------- */
  const liveNow = nowHours();
  if (liveNow >= TIMELINE_MIN && liveNow <= TIMELINE_MAX) {
    setHour(liveNow, true);
  } else {
    setHour(20); // Fri 8 PM — peak closure
  }

  setTimeout(() => map.invalidateSize(), 200);
})();
