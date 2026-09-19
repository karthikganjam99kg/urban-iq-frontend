import { useState,useEffect } from "react";
import LiveMap from "./LiveMap";
import {
  supabaseEnabled,
  recordTrafficSnapshot,
  recordDetection,
  fetchTrafficHistory,
  fetchRecentDetections,
  subscribeToDetections,
} from "./lib/supabase";
import "./App.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV
    ? ""
    : "https://priyaredddy-cse-hyderabad-urban-intelligence-api.hf.space")
).replace(/\/$/, "");
const apiUrl = (path) => `${API_BASE_URL}${path}`;

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [detections, setDetections] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState("");
  const [garbageAlerts, setGarbageAlerts] = useState([]);
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
        recordTrafficSnapshot(data);
      } catch (error) {
        console.error("Traffic API error:", error);
        setTrafficStatus("offline");
      }
    };

    getTrafficData();
    const getAlerts = async () => {
  try {
    const response = await fetch(apiUrl("/api/alerts"));
    const data = await response.json();
    setAlerts(data);
  } catch (error) {
    console.error("Alerts API error:", error);
  }
};

getAlerts();

    const interval = setInterval(getTrafficData, 5000);

    return () => clearInterval(interval);
  }, []);

  // Supabase keeps the history and detection feed alive across devices.
  useEffect(() => {
    if (!supabaseEnabled) return;

    const loadStoredData = async () => {
      const [history, detectionFeed] = await Promise.all([
        fetchTrafficHistory(),
        fetchRecentDetections(),
      ]);
      setTrafficHistory(history);
      setLiveDetections(detectionFeed);
    };

    loadStoredData();

    const unsubscribe = subscribeToDetections((row) => {
      setLiveDetections((current) => [row, ...current].slice(0, 8));
    });

    const historyInterval = setInterval(async () => {
      setTrafficHistory(await fetchTrafficHistory());
    }, 60000);

    return () => {
      unsubscribe();
      clearInterval(historyInterval);
    };
  }, []);
  const trafficIsLive = trafficStatus === "live" && trafficData !== null;

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

  const safetyBadge = () => {
    if (!trafficIsLive) return { label: "NO DATA", className: "badge" };
    return trafficData.congestion_score < 60
      ? { label: "SAFE", className: "badge green" }
      : { label: "CAUTION", className: "badge red" };
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
  { name: "Traffic Simulator", icon: "🚦" },
];

 const buses = [
  {
    id: "HYD-BUS-001",
    route: "Dilsukhnagar → Mehdipatnam",
    passengers: 62,
    status: "On Time",
  },
  {
    id: "HYD-BUS-002",
    route: "Mehdipatnam → Dilsukhnagar",
    passengers: 84,
    status: "Delayed",
  },
  {
    id: "HYD-BUS-003",
    route: "LB Nagar → Secunderabad",
    passengers: 71,
    status: "On Time",
  },
  {
    id: "HYD-BUS-004",
    route: "Secunderabad → LB Nagar",
    passengers: 91,
    status: "Delayed",
  },
  {
    id: "HYD-BUS-005",
    route: "Kukatpally → Ameerpet",
    passengers: 58,
    status: "On Time",
  },
  {
    id: "HYD-BUS-006",
    route: "Ameerpet → Kukatpally",
    passengers: 76,
    status: "On Time",
  },
  {
    id: "HYD-BUS-007",
    route: "Gachibowli → Secunderabad",
    passengers: 88,
    status: "Delayed",
  },
  {
    id: "HYD-BUS-008",
    route: "Secunderabad → Gachibowli",
    passengers: 69,
    status: "On Time",
  },
  {
    id: "HYD-BUS-009",
    route: "Miyapur → Ameerpet",
    passengers: 73,
    status: "On Time",
  },
  {
    id: "HYD-BUS-010",
    route: "Ameerpet → Miyapur",
    passengers: 81,
    status: "Delayed",
  },
  {
    id: "HYD-BUS-011",
    route: "Uppal → Mehdipatnam",
    passengers: 67,
    status: "On Time",
  },
  {
    id: "HYD-BUS-012",
    route: "Mehdipatnam → Uppal",
    passengers: 79,
    status: "On Time",
  },
  {
    id: "HYD-BUS-013",
    route: "Kondapur → Dilsukhnagar",
    passengers: 64,
    status: "On Time",
  },
  {
    id: "HYD-BUS-014",
    route: "Dilsukhnagar → Kondapur",
    passengers: 86,
    status: "Delayed",
  },
  {
    id: "HYD-BUS-015",
    route: "Hitech City → Secunderabad",
    passengers: 93,
    status: "Delayed",
  },
  {
    id: "HYD-BUS-016",
    route: "Secunderabad → Hitech City",
    passengers: 72,
    status: "On Time",
  },
  {
    id: "HYD-BUS-017",
    route: "LB Nagar → Mehdipatnam",
    passengers: 61,
    status: "On Time",
  },
  {
    id: "HYD-BUS-018",
    route: "Mehdipatnam → LB Nagar",
    passengers: 83,
    status: "On Time",
  },
  {
    id: "HYD-BUS-019",
    route: "Kukatpally → Gachibowli",
    passengers: 77,
    status: "Delayed",
  },
  {
    id: "HYD-BUS-020",
    route: "Gachibowli → Kukatpally",
    passengers: 68,
    status: "On Time",
  },
  {
    id: "HYD-BUS-021",
    route: "Uppal → Secunderabad",
    passengers: 55,
    status: "On Time",
  },
  {
    id: "HYD-BUS-022",
    route: "Secunderabad → Uppal",
    passengers: 74,
    status: "On Time",
  },
  {
    id: "HYD-BUS-023",
    route: "Miyapur → Gachibowli",
    passengers: 89,
    status: "Delayed",
  },
  {
    id: "HYD-BUS-024",
    route: "Gachibowli → Miyapur",
    passengers: 63,
    status: "On Time",
  },
  {
    id: "HYD-BUS-025",
    route: "Dilsukhnagar → Hitech City",
    passengers: 69,
    status: "On Time",
  },
];
  const routes = buses.map((bus) => ({
    route: bus.route,
    vehicle: bus.id,
  }));

  const highDemandBuses = buses.filter(
    (bus) => bus.passengers >=80
  );

  const delayedBuses = buses.filter(
    (bus) => bus.status === "Delayed"
  );
  const runTrafficSimulation = () => {
  const currentVehicles = trafficData?.vehicle_count || 50;
  const change = simulatedVehicles - currentVehicles;
  const predictedScore = Math.max(
    0,
    Math.min(100, (trafficData?.congestion_score || 50) + change * 0.5)
  );

  setSimulationResult({
    vehicles: simulatedVehicles,
    score: Math.round(predictedScore),
    level:
      predictedScore < 30
        ? "Low"
        : predictedScore < 60
        ? "Moderate"
        : predictedScore < 80
        ? "High"
        : "Severe",
  });
};

  const getStatusClass = (status) => {
    if (status === "Delayed") return "badge yellow";
    if (status === "High Demand") return "badge red";
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
                  {highDemandBuses.length + delayedBuses.length}
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
              All systems operational
            </div>
            <span className="command-location">📍 Hyderabad, IN</span>
          </div>

        </header>

     {/* ================= DASHBOARD ================= */}

{activePage === "Dashboard" && (
  <>
    <section className="command-strip">
      <div>
        <span className="eyebrow">CITY OPERATIONS · LIVE</span>
        <h2>One city. One intelligent control layer.</h2>
        <p>Combining fleet telemetry, computer vision and real-time traffic intelligence.</p>
      </div>
      <div className="command-strip-metrics">
        <span><b>04</b> AI engines</span>
        <span><b>25</b> connected assets</span>
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
        <h2>25</h2>
      </div>

      <div className="stat-card">
        <span>🟢</span>
        <p>Active Buses</p>
        <h2>19</h2>
      </div>

      <div className="stat-card">
        <span>🟡</span>
        <p>Delayed</p>
        <h2>{delayedBuses.length}</h2>
      </div>

      <div className="stat-card">
        <span>🔴</span>
        <p>High Demand</p>
        <h2>{highDemandBuses.length}</h2>
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
              {bus.route}
            </p>

            <strong>
              Passengers {bus.passengers}
            </strong>

            <span
              className={getStatusClass(bus.status)}
            >
              {bus.status}
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
        Passenger demand forecast
      </p>

      <div className="prediction-box">

        <span>
          Next Hour Predicted Demand
        </span>

        <h1>
          91 passengers
        </h1>

        <strong>
          HIGH
        </strong>

        <div className="recommendation">

          💡 <b>AI Recommendation</b>

          <br />

          Consider adding an extra bus
          during peak hours.

        </div>

      </div>

    </section>

  </>
)}
           
        {/* ================= LIVE FLEET ================= */}

        {activePage === "Live Fleet" && (
          <>
            <h2 className="page-title">
              Live Fleet
            </h2>

            <section className="section-card">

              <h2>
                🚌 Live Fleet Monitoring
              </h2>

              <p>
                All currently monitored public
                transport vehicles
              </p>

              <div className="bus-grid">

                {buses.map((bus) => (
                  <div
                    className="bus-card"
                    key={bus.id}
                  >

                    <div className="bus-icon">
                      🚌
                    </div>

                    <h3>{bus.id}</h3>

                    <p>{bus.route}</p>

                    <strong>
                      Passengers {bus.passengers}
                    </strong>

                    <span
                      className={getStatusClass(bus.status)}
                    >
                      {bus.status}
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

              <LiveMap />

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
      <span className="model-chip">YOLO · ACTIVE</span>
    </div>

    <section className="section-card detector-shell">
      <div className="detector-intro">
        <div className="detector-icon">⌖</div>
        <div>
          <h2>Analyse road imagery</h2>
          <p>JPG, PNG or WEBP · Maximum accuracy with clear road-level images</p>
        </div>
      </div>

      <label className={`upload-zone ${isDetecting ? "is-loading" : ""}`}>
        <input
          type="file"
          accept="image/*"
          disabled={isDetecting}
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

            setDetections([]);
            setDetectionError(
              "The AI service could not process this image. Please verify the backend connection and try again."
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
                <strong>{detections.length === 0 ? "LOW" : detections.length >= 3 ? "HIGH" : "MODERATE"}</strong>
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
      const newGarbageAlert = {
        id: Date.now(),
        type: "GARBAGE",
        message:
          `🗑️ Garbage detected by camera. ` +
          `${garbageData.detections.length} waste object(s) found.`,
        time: new Date().toLocaleTimeString(),
      };

      setGarbageAlerts((previousAlerts) => [
        newGarbageAlert,
        ...previousAlerts,
      ]);

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
            <h2 className="page-title">
              AI Prediction
            </h2>

            <section className="section-card">

              <h2>
                🤖 AI Demand Prediction
              </h2>

              <p>
                AI-based passenger demand analysis
              </p>

              <div className="prediction-box">

                <span>
                  Predicted passenger demand
                  for next hour
                </span>

                <h1>
                  91 passengers
                </h1>

                <p>
                  Demand Level
                </p>

                <strong className="demand-high">
                  HIGH
                </strong>

                <div className="demand-bar">
                  <div
                    className="demand-progress"
                    style={{ width: "91%" }}
                  ></div>
                </div>

                <p>
                  Demand confidence: <b>91%</b>
                </p>

              </div>

              {/* AI RECOMMENDATION */}

              <div className="recommendation">

                💡

                <h3>
                  AI Recommendation
                </h3>

                <p>
                  Passenger demand is expected
                  to remain high during the next hour.
                </p>

                <strong>
                  ⚠️ Increase fleet capacity on
                  high-demand routes.
                </strong>

              </div>

              {/* ROUTE DEMAND */}

              <h2 style={{ marginTop: "30px" }}>
                📊 Route-wise Demand
              </h2>
<div className="route-demand">

  <div className="demand-route">
    <span>Dilsukhnagar → Mehdipatnam</span>
    <strong>72%</strong>
  </div>

  <div className="demand-route">
    <span>Mehdipatnam → Dilsukhnagar</span>
    <strong>84%</strong>
  </div>

  <div className="demand-route">
    <span>LB Nagar → Secunderabad</span>
    <strong>90%</strong>
  </div>

  <div className="demand-route">
    <span>Kukatpally → Ameerpet</span>
    <strong>76%</strong>
  </div>

  <div className="demand-route">
    <span>Gachibowli → Secunderabad</span>
    <strong>88%</strong>
  </div>

</div>
              
              <div className="peak-warning">

                🔴 <b>Peak Demand Warning</b>

                <p>
                  High passenger demand detected.
                  Additional buses are recommended
                  for selected routes.
                </p>

              </div>

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
      >
        🚦 Run Simulation
      </button>

      {simulationResult && (
        <div className="route-card">
          <div className="route-icon">📊</div>

          <div>
            <h3>Current vs Predicted Traffic</h3>

            <p style={{ fontSize: "18px" }}>
              📍 Current Score:{" "}
              <strong>
                {trafficData?.congestion_score ?? "N/A"}/100
              </strong>
            </p>

            <p style={{ fontSize: "18px" }}>
              🔮 Predicted Score:{" "}
              <strong>
                {simulationResult.score}/100
              </strong>{" "}
              {simulationResult.score >
              (trafficData?.congestion_score ?? 0)
                ? "🔺"
                : simulationResult.score <
                  (trafficData?.congestion_score ?? 0)
                ? "🔻"
                : "➡️"}
            </p>

            <p style={{ fontSize: "18px" }}>
              🚦 Traffic Change:{" "}
              <strong
                style={{
                  color:
                    simulationResult.score >
                    (trafficData?.congestion_score ?? 0)
                      ? "#ef4444"
                      : simulationResult.score <
                        (trafficData?.congestion_score ?? 0)
                      ? "#22c55e"
                      : "#f59e0b"
                }}
              >
                {simulationResult.score >
                (trafficData?.congestion_score ?? 0)
                  ? "🔴 Increased"
                  : simulationResult.score <
                    (trafficData?.congestion_score ?? 0)
                  ? "🟢 Improved"
                  : "🟡 No Change"}
              </strong>
            </p>

            <p style={{ fontSize: "18px" }}>
              📈 Predicted Level:{" "}
              <strong>{simulationResult.level}</strong>
            </p>

            <small>
              🚗 Scenario: {simulationResult.vehicles} simulated vehicles
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

                {routes.map((item, index) => (
                  <div
                    className="route-card"
                    key={index}
                  >

                    <div className="route-icon">
                      🗺️
                    </div>

                    <div>
                      <h3>
                        {item.route}
                      </h3>

                      <p>
                        Vehicle: {item.vehicle}
                      </p>
                    </div>

                    <span className="badge green">
                      ACTIVE
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

              <button
                className="primary-button"
                onClick={async () => {
                const trafficResponse = await fetch(
                 apiUrl("/api/traffic")
                );

                 const trafficData = await trafficResponse.json();

                 console.log("Live Traffic Data:", trafficData);
                  const routes = [
               {
                       name: "Dilsukhnagar → Mehdipatnam",
                       traffic: trafficData.congestion_score + 8,
                       potholes: 2,
                        waterlogging: 1
                },
               {
                         name: "LB Nagar → Secunderabad",
                        traffic: trafficData.congestion_score + 15,
                         potholes: 4,
                        waterlogging: 2
                 },
                {
                          name: "Kukatpally → Ameerpet",
                           traffic: trafficData.congestion_score - 5,
                           potholes: 1,
                           waterlogging: 0
                 }
                ];
                  const scoredRoutes = routes.map((route) => {

                    const score =
                      route.traffic +
                      (detections.length * 10) +
                        (route.waterlogging * 15);
                    return {
                      ...route,
                      score
                    };

                  });

                  scoredRoutes.sort(
                    (a, b) => a.score - b.score
                  );

                  alert(
                    `Recommended Route:\n\n${scoredRoutes[0].name}\n\nRoute Score: ${scoredRoutes[0].score}\n\nLower score = better route`
                  );

                }}
              >
                🧠 Find Best Route
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
                 {highDemandBuses.length +
                   delayedBuses.length +
                   alerts.length} Active 
               Alerts
              </span>
              </div>

              {/* AI HIGH DEMAND ALERTS */}

              {highDemandBuses.map((bus) => (
                <div
                  className="alert-card red-alert"
                  key={bus.id}
                >

                  <span className="alert-icon">
                    🔴
                  </span>

                  <div>

                    <h3>
                      High Passenger Demand
                    </h3>

                    <p>
                      {bus.id} on{" "}
                      <strong>
                        {bus.route}
                      </strong>{" "}
                      has {bus.passengers} passengers.
                    </p>

                    <small>
                      🤖 AI Recommendation:
                      Add an additional bus to
                      this route.
                    </small>

                  </div>

                </div>
              ))}

              {/* DELAY ALERTS */}

              {delayedBuses.map((bus) => (
                <div
                  className="alert-card yellow-alert"
                  key={bus.id}
                >

                  <span className="alert-icon">
                    🟡
                  </span>

                  <div>

                    <h3>
                      Bus Delay Detected
                    </h3>

                    <p>
                      {bus.id} on{" "}
                      <strong>
                        {bus.route}
                      </strong>{" "}
                      is currently delayed.
                    </p>

                    <small>
                      🤖 AI Recommendation:
                      Monitor route and adjust
                      fleet scheduling.
                    </small>

                  </div>

                </div>
              ))}
{/* GARBAGE AI ALERTS */}

{garbageAlerts.map((alert) => (
  <div
    className="alert-card yellow-alert"
    key={alert.id}
  >

    <span className="alert-icon">
      🗑️
    </span>

    <div>

      <h3>
        Garbage Detected
      </h3>

      <p>
        {alert.message}
      </p>

      <small>
        🤖 AI Recommendation:
        Schedule cleaning for the detected area.
      </small>

      <small>
        🕒 {alert.time}
      </small>

    </div>

  </div>
))}
{/* BACKEND AI ALERTS */}

{alerts.map((alert) => (
  <div
    className="alert-card yellow-alert"
    key={alert.id}
  >
    <span className="alert-icon">
      {alert.type === "Pothole" ? "🕳️" : "🗑️"}
    </span>

    <div>
      <h3>
        {alert.type} Detected
      </h3>

      <p>
        {alert.message}
      </p>

      <small>
        📍 {alert.location}
      </small>

      <small>
        🕒 {new Date(alert.timestamp).toLocaleString()}
      </small>
    </div>
  </div>
))}

              {/* SYSTEM STATUS */}

              <div className="alert-card green-alert">

                <span className="alert-icon">
                  🟢
                </span>

                <div>

                  <h3>
                    System Operational
                  </h3>

                  <p>
                    AI fleet monitoring and
                    prediction services are active.
                  </p>

                  <small>
                    ✅ All monitoring services
                    are running normally.
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

        {/* WALKING */}

        <div className="route-card">
          <div className="route-icon">🚶</div>

          <div>
            <h3>Walking Route</h3>

            <p>
              2.4 km • Approx. 30 min
            </p>

            <small>
              Traffic: {trafficField(trafficData?.congestion_level)}
            </small>
          </div>

          <span className={safetyBadge().className}>
            {safetyBadge().label}
          </span>
        </div>

        {/* JOGGING */}

        <div className="route-card">
          <div className="route-icon">🏃</div>

          <div>
            <h3>Jogging Route</h3>

            <p>
              3.2 km • Live Traffic Based
            </p>

            <small>
              Traffic Score: {trafficField(trafficData?.congestion_score)}
            </small>
          </div>

          <span className={safetyBadge().className}>
            {safetyBadge().label}
          </span>
        </div>

        {/* CYCLING */}

        <div className="route-card">
          <div className="route-icon">🚴</div>

          <div>
            <h3>Cycling Route</h3>

            <p>
              4.1 km • Live Road Analysis
            </p>

            <small>
              Current Speed: {trafficField(trafficData?.current_speed, " km/h")}
            </small>
          </div>

          <span className={safetyBadge().className}>
            {safetyBadge().label}
          </span>
        </div>

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
        ⚽ Nearby Sports Facilities
      </h2>

      <div className="route-list">

        <div className="route-card">

          <div className="route-icon">
            🌳
          </div>

          <div>
            <h3>Public Park</h3>
            <p>Walking & Jogging</p>
          </div>

        </div>

        <div className="route-card">

          <div className="route-icon">
            🏟️
          </div>

          <div>
            <h3>Sports Ground</h3>
            <p>Outdoor Sports</p>
          </div>

        </div>

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