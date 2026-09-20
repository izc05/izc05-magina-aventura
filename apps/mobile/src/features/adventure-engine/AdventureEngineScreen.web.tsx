import { useEffect, useMemo, useRef, useState } from "react";
import { Engine } from "@babylonjs/core/Engines/engine";
import type { ActivityState } from "@magina-aventura/contracts";
import { normalizeLocationSample, transitionActivityState } from "@magina-aventura/activity-engine";
import { createGameScene, type GameHandle } from "./babylon-scene";
import { levelForXp, progressionForXp } from "./progression";
import { TEST_DATA_LABEL, testAdventureRoute } from "./test-data";
import compassAsset from "../../../assets/magina-compass.png";
import "./adventure-engine.css";
import {
  Activity,
  ArrowUpRight,
  Backpack,
  BatteryCharging,
  Camera,
  Check,
  ChevronRight,
  CloudOff,
  Crosshair,
  Download,
  Flame,
  Footprints,
  Gauge,
  Gem,
  LocateFixed,
  Map,
  Mountain,
  Navigation,
  Radio,
  Route,
  ScanLine,
  Settings2,
  ShieldCheck,
  Signal,
  Sparkles,
  Target,
  WifiOff,
  X,
} from "lucide-react";

type Panel = "map" | "camera" | "backpack";
type AdventureState = {
  xp: number;
  level: number;
  activityState: ActivityState;
  gpsEnabled: boolean;
  distanceToCheckpoint: number;
  currentCheckpoint: number;
  completedCheckpoints: number[];
  inventory: string[];
  synced: boolean;
};

const STORAGE_KEY = "magina-adventure-state-v1";
const COMPASS_ASSET = compassAsset;

const defaultState: AdventureState = {
  xp: 320,
  level: levelForXp(320).level,
  activityState: "DRAFT",
  gpsEnabled: false,
  distanceToCheckpoint: 128,
  currentCheckpoint: 2,
  completedCheckpoints: [1],
  inventory: ["Brújula de cobre", "Fragmento de mapa"],
  synced: false,
};

function loadState(): AdventureState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState;
  } catch {
    return defaultState;
  }
}

function MapStage({ state, onArrive }: { state: AdventureState; onArrive: () => void }) {
  const checkpointReached = state.completedCheckpoints.includes(state.currentCheckpoint);
  return (
    <section className="map-shell glass-panel">
      <div className="map-toolbar">
        <div className="map-title-block">
          <div className="eyebrow"><Map size={13} /> MAPA VECTORIAL · OFFLINE</div>
          <h1>{testAdventureRoute.title}</h1>
          <p><span className="online-dot" /> {testAdventureRoute.municipalityName} · {TEST_DATA_LABEL}</p>
        </div>
        <div className="map-tools">
          <button className="icon-button" title="Centrar mapa"><Crosshair size={16} /></button>
          <button className="icon-button" title="Ajustes de mapa"><Settings2 size={16} /></button>
        </div>
      </div>

      <div className="map-canvas">
        <div className="map-grid" />
        <div className="map-contours contours-a" />
        <div className="map-contours contours-b" />
        <div className="map-label label-north">PICO<br />MÁGINA</div>
        <div className="map-label label-olive">OLIVARES<br /><span>Reserva natural</span></div>
        <svg className="route-svg" viewBox="0 0 700 420" role="img" aria-label="Ruta con tres checkpoints">
          <path className="route-shadow" d="M95,340 C155,294 176,330 230,267 S337,178 378,218 S476,285 532,202 S598,102 642,74" />
          <path className="route-line" d="M95,340 C155,294 176,330 230,267 S337,178 378,218 S476,285 532,202 S598,102 642,74" />
          <circle className="route-progress" cx="378" cy="218" r="7" />
          {[{ x: 95, y: 340, n: "01", active: false }, { x: 378, y: 218, n: "02", active: !checkpointReached }, { x: 642, y: 74, n: "03", active: false }].map((point) => (
            <g key={point.n} className={point.active ? "checkpoint checkpoint-active" : "checkpoint"}>
              <circle className="checkpoint-ring" cx={point.x} cy={point.y} r="19" />
              <circle className="checkpoint-core" cx={point.x} cy={point.y} r="11" />
              <text x={point.x} y={point.y + 4} textAnchor="middle">{point.n}</text>
            </g>
          ))}
          <g className="player-marker" transform="translate(322 254)">
            <circle r="15" />
            <circle className="player-dot" r="5" />
            <path d="M0,-24 L4,-14 L-4,-14 Z" />
          </g>
        </svg>
        <div className="map-scale"><span /> 500 m</div>
        <div className="map-compass"><img src={COMPASS_ASSET} alt="Rosa de los vientos" /></div>
        <div className="poi-card">
          <div className="poi-icon"><Mountain size={14} /></div>
          <div><strong>Mirador de la Cruz</strong><small>Checkpoint activo · 1.4 km</small></div>
          <ArrowUpRight size={14} />
        </div>
      </div>

      <div className="map-footer">
        <div className="route-stat"><Route size={15} /><span><strong>6.8 km</strong><small>ruta total</small></span></div>
        <div className="route-stat"><Gauge size={15} /><span><strong>+340 m</strong><small>desnivel</small></span></div>
        <div className="route-stat"><Footprints size={15} /><span><strong>2 h 40</strong><small>estimado</small></span></div>
        <button className={`arrive-button ${checkpointReached ? "is-complete" : ""}`} onClick={onArrive} disabled={checkpointReached}>
          {checkpointReached ? <Check size={15} /> : <Target size={15} />}
          {checkpointReached ? "Checkpoint completado" : "Registrar llegada"}
        </button>
      </div>
    </section>
  );
}

function ElevationProfile() {
  return (
    <div className="elevation-wrap">
      <div className="mini-heading"><span>PERFIL DE ELEVACIÓN</span><span>+340 m</span></div>
      <svg viewBox="0 0 300 74" preserveAspectRatio="none" className="elevation-chart" aria-label="Perfil de elevación de la ruta">
        <defs><linearGradient id="elevFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#e8a044" stopOpacity=".36" /><stop offset="1" stopColor="#e8a044" stopOpacity="0" /></linearGradient></defs>
        <path d="M0 66 L18 60 L35 64 L53 48 L67 52 L84 38 L101 43 L117 22 L131 30 L150 18 L168 34 L181 30 L196 42 L213 36 L228 49 L243 41 L259 54 L274 44 L288 29 L300 14 L300 74 L0 74 Z" fill="url(#elevFill)" />
        <path d="M0 66 L18 60 L35 64 L53 48 L67 52 L84 38 L101 43 L117 22 L131 30 L150 18 L168 34 L181 30 L196 42 L213 36 L228 49 L243 41 L259 54 L274 44 L288 29 L300 14" fill="none" stroke="#e8a044" strokeWidth="2" />
        <circle cx="196" cy="42" r="4" fill="#f9f2de" stroke="#e8a044" strokeWidth="2" />
      </svg>
      <div className="elevation-axis"><span>Inicio</span><span>Km 3.4</span><span>Mirador</span></div>
    </div>
  );
}

function CameraPanel({ onClose, onPickUp }: { onClose: () => void; onPickUp: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="camera-modal glass-panel" onClick={(event) => event.stopPropagation()}>
        <div className="camera-header"><div><div className="eyebrow"><ScanLine size={13} /> VISIÓN DE CAMPO</div><h2>Cámara / AR</h2></div><button className="icon-button" onClick={onClose}><X size={17} /></button></div>
        <div className="camera-view">
          <div className="camera-noise" />
          <div className="camera-reticle"><span /><i /><b /><em /></div>
          <div className="ar-pin ar-pin-one"><Sparkles size={13} /><span>Rastro antiguo<small>12 m</small></span></div>
          <div className="ar-pin ar-pin-two"><Gem size={13} /><span>Objeto oculto<small>3 m</small></span></div>
          <div className="camera-fallback"><Camera size={17} /><span>ARCore no disponible · modo cámara básico activo</span></div>
          <div className="camera-stamp">MÁGINA / 03<br /><b>FIELD MODE</b></div>
        </div>
        <div className="camera-footer"><div className="camera-readout"><span>RUMBO</span><strong>NE <small>038°</small></strong></div><div className="camera-readout"><span>ALTITUD</span><strong>1.218 <small>m</small></strong></div><button className="primary-button" onClick={onPickUp}><Gem size={15} /> Recoger objeto</button></div>
      </div>
    </div>
  );
}

function BackpackPanel({ state, onClose }: { state: AdventureState; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="backpack-modal glass-panel" onClick={(event) => event.stopPropagation()}>
        <div className="camera-header"><div><div className="eyebrow"><Backpack size={13} /> EQUIPO DE EXPLORACIÓN</div><h2>Mochila</h2></div><button className="icon-button" onClick={onClose}><X size={17} /></button></div>
        <div className="inventory-grid">{state.inventory.map((item, index) => <div className="inventory-item" key={item}><div className={`inventory-art art-${index}`}><Gem size={20} /></div><strong>{item}</strong><span>{index === 0 ? "Equipo" : "Pista de misión"}</span></div>)}<div className="inventory-item inventory-empty"><div className="inventory-art"><Sparkles size={20} /></div><strong>Espacio libre</strong><span>Explora para descubrir</span></div></div>
      </div>
    </div>
  );
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedRef = useRef(false);
  const [panel, setPanel] = useState<Panel>("map");
  const [state, setState] = useState<AdventureState>(loadState);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* offline storage unavailable */ }
  }, [state]);

  useEffect(() => {
    if (!state.gpsEnabled || state.distanceToCheckpoint <= 0) return;
    const timer = window.setInterval(() => setState((current) => ({ ...current, distanceToCheckpoint: Math.max(0, current.distanceToCheckpoint - 4) })), 1100);
    return () => window.clearInterval(timer);
  }, [state.gpsEnabled, state.distanceToCheckpoint]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || startedRef.current) return;
    startedRef.current = true;
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, adaptToDeviceRatio: true, alpha: true });
    let handle: GameHandle | null = null;
    createGameScene(engine, canvas).then((nextHandle) => { handle = nextHandle; engine.runRenderLoop(() => nextHandle.scene.render()); });
    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); handle?.dispose(); engine.dispose(); startedRef.current = false; };
  }, []);

  const xpProgress = useMemo(() => progressionForXp(state.xp).progress, [state.xp]);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(null), 2600); };

  const activateGps = () => {
    const sample = normalizeLocationSample({
      sequence: 1,
      timestamp: new Date().toISOString(),
      latitude: 37.824,
      longitude: -3.408,
      accuracyMeters: 5,
      altitudeMeters: 1014,
      speedMps: 1.2,
      headingDegrees: 38,
    }, null);
    if (!sample.validForMetrics) {
      notify("GPS rechazado por calidad insuficiente");
      return;
    }
    setState((current) => ({ ...current, activityState: current.activityState === "DRAFT" ? transitionActivityState("DRAFT", "START") : current.activityState, gpsEnabled: true, synced: false }));
    notify("GPS simulado activo · geofencing en marcha");
  };

  const arrive = () => {
    if (state.completedCheckpoints.includes(state.currentCheckpoint)) return;
    setState((current) => {
      const nextXp = current.xp + 180;
      return { ...current, activityState: current.activityState === "ACTIVE" ? transitionActivityState("ACTIVE", "FINISH") : current.activityState, level: levelForXp(nextXp).level, distanceToCheckpoint: 0, xp: nextXp, completedCheckpoints: [...current.completedCheckpoints, current.currentCheckpoint], inventory: [...current.inventory, "Insignia del mirador"], synced: false };
    });
    notify("Checkpoint registrado · +180 XP · objeto añadido");
  };

  const pickUp = () => {
    if (!state.inventory.includes("Amuleto de la sierra")) {
      setState((current) => ({ ...current, inventory: [...current.inventory, "Amuleto de la sierra"], xp: current.xp + 40, synced: false }));
      notify("Objeto encontrado · +40 XP");
    } else notify("El objeto ya está en tu mochila");
  };

  return (
    <main className="game-root">
      <canvas ref={canvasRef} className="game-canvas" style={{ touchAction: "none" }} />
      <div className="game-vignette" />
      <div className="game-ui">
        <header className="topbar">
          <div className="brand-lockup"><div className="brand-mark"><img src={COMPASS_ASSET} alt="" /></div><div><strong>AVENTURA <span>MÁGINA</span></strong><small>ENGINE / OFFLINE FIELD SYSTEM</small></div></div>
          <div className="topbar-status"><div className="status-chip"><WifiOff size={13} /><span>Modo offline</span></div><div className="battery"><BatteryCharging size={15} /><span>82%</span></div><button className="avatar">LG</button></div>
        </header>

        <div className="dashboard-grid">
          <aside className="left-rail">
            <div className="rail-section"><span className="rail-label">AVENTURA ACTIVA</span><div className="adventure-card"><div className="adventure-thumb"><Mountain size={24} /><span>03</span></div><div className="adventure-copy"><strong>La ruta del silencio</strong><small>Sierra Mágina · 68%</small></div><ChevronRight size={15} /></div></div>
            <div className="rail-section"><span className="rail-label">SISTEMAS</span><nav className="system-nav"><button className="active"><Map size={16} /><span>Mapa de ruta</span><kbd>M</kbd></button><button onClick={() => setPanel("camera")}><Camera size={16} /><span>Cámara / AR</span><kbd>C</kbd></button><button onClick={() => setPanel("backpack")}><Backpack size={16} /><span>Mochila</span><kbd>I</kbd></button></nav></div>
            <div className="download-card"><div className="download-icon"><Download size={16} /></div><div><strong>Paquete verificado</strong><small>v1.4.2 · 124 MB</small></div><ShieldCheck size={16} className="verified" /></div>
            <div className="rail-footer"><span><Activity size={13} /> SISTEMA ESTABLE</span><small>Última sync · hace 2 h</small></div>
          </aside>

          <section className="main-column"><MapStage state={state} onArrive={arrive} /><div className="lower-grid"><div className="mission-card glass-panel"><div className="card-kicker"><Flame size={13} /> MISIÓN ACTIVA <span>+180 XP</span></div><div className="mission-main"><div><h3>La señal de la cruz</h3><p>Encuentra el antiguo mirador y registra tu llegada en la baliza.</p></div><div className="mission-radial"><strong>{state.completedCheckpoints.includes(2) ? "100" : "68"}<small>%</small></strong></div></div><div className="mission-progress"><span style={{ width: `${state.completedCheckpoints.includes(2) ? 100 : 68}%` }} /></div><div className="mission-meta"><span><LocateFixed size={13} /> {state.distanceToCheckpoint > 0 ? `${state.distanceToCheckpoint} m al checkpoint` : "Checkpoint en rango"}</span><button onClick={state.gpsEnabled ? arrive : activateGps}>{state.gpsEnabled ? "Ver objetivo" : "Activar GPS"} <ArrowUpRight size={13} /></button></div></div><div className="elevation-card glass-panel"><ElevationProfile /></div></div></section>

          <aside className="right-panel">
            <div className="profile-card glass-panel"><div className="profile-top"><div className="level-orb"><span>NIVEL</span><strong>{state.level}</strong></div><div><div className="eyebrow">EXPLORADOR / LG</div><h2>Lucía García</h2><p>Cartógrafa de senderos</p></div><button className="more-button">···</button></div><div className="xp-row"><span>PROGRESO DE NIVEL <b>{state.xp} / 500 XP</b></span><div className="xp-bar"><i style={{ width: `${xpProgress}%` }} /></div></div><div className="profile-stats"><span><strong>{state.completedCheckpoints.length}</strong><small>checkpoints</small></span><span><strong>{state.inventory.length}</strong><small>objetos</small></span><span><strong>6.8</strong><small>km ruta</small></span></div></div>
            <div className="location-card glass-panel"><div className="section-heading"><span><Navigation size={14} /> LOCATION ENGINE</span><span className={`live-pill ${state.gpsEnabled ? "is-live" : ""}`}><i />{state.gpsEnabled ? "GPS ACTIVO" : "EN ESPERA"}</span></div><div className="location-readout"><div className="distance-number">{state.distanceToCheckpoint}<small>m</small></div><div className="distance-caption"><span>distancia al checkpoint</span><strong>{state.gpsEnabled ? "Acercándote" : "Localización desactivada"}</strong></div></div><div className="signal-row"><span><Signal size={14} /> GNSS · {state.gpsEnabled ? "3.2 m precisión" : "sin señal"}</span><button onClick={activateGps}><Radio size={14} /> {state.gpsEnabled ? "Recalibrar" : "Activar GPS"}</button></div></div>
            <div className="sync-card"><div className="sync-icon"><CloudOff size={16} /></div><div><strong>Progreso local guardado</strong><small>Se sincronizará al recuperar Internet</small></div><button onClick={() => { setState((current) => ({ ...current, synced: true })); notify("Estado preparado para sincronizar"); }} className={state.synced ? "synced" : ""}>{state.synced ? <Check size={14} /> : <ArrowUpRight size={14} />}</button></div>
          </aside>
        </div>

        <nav className="bottom-nav"><button className={panel === "map" ? "selected" : ""} onClick={() => setPanel("map")}><Map size={17} /><span>Mapa</span></button><button onClick={() => notify("Lista de misiones disponible en la siguiente ruta")}><Target size={17} /><span>Misiones</span><b>1</b></button><button onClick={() => setPanel("camera")} className="capture-button"><span><Camera size={18} /></span><small>Explorar</small></button><button onClick={() => setPanel("backpack")} className={panel === "backpack" ? "selected" : ""}><Backpack size={17} /><span>Mochila</span></button><button onClick={() => notify("Ajustes del paquete offline") }><Settings2 size={17} /><span>Ajustes</span></button></nav>
      </div>
      {panel === "camera" && <CameraPanel onClose={() => setPanel("map")} onPickUp={pickUp} />}
      {panel === "backpack" && <BackpackPanel state={state} onClose={() => setPanel("map")} />}
      {toast && <div className="toast"><Sparkles size={15} /><span>{toast}</span></div>}
    </main>
  );
}
