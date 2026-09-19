import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

function LiveMap() {
const buses = [
  { id: "HYD-BUS-001", route: "Dilsukhnagar → Mehdipatnam", position: [17.3688, 78.5247], passengers: 62, status: "On Time" },
  { id: "HYD-BUS-002", route: "Mehdipatnam → Dilsukhnagar", position: [17.3963, 78.4406], passengers: 84, status: "Delayed" },
  { id: "HYD-BUS-003", route: "LB Nagar → Secunderabad", position: [17.3457, 78.5522], passengers: 71, status: "On Time" },
  { id: "HYD-BUS-004", route: "Secunderabad → LB Nagar", position: [17.4399, 78.4983], passengers: 91, status: "Delayed" },
  { id: "HYD-BUS-005", route: "Kukatpally → Ameerpet", position: [17.4849, 78.4138], passengers: 58, status: "On Time" },
  { id: "HYD-BUS-006", route: "Ameerpet → Kukatpally", position: [17.4375, 78.4483], passengers: 76, status: "On Time" },
  { id: "HYD-BUS-007", route: "Gachibowli → Secunderabad", position: [17.4401, 78.3489], passengers: 88, status: "Delayed" },
  { id: "HYD-BUS-008", route: "Secunderabad → Gachibowli", position: [17.4399, 78.4983], passengers: 69, status: "On Time" },
  { id: "HYD-BUS-009", route: "Miyapur → Ameerpet", position: [17.4969, 78.3498], passengers: 73, status: "On Time" },
  { id: "HYD-BUS-010", route: "Ameerpet → Miyapur", position: [17.4375, 78.4483], passengers: 81, status: "Delayed" },
  { id: "HYD-BUS-011", route: "Uppal → Mehdipatnam", position: [17.4065, 78.5591], passengers: 67, status: "On Time" },
  { id: "HYD-BUS-012", route: "Mehdipatnam → Uppal", position: [17.3963, 78.4406], passengers: 79, status: "On Time" },
  { id: "HYD-BUS-013", route: "Kondapur → Dilsukhnagar", position: [17.4584, 78.3732], passengers: 64, status: "On Time" },
  { id: "HYD-BUS-014", route: "Dilsukhnagar → Kondapur", position: [17.3688, 78.5247], passengers: 86, status: "Delayed" },
  { id: "HYD-BUS-015", route: "Hitech City → Secunderabad", position: [17.4483, 78.3915], passengers: 93, status: "Delayed" },
  { id: "HYD-BUS-016", route: "Secunderabad → Hitech City", position: [17.4399, 78.4983], passengers: 72, status: "On Time" },
  { id: "HYD-BUS-017", route: "LB Nagar → Mehdipatnam", position: [17.3457, 78.5522], passengers: 61, status: "On Time" },
  { id: "HYD-BUS-018", route: "Mehdipatnam → LB Nagar", position: [17.3963, 78.4406], passengers: 83, status: "On Time" },
  { id: "HYD-BUS-019", route: "Kukatpally → Gachibowli", position: [17.4849, 78.4138], passengers: 77, status: "Delayed" },
  { id: "HYD-BUS-020", route: "Gachibowli → Kukatpally", position: [17.4401, 78.3489], passengers: 68, status: "On Time" },
  { id: "HYD-BUS-021", route: "Uppal → Secunderabad", position: [17.4065, 78.5591], passengers: 55, status: "On Time" },
  { id: "HYD-BUS-022", route: "Secunderabad → Uppal", position: [17.4399, 78.4983], passengers: 74, status: "On Time" },
  { id: "HYD-BUS-023", route: "Miyapur → Gachibowli", position: [17.4969, 78.3498], passengers: 89, status: "Delayed" },
  { id: "HYD-BUS-024", route: "Gachibowli → Miyapur", position: [17.4401, 78.3489], passengers: 63, status: "On Time" },
  { id: "HYD-BUS-025", route: "Dilsukhnagar → Hitech City", position: [17.3688, 78.5247], passengers: 69, status: "On Time" },
];
const routes = [
  {
    name: "Dilsukhnagar → Mehdipatnam",
    line: [
      [17.3688, 78.5247],
      [17.3850, 78.5000],
      [17.3963, 78.4406],
    ],
  },
  {
    name: "LB Nagar → Secunderabad",
    line: [
      [17.3457, 78.5522],
      [17.3900, 78.5300],
      [17.4399, 78.4983],
    ],
  },
  {
    name: "Kukatpally → Ameerpet",
    line: [
      [17.4849, 78.4138],
      [17.4600, 78.4400],
      [17.4375, 78.4483],
    ],
  },
  {
    name: "Gachibowli → Secunderabad",
    line: [
      [17.4401, 78.3489],
      [17.4500, 78.3900],
      [17.4399, 78.4983],
    ],
  },
  {
    name: "Miyapur → Ameerpet",
    line: [
      [17.4969, 78.3498],
      [17.4700, 78.4000],
      [17.4375, 78.4483],
    ],
  },
  {
    name: "Uppal → Mehdipatnam",
    line: [
      [17.4065, 78.5591],
      [17.4200, 78.5200],
      [17.3963, 78.4406],
    ],
  },
  {
    name: "Kondapur → Dilsukhnagar",
    line: [
      [17.4584, 78.3732],
      [17.4300, 78.4500],
      [17.3688, 78.5247],
    ],
  },
  {
    name: "Hitech City → Secunderabad",
    line: [
      [17.4483, 78.3915],
      [17.4450, 78.4400],
      [17.4399, 78.4983],
    ],
  },
];
  

  const getStatusEmoji = (status) => {
    if (status === "High Demand") return "🔴";
    if (status === "Delayed") return "🟡";
    return "🟢";
  };

  return (
    <div style={{ marginTop: "20px" }}>

      <MapContainer
        center={[17.3805, 78.4867]}
        zoom={12}
        scrollWheelZoom={true}
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

        {/* ROUTE LINES */}

        {routes.map((route, index) => (
          <Polyline
            key={index}
            positions={route.line}
            pathOptions={{
              color: "#2563eb",
              weight: 4,
              opacity: 0.6,
            }}
          />
        ))}

        {/* BUS MARKERS */}

        {buses.map((bus) => (

          <Marker
            key={bus.id}
            position={bus.position}
          >

            <Popup>

              <div style={{ minWidth: "190px" }}>

                <h3 style={{ marginBottom: "8px" }}>
                  🚌 {bus.id}
                </h3>

                <p>
                  <b>Route:</b>
                  <br />
                  {bus.route}
                </p>

                <p>
                  <b>Passengers:</b>{" "}
                  {bus.passengers}
                </p>

                <p>
                  <b>Status:</b>{" "}
                  {getStatusEmoji(bus.status)}{" "}
                  {bus.status}
                </p>

                {bus.status === "High Demand" && (
                  <p>
                    🤖 <b>AI Alert:</b>
                    <br />
                    Additional bus recommended.
                  </p>
                )}

                {bus.status === "Delayed" && (
                  <p>
                    ⚠️ <b>AI Alert:</b>
                    <br />
                    Monitor this route.
                  </p>
                )}

              </div>

            </Popup>

          </Marker>

        ))}

      </MapContainer>

      {/* MAP LEGEND */}

      <div
        style={{
          marginTop: "12px",
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          fontSize: "13px",
        }}
      >

        <span>🟢 On Time</span>

        <span>🟡 Delayed</span>

        <span>🔴 High Demand</span>

        <span>🔵 Route</span>

      </div>

    </div>
  );
}

export default LiveMap;