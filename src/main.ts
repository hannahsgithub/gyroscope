let locked = false;
let currentAngle: number | null = null;
let lockedAngle: number | null = null;

interface HistoryEntry {
  angle: number;
  height: number;
  dist: number;
  eyeh: number;
  time: string;
}

const history: HistoryEntry[] = [];

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function getInputVal(id: string): number {
  return parseFloat((document.getElementById(id) as HTMLInputElement).value);
}

function setText(id: string, val: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function showEl(id: string, show: boolean): void {
  const el = document.getElementById(id) as HTMLElement;
  if (el) el.style.display = show ? "block" : "none";
}

function handleOrientation(e: DeviceOrientationEvent): void {
  if (locked) return;
  let angle = e.beta;
  if (angle === null) return;
  if (angle > 90) angle = 180 - angle;
  if (angle < -90) angle = -180 - angle;
  currentAngle = angle;
  setText("angle-val", angle.toFixed(1));
  const dot = document.getElementById("dot");
  if (dot) dot.className = "status-dot live";
  setText("status-text", "live");
}

function renderHistory(): void {
  const container = document.getElementById("history-list");
  if (!container) return;
  showEl("history-card", history.length > 0);
  container.innerHTML = history
    .map(
      (e, i) => `
    <div class="history-row">
      <span class="history-num">#${history.length - i}</span>
      <span class="history-main">${e.height.toFixed(2)} m</span>
      <span class="muted small">${e.angle.toFixed(1)}° · ${e.dist}m distance from object · ${e.time}</span>
    </div>
  `,
    )
    .join('<div class="divider"></div>');
}

function showResult(): void {
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
    const entry: HistoryEntry = {
      angle: lockedAngle,
      height: h,
      dist: d,
      eyeh: eyeh,
      time: new Date().toLocaleTimeString(),
    };
    history.unshift(entry);
    renderHistory();
  }
}

function toggleLock(): void {
  if (currentAngle === null) return;
  locked = true;
  lockedAngle = currentAngle;
  const dot = document.getElementById("dot");
  if (dot) dot.className = "status-dot locked";
  setText("status-text", `locked at ${lockedAngle.toFixed(1)}°`);
  const btn = document.getElementById("lock-btn") as HTMLButtonElement;
  btn.textContent = "Locked";
  btn.disabled = true;
  showResult();
}

function resetLock(): void {
  locked = false;
  lockedAngle = null;
  const btn = document.getElementById("lock-btn") as HTMLButtonElement;
  btn.textContent = "Lock angle";
  btn.disabled = false;
  showEl("result-card", false);
  const dot = document.getElementById("dot");
  if (dot) dot.className = "status-dot waiting";
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
      if (state === "granted") {
        startListening();
      } else {
        alert(
          "Permission denied. Enable Motion & Orientation Access in Settings > Safari.",
        );
      }
    });
  } else {
    startListening();
  }
}

function init(): void {
  if (typeof DeviceOrientationEvent === "undefined") {
    showEl("no-sensor", true);
    return;
  }
  if (
    isIOS() &&
    typeof (DeviceOrientationEvent as any).requestPermission === "function"
  ) {
    showEl("perm-section", true);
  } else {
    startListening();
  }

  document.getElementById("lock-btn")?.addEventListener("click", toggleLock);
  document.getElementById("reset-btn")?.addEventListener("click", resetLock);
  document
    .getElementById("perm-btn")
    ?.addEventListener("click", requestPermission);
  document.getElementById("dist")?.addEventListener("input", showResult);
  document.getElementById("eyeh")?.addEventListener("input", showResult);
}

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="wrap">
    <div class="app-header">
      <h1>Clinometer</h1>
      <p>SYDE 362 — Design 3</p>
    </div>

    <div id="perm-section" class="card" style="display:none">
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
        <li>Measure and enter the two inputs above</li>
        <li>Look through the sighting tube at the top of the object</li>
        <li>Tap Lock when aligned</li>
      </ul>

      <div class="card" id="history-card" style="display:none">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span style="font-weight:500; font-size:15px;">History</span>
          <button class="btn small-btn" id="clear-btn">Clear</button>
        </div>
        <div id="history-list"></div>
      </div>
    </div>
  </div>
`;

init();
