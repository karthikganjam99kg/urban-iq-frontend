import { useState,useEffect } from "react";
import LiveMap from "./LiveMap";
import {
  supabaseEnabled,
  recordDetection,
  fetchRecentDetections,
  subscribeToDetections,
} from "./lib/supabase";
import {
  apiUrl,
  getAlerts as fetchAlertsData,
  getDemandForecast as fetchDemandForecast,
  getFitness as fetchFitnessData,
  getFleet as fetchFleetData,
  getOverview as fetchOverviewData,
  getRoutes as fetchRoutesData,
  getTrafficHistory,
  simulateTraffic,
} from "./lib/api";
import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [detections, setDetections] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState("");
  const [roadRisk, setRoadRisk] = useState(null);
const [cameraStream, setCameraStream] = useState(null);
const [imageDimensions, setImageDimensions] = useState({
  width: 1,
  height: 1
});
const [trafficData, setTrafficData] = useState(null);
const [trafficStatus, setTrafficStatus] = useState("loading");
const [alerts, setAlerts] = useState([]);
const [vehicleCount, setVehicleCount] = useState(null);
const [simulatedVehicles, setSimulatedVehicles] = useState(50);
const [simulationResult, setSimulationResult] = useState(null);
const [trafficHistory, setTrafficHistory] = useState([]);
const [liveDetections, setLiveDetections] = useState([]);
const [neuralStatus, setNeuralStatus] = useState("checking");
const [neuralModels, setNeuralModels] = useState({});
const [demandForecast, setDemandForecast] = useState(null);
const [demandStatus, setDemandStatus] = useState("loading");
const [fleetBuses, setFleetBuses] = useState([]);
const [fleetStatus, setFleetStatus] = useState("loading");
const [fleetSummary, setFleetSummary] = useState(null);
const [overview, setOverview] = useState(null);
const [routeData, setRouteData] = useState(null);
const [fitnessData, setFitnessData] = useState(null);
const [simulationStatus, setSimulationStatus] = useState("idle");
useEffect(() => {
    const getTrafficData = async () => {
      try {
        const response = await fetch(apiUrl("/api/traffic"));
        const data = await response.json();

        if (!response.ok || data?.error) {
          setTrafficStatus("offline");
          return;
        }

        setTrafficData(data);
        setTrafficStatus("live");
      } catch (error) {
        console.error("Traffic API error:", error);
        setTrafficStatus("offline");
      }
    };

    getTrafficData();
    const getAlerts = async () => {
      try {
        const data = await fetchAlertsData();
        setAlerts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Alerts API error:", error);
      }
    };

    const pingNeuralApi = async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(apiUrl("/api/health"), {
          signal: controller.signal,
        });
        const data = await response.json();
        if (response.ok && data?.status === "ok") {
          setNeuralStatus("live");
          setNeuralModels(data.models ?? {});
        } else {
          setNeuralStatus("offline");
        }
      } catch {
        setNeuralStatus("offline");
      } finally {
        clearTimeout(timer);
      }
    };

    const getDemandForecast = async () => {
      try {
        const data = await fetchDemandForecast();
        if (data?.status === "offline") {
          setDemandStatus("offline");
          return;
        }
        setDemandForecast(data);
        setDemandStatus(data.status === "live" ? "live" : "collecting");
      } catch {
        setDemandStatus("offline");
      }
    };

    const getFleet = async () => {
      try {
        const data = await fetchFleetData();
        if (data?.status === "offline") {
          setFleetStatus("offline");
          return;
        }
        setFleetBuses(Array.isArray(data.buses) ? data.buses : []);
        setFleetSummary(data.summary ?? null);
        setFleetStatus(data.status ?? "empty");
      } catch {
        setFleetStatus("offline");
      }
    };

    const getOperationalData = async () => {
      const results = await Promise.allSettled([
        fetchOverviewData(),
        fetchRoutesData(),
        fetchFitnessData(),
      ]);
      if (results[0].status === "fulfilled") setOverview(results[0].value);
      if (results[1].status === "fulfilled") setRouteData(results[1].value);
      if (results[2].status === "fulfilled") setFitnessData(results[2].value);
    };

    getAlerts();
    pingNeuralApi();
    getDemandForecast();
    getFleet();
    getOperationalData();
    const interval = setInterval(getTrafficData, 5000);
    const alertsInterval = setInterval(getAlerts, 15000);
    const neuralInterval = setInterval(pingNeuralApi, 15000);
    const demandInterval = setInterval(getDemandForecast, 60000);
    const fleetInterval = setInterval(getFleet, 15000);
    const operationalInterval = setInterval(getOperationalData, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(alertsInterval);
      clearInterval(neuralInterval);
      clearInterval(demandInterval);
      clearInterval(fleetInterval);
      clearInterval(operationalInterval);
    };
  }, []);

  // Supabase keeps the history and detection feed alive across devices.
  useEffect(() => {
    if (!supabaseEnabled) return;

    const loadStoredData = async () => {
      const [historyResponse, detectionFeed] = await Promise.all([
        getTrafficHistory().catch(() => []),
        fetchRecentDetections(),
      ]);
      setTrafficHistory(Array.isArray(historyResponse) ? historyResponse : []);
      setLiveDetections(detectionFeed);
    };

    loadStoredData();

    const unsubscribe = subscribeToDetections((row) => {
      setLiveDetections((current) => [row, ...current].slice(0, 8));
    });

    const historyInterval = setInterval(async () => {
      try {
        const data = await getTrafficHistory();
        if (Array.isArray(data)) setTrafficHistory(data);
      } catch (error) {
        console.warn("Traffic history refresh failed:", error);
      }
    }, 60000);

    return () => {
      unsubscribe();
      clearInterval(historyInterval);
    };
  }, []);
  const trafficIsLive = trafficStatus === "live" && trafficData !== null;
  const potholeApiLive = neuralStatus === "live" && neuralModels.pothole !== false;
  const potholeChip =
    neuralStatus === "checking"
      ? "YOLO · CONNECTING"
      : potholeApiLive
        ? "YOLO · LIVE"
        : neuralStatus === "live"
          ? "YOLO · MODEL MISSING"
          : "YOLO · OFFLINE";

  const averageConfidence = (items = []) => {
    const scores = items
      .map((item) => item.confidence ?? item.detection_confidence)
      .filter((score) => typeof score === "number");

    if (scores.length === 0) return null;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  };

  const logDetection = (kind, items = []) => {
    recordDetection({
      kind,
      count: items.length,
      confidence: averageConfidence(items),
      meta: { source: "web-client", labels: items.map((item) => item.label) },
    });
  };

  // Traffic cards must never sit on "Loading..." when the feed is unavailable.
  const trafficField = (value, suffix = "") => {
    if (trafficIsLive && value !== undefined && value !== null) {
      return `${value}${suffix}`;
    }
    return trafficStatus === "offline" ? "Feed offline" : "Connecting…";
  };

  const menuItems = [
  { name: "Dashboard", icon: "📊" },
  { name: "Live Fleet", icon: "🚌" },
  { name: "AI Prediction", icon: "🤖" },
  { name: "Pothole Detection", icon: "🕳️" },
  { name: "Camera", icon: "📷" },
  { name: "Routes", icon: "🗺️" },
  { name: "Alerts", icon: "🔔" },
  { name: "Fitness & Sports", icon: "🏃" },
  { name: "Road Safety Lab", icon: "🛡️" },
  { name: "Traffic Simulator", icon: "🚦" },
];

 const buses = fleetBuses;
  const routes = routeData?.routes ?? [];
  const highDemandBuses =
    demandStatus === "live"
      ? buses
          .map((bus) => ({
            ...bus,
            demand: demandForecast?.routes?.find(
              (route) => route.bus_id === bus.id,
            ),
          }))
          .filter((bus) => bus.demand?.demand_level === "HIGH")
      : [];
  const delayedBuses = buses.filter((bus) =>
    bus.telemetry_status === "live" &&
    String(bus.operational_status).toUpperCase().includes("DELAY"),
  );
  const activeAlertCount =
    (overview?.active_alerts ?? alerts.length) +
    highDemandBuses.length +
    delayedBuses.length;

  const runTrafficSimulation = async () => {
    setSimulationStatus("loading");
    setSimulationResult(null);
    try {
      const result = await simulateTraffic(simulatedVehicles);
      setSimulationResult(result);
      setSimulationStatus("live");
    } catch (error) {
      setSimulationStatus(error.data?.status ?? "offline");
      setSimulationResult({
        error: error.message,
        status: error.data?.status ?? "offline",
      });
    }
  };

  const getStatusClass = (status) => {
    const normalized = String(status).toUpperCase();
    if (
      ["STALE", "MISSING", "COLLECTING", "LOADING", "CHECKING"].includes(
        normalized,
      ) ||
      normalized.includes("DELAY")
    ) {
      return "badge yellow";
    }
    if (normalized === "OFFLINE") return "badge red";
    return "badge green";
  };

  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">⌁</div>

          <div>
            <h2>URBAN<span>IQ</span></h2>
            <small>City Intelligence OS</small>
          </div>
        </div>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item.name}
              className={
                activePage === item.name
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() => setActivePage(item.name)}
            >
              <span>{item.icon}</span>
              {item.name}

              {/* ALERT COUNT */}
              {item.name === "Alerts" && (
                <small className="alert-count">
                  {activeAlertCount}
                </small>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sih-mark">SIH</div>
          <div>
            <strong>SIH26124</strong>
            <span>Smart India Hackathon</span>
          </div>
        </div>

      </aside>

      {/* MAIN */}
      <main className="main">

        {/* HEADER */}
        <header className="topbar">

          <div>
            <span className="project-code">
              SIH 2026 · PROBLEM 26124
            </span>

            <h1>
              Hyderabad Urban Intelligence
            </h1>

            <p>AI-powered command centre for safer, faster, cleaner cities</p>
          </div>

          <div className="status-cluster">
            <div className="system-status">
              <span className="status-dot"></span>
              {overview?.status === "operational"
                ? "All systems operational"
                : overview
                  ? "Service degradation detected"
                  : "Checking system status"}
            </div>
            <span className="command-location">📍 Hyderabad, IN</span>
          </div>

        </header>

     {/* ================= DASHBOARD ================= */}

{activePage === "Dashboard" && (
  <>
    <section className="command-strip">
      <div>
        <span className="eyebrow">
          CITY OPERATIONS ·{" "}
          {overview?.status === "operational"
            ? "LIVE"
            : overview
              ? "DEGRADED"
              : "CHECKING"}
        </span>
        <h2>One city. One intelligent control layer.</h2>
        <p>Combining fleet telemetry, computer vision and real-time traffic intelligence.</p>
      </div>
      <div className="command-strip-metrics">
        <span>
          <b>
            {overview?.models
              ? Object.values(overview.models).filter(Boolean).length
              : "—"}
          </b>{" "}
          AI engines
        </span>
        <span><b>{fleetSummary?.total ?? "—"}</b> configured assets</span>
        <span><b>24/7</b> monitoring</span>
      </div>
    </section>

    <h2 className="page-title">
      Operations overview
    </h2>

    <div className="stats-grid">

      <div className="stat-card">
        <span>🚌</span>
        <p>Total Buses</p>
        <h2>{fleetSummary?.total ?? "—"}</h2>
      </div>

      <div className="stat-card">
        <span>🟢</span>
        <p>Live Telemetry</p>
        <h2>{fleetSummary?.live ?? "—"}</h2>
      </div>

      <div className="stat-card">
        <span>🟡</span>
        <p>Stale / Missing</p>
        <h2>
          {fleetSummary
            ? `${fleetSummary.stale} / ${fleetSummary.missing ?? 0}`
            : "—"}
        </h2>
      </div>

      <div className="stat-card">
        <span>🔴</span>
        <p>High Demand</p>
        <h2>
          {demandStatus === "live"
            ? demandForecast.routes.filter((route) => route.demand_level === "HIGH").length
            : "—"}
        </h2>
      </div>

    </div>

    {/* ================= TRAFFIC CONGESTION ================= */}

    <section className="section-card">

      <h2>
        🚦 Traffic Congestion
      </h2>

      <p>
        Hyderabad traffic conditions
      </p>

      {trafficIsLive ? (
        <div className="prediction-box">

          <span>
            Current Congestion Score
          </span>

          <h1 style={{ color: "#111827", fontSize: "38px", fontWeight: "700" }}>
  {trafficData.congestion_score}%
</h1>

          <strong>
            {trafficData.congestion_level}
          </strong>

          <p>
          🚗 Current Speed: {trafficData.current_speed} km/h
          </p>

          <p>
          🚘 Free Flow Speed: {trafficData.free_flow_speed} km/h
          </p>
        </div>
      ) : (
        <p>
          {trafficStatus === "offline"
            ? "Traffic feed offline — check the TomTom key on the API service."
            : "Loading traffic data..."}
        </p>
      )}
{selectedImage && (
  <div style={{ marginTop: "20px" }}>
    <h3>AI Detection Result</h3>
<div
  style={{
    position: "relative",
    display: "inline-block",
    maxWidth: "100%"
  }}
>
  <img
    src={selectedImage}
    alt="Pothole detection"
    style={{
      maxWidth: "100%",
      display: "block",
      borderRadius: "10px"
    }}
  />

  {detections.map((detection, index) => {
    const [x1, y1, x2, y2] = detection.box;

    return (
      <div
        key={index}
        style={{
          position: "absolute",
         left: `${(x1 / imageDimensions.width) * 100}%`,
top: `${(y1 / imageDimensions.height) * 100}%`,
width: `${((x2 - x1) / imageDimensions.width) * 100}%`,
height: `${((y2 - y1) / imageDimensions.height) * 100}%`,
          border: "5px solid red",
backgroundColor: "rgba(255, 0, 0, 0.15)",
          boxSizing: "border-box",
          pointerEvents: "none"
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "-25px",
            left: "0",
            background: "red",
            color: "white",
            padding: "3px 6px",
            fontSize: "12px",
            fontWeight: "bold",
            borderRadius: "4px",
            whiteSpace: "nowrap"
          }}
        >
          Pothole {index + 1} — {detection.confidence}%
        </span>
      </div>
    );
  })}
</div>
    
    

    <h3 style={{ marginTop: "15px" }}>
      Detected Potholes: {detections.length}
    </h3>

    {detections.map((detection, index) => (
      <p key={index}>
        🕳️ Pothole {index + 1} — Confidence:{" "}
        {detection.confidence}%
      </p>
    ))}
  </div>
)}

    </section>

    {/* ================= LIVE PUBLIC TRANSPORT ================= */}

    <section className="section-card">

      <div className="section-header">

        <div>
          <h2>
            🚌 Live Public Transport Fleet
          </h2>

          <p>
            Real-time fleet monitoring
          </p>
        </div>

        <button
          onClick={() =>
            setActivePage("Live Fleet")
          }
        >
          View All
        </button>

      </div>

      <div className="bus-grid">

        {buses.slice(0, 4).map((bus) => (
          <div
            className="bus-card"
            key={bus.id}
          >

            <div className="bus-icon">
              🚌
            </div>

            <h3>
              {bus.id}
            </h3>

            <p>
              {bus.route_name}
            </p>

            <strong>
              {bus.speed ?? "—"} km/h
            </strong>

            <span
              className={getStatusClass(bus.telemetry_status)}
            >
              {bus.telemetry_status}
            </span>

          </div>
        ))}

      </div>

    </section>

    {/* ================= AI DEMAND PREDICTION ================= */}

    <section className="section-card">

      <h2>
        🤖 AI Demand Prediction
      </h2>

      <p>
        Supabase YOLO crowd-demand model
      </p>

      {demandStatus === "live" && demandForecast ? (
        <div className="prediction-box">
          <span>Next-hour people signal</span>
          <h1>{demandForecast.predicted_people} people</h1>
          <strong>{demandForecast.demand_level}</strong>
          <div className="recommendation">
            <b>Model recommendation</b>
            <br />
            {demandForecast.recommendation}
          </div>
        </div>
      ) : (
        <div className="prediction-box">
          <span>Demand model status</span>
          <h1>{demandStatus === "offline" ? "Offline" : "Collecting data"}</h1>
          <strong>
            {demandForecast?.data_quality
              ? `${demandForecast.data_quality.minute_buckets} minute bucket`
              : "Waiting for API"}
          </strong>
          <p>No forecast is shown until the model has enough recent history.</p>
        </div>
      )}

    </section>

  </>
)}
           
        {/* ================= LIVE FLEET ================= */}

        {activePage === "Live Fleet" && (
          <>
            <div className="page-heading">
              <div>
                <span className="eyebrow">SUPABASE · VEHICLE TELEMETRY</span>
                <h2 className="page-title">Live Fleet</h2>
                <p>Bus position, speed and route data from the fleet database.</p>
              </div>
              <span className={`model-chip ${
                fleetStatus === "live"
                  ? "is-live"
                  : ["loading", "stale", "missing"].includes(fleetStatus)
                    ? "is-checking"
                    : "is-offline"
              }`}>
                {fleetStatus === "live"
                  ? "FLEET · LIVE"
                  : fleetStatus === "stale"
                    ? "FLEET · STALE"
                    : fleetStatus === "missing"
                      ? "FLEET · NO SIGNAL"
                    : fleetStatus === "offline"
                      ? "FLEET · OFFLINE"
                      : "FLEET · CONNECTING"}
              </span>
            </div>

            <section className="section-card">

              <h2>
                🚌 Live Fleet Monitoring
              </h2>

              <p>
                Configured public transport vehicles with telemetry freshness
              </p>

              {(fleetStatus === "stale" || fleetStatus === "missing") && (
                <div className="inline-error">
                  <span>!</span>
                  <div>
                    <strong>
                      {fleetStatus === "stale"
                        ? "Fleet telemetry is stale"
                        : "Configured vehicles have no telemetry"}
                    </strong>
                    <p>
                      {fleetStatus === "stale"
                        ? "The buses below come from Supabase, but their last location updates are older than five minutes."
                        : "Reference vehicles are loaded from Supabase; GPS ingestion has not reported a current position."}
                    </p>
                  </div>
                </div>
              )}

              {fleetStatus === "offline" && (
                <div className="inline-error">
                  <span>!</span>
                  <div>
                    <strong>Fleet API offline</strong>
                    <p>Vehicle data remains unavailable until the backend reconnects.</p>
                  </div>
                </div>
              )}

              <div className="bus-grid">

                {buses.length === 0 && fleetStatus !== "loading" && (
                  <div className="bus-card">
                    <div className="bus-icon">🚌</div>
                    <h3>No fleet rows</h3>
                    <p>Waiting for configured vehicles.</p>
                    <span className="badge">EMPTY</span>
                  </div>
                )}

                {buses.map((bus) => (
                  <div
                    className="bus-card"
                    key={bus.id}
                  >

                    <div className="bus-icon">
                      🚌
                    </div>

                    <h3>{bus.id}</h3>

                    <p>{bus.route_name}</p>

                    <strong>
                      Speed {bus.speed ?? "—"} km/h
                    </strong>

                    <span
                      className={getStatusClass(bus.telemetry_status)}
                    >
                      {bus.telemetry_status}
                    </span>

                  </div>
                ))}

              </div>

            </section>

            <section className="section-card">

              <h2>
                🗺️ Live Fleet Map
              </h2>

              <p>
                Current bus locations
              </p>

              <LiveMap buses={buses} telemetryStatus={fleetStatus} />

            </section>

          </>
        )}
        {/* ================= POTHOLE DETECTION ================= */}

{activePage === "Pothole Detection" && (
  <>
    <div className="page-heading">
      <div>
        <span className="eyebrow">COMPUTER VISION · ROAD SAFETY</span>
        <h2 className="page-title">Pothole Intelligence</h2>
        <p>Detect and classify road damage from any camera image in seconds.</p>
      </div>
      <span className={`model-chip ${neuralStatus === "live" && potholeApiLive ? "is-live" : neuralStatus === "checking" ? "is-checking" : "is-offline"}`}>
        {potholeChip}
      </span>
    </div>

    <section className="section-card detector-shell">
      <div className="detector-intro">
        <div className="detector-icon">⌖</div>
        <div>
          <h2>Analyse road imagery</h2>
          <p>JPG, PNG or WEBP · Maximum accuracy with clear road-level images</p>
        </div>
      </div>

      {!potholeApiLive && neuralStatus !== "checking" && (
        <div className="inline-error">
          <span>!</span>
          <div>
            <strong>Vision API not connected</strong>
            <p>The Hugging Face service is unreachable. Pothole detection stays offline until the API health check succeeds.</p>
          </div>
        </div>
      )}

      <label className={`upload-zone ${isDetecting ? "is-loading" : ""} ${!potholeApiLive ? "is-disabled" : ""}`}>
        <input
          type="file"
          accept="image/*"
          disabled={isDetecting || !potholeApiLive}
          onChange={async (event) => {
          const file = event.target.files?.[0];

          if (!file) {
            return;
          }

          const formData = new FormData();
          formData.append("image", file);
          setIsDetecting(true);
          setDetectionError("");

          try {
            const response = await fetch(
              apiUrl("/api/pothole-detect"),
              {
                method: "POST",
                body: formData,
              }
            );

            if (!response.ok) {
              throw new Error(
                `Pothole API returned ${response.status}`
              );
            }

            const data = await response.json();

            console.log("Pothole detection result:", data);

            setDetections(data.detections || []);
            setRoadRisk(data.road_risk ?? null);
            logDetection("pothole", data.detections || []);

            const imageUrl = URL.createObjectURL(file);

            const img = new Image();

            img.onload = () => {
              setImageDimensions({
                width: img.naturalWidth,
                height: img.naturalHeight,
              });
            };

            img.src = imageUrl;
            setSelectedImage(imageUrl);

          } catch (error) {
            console.error("Pothole detection error:", error);
            setNeuralStatus("offline");
            setDetections([]);
            setRoadRisk(null);
            setDetectionError(
              "The AI service could not process this image. Hugging Face looks unreachable — try again when YOLO shows LIVE."
            );
          } finally {
            setIsDetecting(false);
          }
        }}
        />
        <span className="upload-glyph">{isDetecting ? "◌" : "↑"}</span>
        <strong>{isDetecting ? "Running AI analysis…" : "Drop a road image here"}</strong>
        <span>{isDetecting ? "Locating road defects and calculating confidence" : "or click to browse from your device"}</span>
        {!isDetecting && <small>SECURE ON-DEVICE UPLOAD · IMAGE DELETED AFTER ANALYSIS</small>}
      </label>

      {detectionError && (
        <div className="inline-error">
          <span>!</span>
          <div><strong>Analysis unavailable</strong><p>{detectionError}</p></div>
        </div>
      )}

      {selectedImage && (
        <div className="detection-result">
          <div className="result-header">
            <div>
              <span className="eyebrow">ANALYSIS COMPLETE</span>
              <h3>Road condition assessment</h3>
            </div>
            <span className={`result-count ${detections.length ? "has-risk" : ""}`}>
              {detections.length} {detections.length === 1 ? "defect" : "defects"}
            </span>
          </div>

          <div className="result-grid">
            <div className="detection-canvas">
              <img src={selectedImage} alt="Analysed road" />
              {detections.map((detection, index) => {
                const [x1, y1, x2, y2] = detection.box;
                return (
                  <div
                    className="detection-box"
                    key={index}
                    style={{
                      left: `${(x1 / imageDimensions.width) * 100}%`,
                      top: `${(y1 / imageDimensions.height) * 100}%`,
                      width: `${((x2 - x1) / imageDimensions.width) * 100}%`,
                      height: `${((y2 - y1) / imageDimensions.height) * 100}%`,
                    }}
                  >
                    <span>#{index + 1} · {detection.confidence}%</span>
                  </div>
                );
              })}
            </div>

            <div className="result-panel">
              <div className="assessment-score">
                <span>ROAD RISK</span>
                <strong>{roadRisk ?? "UNKNOWN"}</strong>
              </div>
              {detections.length > 0 ? (
                <div className="detection-list">
                  {detections.map((detection, index) => (
                    <div key={index}>
                      <span className="detection-index">{String(index + 1).padStart(2, "0")}</span>
                      <p><strong>Pothole detected</strong><small>{detection.confidence}% confidence</small></p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="clear-result">
                  <span>✓</span>
                  <strong>No visible potholes</strong>
                  <p>This road image appears clear.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </section>
  </>
)}
{/* ================= CAMERA ================= */}

{activePage === "Camera" && (
  <>
    <h2 className="page-title">
      Camera
    </h2>

    <section className="section-card">

      <h2>
        📷 Live Camera Detection
      </h2>

      <p>
        Use your device camera for live road monitoring.
      </p>

      <div style={{ marginTop: "20px" }}>

        <button
          className="primary-button"
          onClick={async () => {
            try {
              const stream =
                await navigator.mediaDevices.getUserMedia({
                  video: true
                });

              console.log("Camera access granted", stream);

              alert("Camera access granted successfully!");
              setCameraStream(stream);
            } catch (error) {
              console.error("Camera error:", error);
              alert("Camera access was denied or unavailable.");
            }
          }}
        >
          📷 Open Camera
        </button>
        {cameraStream && (
  <video
    autoPlay
    playsInline
    ref={(video) => {
      if (video) {
        video.srcObject = cameraStream;
      }
    }}
    style={{
      width: "100%",
      maxWidth: "600px",
      marginTop: "20px",
      borderRadius: "10px"
    }}
  />
)}
<button
  className="primary-button"
 onClick={() => {
  const video = document.querySelector("video");

  if (!video) {
    alert("Camera is not running.");
    return;
  }

  const canvas = document.createElement("canvas");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext("2d");

  context.drawImage(
    video,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const imageData = canvas.toDataURL("image/jpeg");
  canvas.toBlob(async (blob) => {
  const formData = new FormData();

  formData.append("image", blob, "camera.jpg");
 
  const vehicleResponse = await fetch(
  apiUrl("/api/vehicle-detect"),
  {
    method: "POST",
    body: formData,
  }
);

const vehicleData = await vehicleResponse.json();

console.log("Vehicle Detection:", vehicleData);

setVehicleCount(vehicleData.vehicle_count);
logDetection("vehicle", vehicleData.vehicles || []);

alert(
  `Vehicles detected: ${vehicleData.vehicle_count}`
);

  try {
    const response = await fetch(
      apiUrl("/api/pothole-detect"),
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    console.log("AI Camera Detection:", data);
    logDetection("pothole", data.detections || []);

    alert(
      `Potholes detected: ${data.detections.length}`
    );
    try{
    const garbageResponse = await fetch(
      apiUrl("/api/garbage-detect"),
      {
        method: "POST",
        body: formData,
      }
    );

    const garbageData = await garbageResponse.json();

    console.log("Garbage Detection:", garbageData);
    logDetection("garbage", garbageData.detections || []);

    if (garbageData.detections && garbageData.detections.length > 0) {
      fetchAlertsData()
        .then((data) => setAlerts(Array.isArray(data) ? data : []))
        .catch(() => {});

      alert(
`🗑️ Garbage detected: ${garbageData.detections.length}`
      );
    } else {
      alert("✅ No garbage detected.");
    }

  } catch (error) {
    console.error("Garbage AI error:", error);
    alert("Could not connect to Garbage AI.");
  }

  } catch (error) {
    console.error("Camera AI error:", error);
    alert("Could not connect to Pothole AI.");
  }
}, "image/jpeg");

  console.log("Captured camera image:", imageData);

  alert("Camera image captured successfully!");
}}
  style={{ marginTop: "15px" }}
>
  🕳️ Capture & Detect Potholes
</button>

      </div>

    </section>
  </>
)}
      

 

        {/* ================= AI PREDICTION ================= */}

        {activePage === "AI Prediction" && (
          <>
            <div className="page-heading">
              <div>
                <span className="eyebrow">DATA MODEL · FLEET PLANNING</span>
                <h2 className="page-title">AI Demand Prediction</h2>
                <p>One-hour demand proxy trained from Supabase YOLO person-count history.</p>
              </div>
              <span className={`model-chip ${
                demandStatus === "live"
                  ? "is-live"
                  : demandStatus === "loading"
                    ? "is-checking"
                    : "is-offline"
              }`}>
                {demandStatus === "live"
                  ? "MODEL · LIVE"
                  : demandStatus === "collecting"
                    ? "MODEL · COLLECTING"
                    : demandStatus === "offline"
                      ? "MODEL · OFFLINE"
                      : "MODEL · CONNECTING"}
              </span>
            </div>

            <section className="section-card">
              {demandStatus === "live" && demandForecast ? (
                <>
                  <div className="prediction-box">
                    <span>Predicted people signal for the next hour</span>
                    <h1>{demandForecast.predicted_people} people</h1>
                    <p>Demand Level</p>
                    <strong className={demandForecast.demand_level === "HIGH" ? "demand-high" : ""}>
                      {demandForecast.demand_level}
                    </strong>
                    <div className="demand-bar">
                      <div
                        className="demand-progress"
                        style={{ width: `${demandForecast.demand_score}%` }}
                      ></div>
                    </div>
                    <p>
                      Model confidence: <b>{demandForecast.confidence}%</b>
                    </p>
                    <small>{demandForecast.model} · YOLO person-count proxy</small>
                  </div>

                  <div className="recommendation">
                    <h3>Fleet recommendation</h3>
                    <strong>{demandForecast.recommendation}</strong>
                  </div>
                </>
              ) : (
                <div className="inline-error">
                  <span>!</span>
                  <div>
                    <strong>
                      {demandStatus === "offline"
                        ? "Demand service is not connected"
                        : "Collecting enough history for a trustworthy forecast"}
                    </strong>
                    <p>
                      {demandStatus === "offline"
                        ? "The Hugging Face API did not return demand data."
                        : demandForecast?.message ?? "Waiting for the demand API…"}
                    </p>
                    {demandForecast?.data_quality && (
                      <small>
                        {demandForecast.data_quality.raw_frames} frames ·{" "}
                        {demandForecast.data_quality.minute_buckets} minute buckets ·{" "}
                        {demandForecast.data_quality.buses_observed} bus
                        {demandForecast.data_quality.buses_observed === 1 ? "" : "es"}
                      </small>
                    )}
                  </div>
                </div>
              )}

              <h2 style={{ marginTop: "30px" }}>Route-wise model status</h2>
              <div className="route-demand">
                {(demandForecast?.routes ?? []).map((route) => (
                  <div className="demand-route" key={`${route.bus_id}-${route.route_id}`}>
                    <span>{route.route_id} · {route.bus_id}</span>
                    <strong>
                      {route.status === "live"
                        ? `${route.demand_score}%`
                        : `${route.observations} samples`}
                    </strong>
                  </div>
                ))}
              </div>

              <p className="prediction-disclaimer">
                This is a demand proxy from camera person counts, not ticketing or boarding data.
                The model refuses to forecast stale or too-short datasets.
              </p>
            </section>

          </>
        )}
       
       {activePage === "Traffic Simulator" && (
  <>
    <h2 className="page-title">
      🚦 What-If Traffic Simulator
    </h2>

    <section className="section-card">
      <h2>🔮 Simulate Traffic Changes</h2>

      <p>
        See how changing vehicle volume could affect Hyderabad traffic.
      </p>

      <div className="route-card">
        <div>
          <h3>🚗 Simulated Vehicles</h3>

          <input
            type="range"
            min="10"
            max="150"
            value={simulatedVehicles}
            onChange={(e) =>
              setSimulatedVehicles(Number(e.target.value))
            }
          />

          <p>
            <strong>{simulatedVehicles}</strong> vehicles
          </p>
        </div>
      </div>

      <button
        className="primary-button"
        onClick={runTrafficSimulation}
        disabled={!trafficIsLive || simulationStatus === "loading"}
      >
        {simulationStatus === "loading" ? "Running…" : "🚦 Run Simulation"}
      </button>

      {!trafficIsLive && (
        <div className="inline-error">
          <span>!</span>
          <div>
            <strong>Live traffic baseline unavailable</strong>
            <p>The simulator is disabled until TomTom reconnects.</p>
          </div>
        </div>
      )}

      {simulationResult?.error && (
        <div className="inline-error">
          <span>!</span>
          <div>
            <strong>Simulation is collecting real density data</strong>
            <p>{simulationResult.error}</p>
          </div>
        </div>
      )}

      {simulationResult && !simulationResult.error && (
        <div className="route-card">
          <div className="route-icon">📊</div>

          <div>
            <h3>Current vs Predicted Traffic</h3>

            <p style={{ fontSize: "18px" }}>
              📍 Current Score:{" "}
              <strong>
                {simulationResult.current_score}/100
              </strong>
            </p>

            <p style={{ fontSize: "18px" }}>
              🔮 Predicted Score:{" "}
              <strong>
                {simulationResult.score}/100
              </strong>{" "}
              {simulationResult.score >
              simulationResult.current_score
                ? "🔺"
                : simulationResult.score <
                  simulationResult.current_score
                ? "🔻"
                : "➡️"}
            </p>

            <p style={{ fontSize: "18px" }}>
              🚦 Traffic Change:{" "}
              <strong
                style={{
                  color:
                    simulationResult.score >
                    simulationResult.current_score
                      ? "#ef4444"
                      : simulationResult.score <
                        simulationResult.current_score
                      ? "#22c55e"
                      : "#f59e0b"
                }}
              >
                {simulationResult.score >
                simulationResult.current_score
                  ? "🔴 Increased"
                  : simulationResult.score <
                    simulationResult.current_score
                  ? "🟢 Improved"
                  : "🟡 No Change"}
              </strong>
            </p>

            <p style={{ fontSize: "18px" }}>
              📈 Predicted Level:{" "}
              <strong>{simulationResult.level}</strong>
            </p>

            <small>
              🚗 Scenario: {simulationResult.vehicles} vehicles · observed baseline{" "}
              {simulationResult.baseline_vehicle_count}
            </small>
          </div>
        </div>
      )}
    </section>
  </>
)}
        {/* ================= ROUTES ================= */}

        {activePage === "Routes" && (
          <>
            <h2 className="page-title">
              Routes
            </h2>

            <section className="section-card">

              <h2>
                🗺️ Transport Routes
              </h2>

              <p>
                Available public transport routes
              </p>

              <div className="route-list">

                {routes.length === 0 && (
                  <div className="route-card">
                    <div className="route-icon">🗺️</div>
                    <div>
                      <h3>No routes configured</h3>
                      <p>The route catalog is empty or offline.</p>
                    </div>
                    <span className="badge">EMPTY</span>
                  </div>
                )}

                {routes.map((item) => (
                  <div
                    className="route-card"
                    key={item.route_id}
                  >

                    <div className="route-icon">
                      🗺️
                    </div>

                    <div>
                      <h3>
                        {item.name}
                      </h3>

                      <p>
                        {item.origin && item.destination
                          ? `${item.origin} → ${item.destination}`
                          : item.route_id}
                      </p>
                      <small>
                        {item.congestion_score !== null
                          ? `Traffic ${item.congestion_score}/100`
                          : "Waiting for route conditions"}
                      </small>
                    </div>

                    <span className={getStatusClass(item.condition_status)}>
                      {item.condition_status}
                    </span>

                  </div>
                ))}

              </div>

           </section>

            {/* SMART ROUTE RECOMMENDATION */}

            <section className="section-card">

              <h2>
                🧠 Smart Route Recommendation
              </h2>

              <p>
                AI recommends the best route using traffic,
                potholes and road conditions.
              </p>

              {routeData?.status === "live" && routeData.recommended ? (
                <div className="route-card">
                  <div className="route-icon">🧠</div>
                  <div>
                    <h3>{routeData.recommended.name}</h3>
                    <p>Route score: {routeData.recommended.score}/100</p>
                    <small>
                      {routeData.recommended.pothole_count} potholes ·{" "}
                      {routeData.recommended.waterlogging_count} waterlogging events
                    </small>
                  </div>
                  <span className="badge green">RECOMMENDED</span>
                </div>
              ) : (
                <div className="inline-error">
                  <span>!</span>
                  <div>
                    <strong>Recommendation is collecting real route signals</strong>
                    <p>
                      {routeData?.message ??
                        "The route API is connecting to Supabase."}
                    </p>
                  </div>
                </div>
              )}

              <button
                className="primary-button"
                onClick={() =>
                  fetchRoutesData()
                    .then(setRouteData)
                    .catch(() => setRouteData({ status: "offline", routes: [] }))
                }
              >
                Refresh Route Signals
              </button>

            </section>

          </>
        )}

        {/* ================= ALERTS ================= */}

        {activePage === "Alerts" && (
          <>
            <h2 className="page-title">
              Alerts
            </h2>

            <section className="section-card">

              <div className="section-header">

                <div>
                  <h2>
                    🔔 AI Transport Alerts
                  </h2>

                  <p>
                    Automatically generated system
                    notifications
                  </p>
                </div>

                <span className="alert-total">
                  {activeAlertCount} Active Alerts
              </span>
              </div>

              {highDemandBuses.map((bus) => (
                <div className="alert-card red-alert" key={`demand-${bus.id}`}>
                  <span className="alert-icon">🔴</span>
                  <div>
                    <h3>High Passenger Demand</h3>
                    <p>
                      {bus.id} on <strong>{bus.route_name}</strong> has a{" "}
                      {bus.demand.demand_score}% demand score.
                    </p>
                    <small>
                      🤖 AI Recommendation: Increase capacity on this route.
                    </small>
                  </div>
                </div>
              ))}

              {delayedBuses.map((bus) => (
                <div className="alert-card yellow-alert" key={`delay-${bus.id}`}>
                  <span className="alert-icon">🟡</span>
                  <div>
                    <h3>Bus Delay Detected</h3>
                    <p>
                      {bus.id} on <strong>{bus.route_name}</strong> is delayed.
                    </p>
                    <small>
                      🤖 AI Recommendation: Monitor and adjust fleet scheduling.
                    </small>
                  </div>
                </div>
              ))}

              {alerts.length === 0 &&
                highDemandBuses.length === 0 &&
                delayedBuses.length === 0 && (
                  <div className="route-card">
                    <div className="route-icon">🔔</div>
                    <div>
                      <h3>No active alerts</h3>
                      <p>No alert rows or derived fleet alerts are currently active.</p>
                    </div>
                    <span className="badge green">CLEAR</span>
                  </div>
                )}

{/* BACKEND AI ALERTS */}

{alerts.map((alert) => (
  <div
    className={`alert-card ${
      String(alert.severity).toUpperCase() === "HIGH"
        ? "red-alert"
        : "yellow-alert"
    }`}
    key={alert.id}
  >
    <span className="alert-icon">
      {alert.type === "Pothole" ? "🕳️" : "🗑️"}
    </span>

    <div>
      <h3>
        {alert.title || `${alert.type} Detected`}
      </h3>

      <p>
        {alert.message}
      </p>

      <small>
        📍 {alert.location}
      </small>

      {alert.recommendation && (
        <small>🤖 AI Recommendation: {alert.recommendation}</small>
      )}

      <small>
        🕒 {alert.timestamp
          ? new Date(alert.timestamp).toLocaleString()
          : "Timestamp unavailable"}
      </small>
    </div>
  </div>
))}

              {/* SYSTEM STATUS */}

              <div
                className={`alert-card ${
                  overview?.status === "operational"
                    ? "green-alert"
                    : "yellow-alert"
                }`}
              >

                <span className="alert-icon">
                  🟢
                </span>

                <div>

                  <h3>
                    {overview?.status === "operational"
                      ? "System Operational"
                      : "System Degraded"}
                  </h3>

                  <p>
                    {overview?.status === "operational"
                      ? "AI fleet monitoring and prediction services are active."
                      : "One or more live data services need attention."}
                  </p>

                  <small>
                    {overview
                      ? Object.entries(overview.services)
                          .map(([name, status]) => `${name}: ${status}`)
                          .join(" · ")
                      : "Checking service freshness…"}
                  </small>

                </div>

              </div>

            </section>

          </>
        )}
        {activePage === "Fitness & Sports" && (
  <>
    <h2 className="page-title">
      Fitness & Sports
    </h2>

    <section className="section-card">

      <h2>
        🏃 AI Fitness & Safe Route
      </h2>

      <p>
        {trafficIsLive
          ? `Live TomTom feed • ${trafficData.congestion_level} congestion in ${trafficData.city}`
          : trafficStatus === "offline"
            ? "Traffic feed offline — recommendations resume once the TomTom feed reconnects."
            : "Connecting to the live Hyderabad traffic feed…"}
      </p>

      <div className="route-list">
        {fitnessData?.routes?.length ? (
          fitnessData.routes.map((route) => (
            <div className="route-card" key={route.route_code}>
              <div className="route-icon">
                {{
                  walking: "🚶",
                  jogging: "🏃",
                  cycling: "🚴",
                }[route.activity_type] ?? "🏃"}
              </div>

              <div>
                <h3>{route.name}</h3>
                <p>
                  {route.distance_km
                    ? `${route.distance_km} km`
                    : "Distance pending"}
                  {route.duration_minutes
                    ? ` • Approx. ${route.duration_minutes} min`
                    : ""}
                </p>
                <small>
                  {route.congestion_score !== null
                    ? `Traffic Score: ${route.congestion_score}/100`
                    : "Live traffic overlay unavailable"}
                </small>
              </div>

              <span
                className={
                  route.safety === "SAFE"
                    ? "badge green"
                    : route.safety === "CAUTION"
                      ? "badge red"
                      : "badge"
                }
              >
                {route.safety}
              </span>
            </div>
          ))
        ) : (
          <div className="route-card">
            <div className="route-icon">📍</div>
            <div>
              <h3>No verified fitness routes configured</h3>
              <p>
                Add verified routes in Supabase to enable live safety overlays.
              </p>
            </div>
            <span className="badge">EMPTY</span>
          </div>
        )}

      </div>

    </section>

    {/* LIVE FITNESS STATUS */}

    <section className="section-card">

      <h2>
        📡 Live Fitness Environment
      </h2>

      <div className="route-list">

        <div className="route-card">
          <div className="route-icon">🚦</div>

          <div>
            <h3>Traffic Condition</h3>

            <p>
              {trafficField(trafficData?.congestion_level)}
            </p>
          </div>
        </div>

        <div className="route-card">
  <div className="route-icon">🚗</div>
  <div>
    <h3>Vehicles Detected</h3>
    <p>
      {vehicleCount !== null
        ? `${vehicleCount} vehicles detected by AI`
        : "Capture a frame to detect vehicles"}
    </p>
  </div>
  </div>

        <div className="route-card">
          <div className="route-icon">⚡</div>

          <div>
            <h3>Traffic Score</h3>

            <p>
              {trafficIsLive &&
              typeof trafficData.congestion_score === "number"
                ? `${trafficData.congestion_score.toFixed(2)}/100`
                : trafficField(null)}
            </p>
          </div>
        </div>

      </div>

    </section>

    {/* SUPABASE-BACKED HISTORY + LIVE FEED */}

    {supabaseEnabled && (
      <section className="section-card">

        <h2>
          🛰️ Environment History (Supabase Realtime)
        </h2>

        <p>
          {trafficHistory.length > 0
            ? `${trafficHistory.length} stored snapshots • newest first refreshes every minute`
            : "Collecting the first snapshots — one is stored every minute."}
        </p>

        <div className="route-list">

          {trafficHistory.slice(-4).reverse().map((snapshot) => (
            <div className="route-card" key={snapshot.captured_at}>
              <div className="route-icon">📈</div>

              <div>
                <h3>{snapshot.congestion_level}</h3>
                <p>
                  {snapshot.current_speed} km/h •{" "}
                  {Number(snapshot.congestion_score).toFixed(1)}/100
                </p>
                <small>
                  {new Date(snapshot.captured_at).toLocaleTimeString()}
                </small>
              </div>
            </div>
          ))}

        </div>

        <h2>
          🔔 Live AI Detection Feed
        </h2>

        <div className="route-list">

          {liveDetections.length === 0 ? (
            <div className="route-card">
              <div className="route-icon">🤖</div>
              <div>
                <h3>No detections yet</h3>
                <p>Run a pothole, garbage or vehicle scan to populate the feed.</p>
              </div>
            </div>
          ) : (
            liveDetections.map((detection) => (
              <div className="route-card" key={detection.id}>
                <div className="route-icon">
                  {detection.kind === "pothole"
                    ? "🕳️"
                    : detection.kind === "garbage"
                      ? "🗑️"
                      : "🚗"}
                </div>

                <div>
                  <h3>
                    {detection.count} {detection.kind}
                    {detection.count === 1 ? "" : "s"}
                  </h3>
                  <p>
                    {detection.confidence
                      ? `${Number(detection.confidence).toFixed(1)}% confidence`
                      : "AI detection"}
                  </p>
                  <small>
                    {new Date(detection.detected_at).toLocaleTimeString()}
                  </small>
                </div>
              </div>
            ))
          )}

        </div>

      </section>
    )}

    {/* SPORTS FACILITIES */}

    <section className="section-card">

      <h2>
        ⚽ Verified Sports Facilities
      </h2>

      <div className="route-list">
        {fitnessData?.facilities?.length ? (
          fitnessData.facilities.map((facility) => (
            <div className="route-card" key={facility.facility_code}>
              <div className="route-icon">🏟️</div>
              <div>
                <h3>{facility.name}</h3>
                <p>
                  {facility.activities.length
                    ? facility.activities.join(" & ")
                    : facility.facility_type}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="route-card">
            <div className="route-icon">🏟️</div>
            <div>
              <h3>No verified facilities configured</h3>
              <p>Only verified Supabase facilities are shown here.</p>
            </div>
            <span className="badge">EMPTY</span>
          </div>
        )}

      </div>

    </section>

  </>
)}

        {activePage === "Road Safety Lab" && (
          <>
            <div className="page-heading">
              <div>
                <span className="eyebrow">FEATURE PREVIEW • IN DEVELOPMENT</span>
                <h2 className="page-title">Road Safety Lab</h2>
                <p>
                  Edge-assisted enforcement for speeding vehicles and
                  low-quality roadside footage.
                </p>
              </div>
              <span className="development-chip">PLANNED</span>
            </div>

            <section className="safety-hero">
              <div>
                <span className="safety-kicker">NEXT-GENERATION ROAD SAFETY</span>
                <h2>From a speeding event to actionable evidence.</h2>
                <p>
                  UrbanIQ will combine speed telemetry, number-plate detection
                  and edge image restoration to produce a reviewable violation
                  package before any alert is issued.
                </p>
              </div>
              <div className="safety-orbit" aria-hidden="true">
                <span>⚡</span>
                <strong>EDGE AI</strong>
                <small>PROCESSING</small>
              </div>
            </section>

            <div className="safety-feature-grid">
              <section className="section-card safety-feature-card">
                <div className="feature-number">01</div>
                <span className="feature-icon">🏎️</span>
                <h2>Rash Driving & Speed Enforcement</h2>
                <p>
                  Detect a speed-limit violation, capture the best frame,
                  isolate the licence plate and prepare a verified alert.
                </p>
                <div className="pipeline-list">
                  <div><span>1</span><p><strong>Detect</strong> Compare measured speed with the road limit.</p></div>
                  <div><span>2</span><p><strong>Capture</strong> Select the clearest frame around the event.</p></div>
                  <div><span>3</span><p><strong>Read</strong> Localise the plate and run OCR with confidence scoring.</p></div>
                  <div><span>4</span><p><strong>Review</strong> Human verification before an alert is sent.</p></div>
                </div>
                <span className="feature-status">MODEL + WORKFLOW IN DEVELOPMENT</span>
              </section>

              <section className="section-card safety-feature-card">
                <div className="feature-number">02</div>
                <span className="feature-icon">✨</span>
                <h2>Edge Image Restoration</h2>
                <p>
                  Improve difficult camera frames on-device before detection,
                  while retaining the original image as evidence.
                </p>
                <div className="enhancement-preview">
                  <div className="preview-frame preview-before">
                    <span>RAW FRAME</span>
                    <strong>TS •• 7B ••••</strong>
                    <small>motion blur · low contrast</small>
                  </div>
                  <div className="preview-arrow">→</div>
                  <div className="preview-frame preview-after">
                    <span>RESTORED</span>
                    <strong>TS 09 EB 4821</strong>
                    <small>sharpened · contrast recovered</small>
                  </div>
                </div>
                <div className="enhancement-tags">
                  <span>Deblur</span>
                  <span>Denoise</span>
                  <span>Low-light recovery</span>
                  <span>Super-resolution</span>
                </div>
                <small className="evidence-note">
                  Restoration assists review; it does not guarantee recovery
                  of details that were never captured.
                </small>
              </section>
            </div>

            <section className="section-card delivery-roadmap">
              <div className="section-header">
                <div>
                  <h2>Delivery Roadmap</h2>
                  <p>Planned safeguards before real-world enforcement.</p>
                </div>
                <span className="development-chip">R&amp;D</span>
              </div>
              <div className="roadmap-steps">
                <div className="roadmap-step active"><span>1</span><strong>Prototype</strong><small>Speed + plate pipeline</small></div>
                <div className="roadmap-step"><span>2</span><strong>Edge validation</strong><small>Night, rain and motion tests</small></div>
                <div className="roadmap-step"><span>3</span><strong>Human review</strong><small>Confidence and evidence checks</small></div>
                <div className="roadmap-step"><span>4</span><strong>Pilot</strong><small>Authority-approved deployment</small></div>
              </div>
            </section>
          </>
        )}

        {/* FOOTER */}

        <footer>
          SIH26124 • AI-Powered Mobile Urban
          Intelligence Platform Using Public
          Transport Fleet
        </footer>

      </main>

    </div>
  );
}

export default App;