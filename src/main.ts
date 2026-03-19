// ─── Types ───────────────────────────────────────────────────────────────────

interface HistoryEntry {
  angle: number;
  height: number;
  dist: number;
  eyeh: number;
  time: string;
}

interface Settings {
  dist?: string;
  eyeh?: string;
}

// ─── State ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "clinometer_history";
const SETTINGS_KEY = "clinometer_settings";

let locked = false;
let currentAngle: number | null = null;
let lockedAngle: number | null = null;
let history: HistoryEntry[] = JSON.parse(
  localStorage.getItem(STORAGE_KEY) || "[]",
);

// ─── DOM Helpers ─────────────────────────────────────────────────────────────

const el = (id: string) => document.getElementById(id);
const setText = (id: string, val: string) => {
  const e = el(id);
  if (e) e.textContent = val;
};
const showEl = (id: string, show: boolean) => {
  const e = el(id) as HTMLElement;
  if (e) e.style.display = show ? "block" : "none";
};
const getInputVal = (id: string) =>
  parseFloat((el(id) as HTMLInputElement).value);
const setInputVal = (id: string, val: string) => {
  const e = el(id) as HTMLInputElement;
  if (e) e.value = val;
};

// ─── Storage ─────────────────────────────────────────────────────────────────

function saveHistory(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function clearHistory(): void {
  history = [];
  localStorage.removeItem(STORAGE_KEY);
  renderHistory();
}

function saveSettings(): void {
  const settings: Settings = {
    dist: (el("dist") as HTMLInputElement).value,
    eyeh: (el("eyeh") as HTMLInputElement).value,
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function restoreSettings(): void {
  const saved: Settings = JSON.parse(
    localStorage.getItem(SETTINGS_KEY) || "{}",
  );
  if (saved.dist) setInputVal("dist", saved.dist);
  if (saved.eyeh) setInputVal("eyeh", saved.eyeh);
}

// ─── Sensor ──────────────────────────────────────────────────────────────────

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function handleOrientation(e: DeviceOrientationEvent): void {
  if (locked || e.beta === null) return;
  let angle = e.beta;
  if (angle > 90) angle = 180 - angle;
  if (angle < -90) angle = -180 - angle;
  currentAngle = angle;
  setText("angle-val", angle.toFixed(1));
  const dot = el("dot");
  if (dot) dot.className = "status-dot live";
  setText("status-text", "live");
}

function startListening(): void {
  showEl("perm-section", false);
  showEl("main-section", true);
  window.addEventListener("deviceorientation", handleOrientation);
}

function requestPermission(): void {
  const DOE = DeviceOrientationEvent as any;
  if (typeof DOE.requestPermission === "function") {
    DOE.requestPermission().then((state: string) => {
      state === "granted"
        ? startListening()
        : alert(
            "Permission denied. Enable Motion & Orientation Access in Settings > Safari.",
          );
    });
  } else {
    startListening();
  }
}

// ─── Render ──────────────────────────────────────────────────────────────────

function renderHistory(): void {
  const container = el("history-list");
  if (!container) return;
  showEl("history-card", history.length > 0);
  container.innerHTML = history
    .map(
      (e, i) => `
      <div class="history-row">
        <span class="history-num">#${history.length - i}</span>
        <span class="history-main">${e.height.toFixed(2)} m</span>
        <span class="history-meta">${e.angle.toFixed(1)}° · ${e.dist}m · ${e.time}</span>
      </div>
    `,
    )
    .join('<div class="divider"></div>');
}

function renderResult(): void {
  if (lockedAngle === null) return;
  const d = getInputVal("dist") || 15;
  const eyeh = getInputVal("eyeh") || 1.65;
  const rad = (lockedAngle * Math.PI) / 180;
  const h = d * Math.tan(rad) + eyeh;

  setText("height-val", h.toFixed(2));
  setText("r-angle", lockedAngle.toFixed(1) + "°");
  setText("r-dist", d.toFixed(1) + " m");
  setText("r-eyeh", eyeh.toFixed(2) + " m");
  setText(
    "r-equation",
    `${d.toFixed(1)} × tan(${lockedAngle.toFixed(1)}°) + ${eyeh.toFixed(2)} = ${h.toFixed(2)} m`,
  );
  showEl("result-card", true);

  if (locked) {
    history.unshift({
      angle: lockedAngle,
      height: h,
      dist: d,
      eyeh,
      time: new Date().toLocaleTimeString(),
    });
    saveHistory();
    renderHistory();
  }
}

// ─── Actions ─────────────────────────────────────────────────────────────────

function lockAngle(): void {
  if (currentAngle === null) return;
  locked = true;
  lockedAngle = currentAngle;
  const dot = el("dot");
  if (dot) dot.className = "status-dot locked";
  setText("status-text", `locked at ${lockedAngle.toFixed(1)}°`);
  const btn = el("lock-btn") as HTMLButtonElement;
  btn.textContent = "Locked";
  btn.disabled = true;
  renderResult();
}

function resetLock(): void {
  locked = false;
  lockedAngle = null;
  const btn = el("lock-btn") as HTMLButtonElement;
  btn.textContent = "Lock angle";
  btn.disabled = false;
  showEl("result-card", false);
  const dot = el("dot");
  if (dot) dot.className = "status-dot waiting";
  setText("status-text", "live");
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init(): void {
  if (typeof DeviceOrientationEvent === "undefined") {
    showEl("no-sensor", true);
    return;
  }

  el("lock-btn")?.addEventListener("click", lockAngle);
  el("reset-btn")?.addEventListener("click", resetLock);
  el("perm-btn")?.addEventListener("click", requestPermission);
  el("clear-btn")?.addEventListener("click", clearHistory);
  el("dist")?.addEventListener("input", renderResult);
  el("eyeh")?.addEventListener("input", renderResult);
  el("dist")?.addEventListener("change", saveSettings);
  el("eyeh")?.addEventListener("change", saveSettings);

  restoreSettings();
  renderHistory();

  isIOS() &&
  typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ? showEl("perm-section", true)
    : startListening();
}

// ─── HTML Template ───────────────────────────────────────────────────────────

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="wrap">
    <div class="app-header">
      <h1>Clinometer</h1>
      <p>SYDE 362 — Design 3</p>
    </div>

    <div id="perm-section" class="card" style="display:none; margin-bottom:1rem">
      <p class="muted" style="padding-bottom:1rem">Tap below to allow gyroscope access. Safari will prompt you.</p>
      <button class="btn primary full" id="perm-btn">Enable gyroscope</button>
    </div>

    <div id="no-sensor" class="card" style="display:none">
      <p class="muted">Device orientation not supported. Use Safari on iOS.</p>
    </div>

    <div id="main-section" style="display:none">
      <div class="card">
        <div class="row2">
          <div>
            <label>Distance from object (m)</label>
            <input type="number" id="dist" value="15" min="1" step="0.5" />
          </div>
          <div>
            <label>Eye height (m)</label>
            <input type="number" id="eyeh" value="1.65" min="0.5" step="0.05" />
          </div>
        </div>
      </div>

      <div class="card">
        <div class="angle-display">
          <div class="angle-big" id="angle-val">--</div>
          <div class="angle-unit">degrees</div>
        </div>
        <div class="status-row">
          <span class="status-dot waiting" id="dot"></span>
          <span id="status-text">waiting for sensor</span>
        </div>
        <button class="btn primary full" id="lock-btn">Lock angle</button>
      </div>

      <div class="card" id="result-card" style="display:none">
        <div class="result-main">
          <div class="muted small">estimated object height</div>
          <div class="result-big" id="height-val">--</div>
          <div class="muted small">metres</div>
        </div>
        <div class="equation-box" id="r-equation">--</div>
        <div class="divider"></div>
        <div class="result-row"><span class="muted">Locked angle</span><span id="r-angle" class="val">--</span></div>
        <div class="result-row"><span class="muted">Distance from object</span><span id="r-dist" class="val">--</span></div>
        <div class="result-row"><span class="muted">Eye height</span><span id="r-eyeh" class="val">--</span></div>
        <div class="divider"></div>
        <button class="btn danger full" id="reset-btn">Reset</button>
      </div>

      <ul class="hint-list">
        <li>Measure and enter the two inputs above with the tape measure</li>
        <li>Look through the sighting tube, aim to see the top of the object</li>
        <li>Tap Lock when aligned</li>
      </ul>

      <div class="card" id="history-card" style="display:none">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span style="font-weight:500; font-size:15px;">History</span>
          <button class="small-btn" id="clear-btn">Clear</button>
        </div>
        <div id="history-list"></div>
      </div>
    </div>
  </div>
`;

init();
