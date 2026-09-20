import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

function MapViewport({ positions }) {
  const map = useMap();
  const signature = positions.map((position) => position.join(",")).join("|");

  useEffect(() => {
    if (positions.length === 1) {
      map.setView(positions[0], 13);
    } else if (positions.length > 1) {
      map.fitBounds(positions, { padding: [28, 28], maxZoom: 13 });
    }
  }, [map, signature, positions]);

  return null;
}

export default function LiveMap({
  buses = [],
  telemetryStatus = "loading",
}) {
  const busesWithLocation = buses
    .map((bus) => ({
      ...bus,
      latitude: Number(bus.latitude),
      longitude: Number(bus.longitude),
    }))
    .filter(
      (bus) =>
        Number.isFinite(bus.latitude) &&
        Number.isFinite(bus.longitude) &&
        bus.latitude >= 16.5 &&
        bus.latitude <= 18.5 &&
        bus.longitude >= 77.5 &&
        bus.longitude <= 79.5,
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
        <MapViewport
          positions={busesWithLocation.map((bus) => [
            bus.latitude,
            bus.longitude,
          ])}
        />
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
