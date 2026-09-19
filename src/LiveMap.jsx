import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function LiveMap({ buses = [], telemetryStatus = "loading" }) {
  const busesWithLocation = buses.filter(
    (bus) =>
      typeof bus.latitude === "number" && typeof bus.longitude === "number"
  );

  if (busesWithLocation.length === 0) {
    return (
      <div className="inline-error" style={{ marginTop: "20px" }}>
        <span>!</span>
        <div>
          <strong>Fleet locations unavailable</strong>
          <p>No bus coordinates were returned by the Supabase fleet endpoint.</p>
        </div>
      </div>
    );
  }

  const center = [
    busesWithLocation.reduce((sum, bus) => sum + bus.latitude, 0) /
      busesWithLocation.length,
    busesWithLocation.reduce((sum, bus) => sum + bus.longitude, 0) /
      busesWithLocation.length,
  ];

  return (
    <div style={{ marginTop: "20px" }}>
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom
        style={{
          height: "550px",
          width: "100%",
          borderRadius: "15px",
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {busesWithLocation.map((bus) => (
          <Marker key={bus.id} position={[bus.latitude, bus.longitude]}>
            <Popup>
              <div style={{ minWidth: "190px" }}>
                <h3 style={{ marginBottom: "8px" }}>🚌 {bus.id}</h3>
                <p>
                  <b>Route:</b> {bus.route_name}
                </p>
                <p>
                  <b>Speed:</b> {bus.speed ?? "—"} km/h
                </p>
                <p>
                  <b>Operational status:</b> {bus.operational_status}
                </p>
                <p>
                  <b>Telemetry:</b> {bus.telemetry_status}
                </p>
                <small>Recorded {bus.recorded_at ?? "at an unknown time"}</small>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div
        style={{
          marginTop: "12px",
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          fontSize: "13px",
        }}
      >
        <span>🟢 Live: update within 5 minutes</span>
        <span>🟡 Stale: last update older than 5 minutes</span>
        <span>⚪ Missing: no GPS observation yet</span>
        <span>Feed status: {telemetryStatus}</span>
      </div>
    </div>
  );
}

export default LiveMap;
