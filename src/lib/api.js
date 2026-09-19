const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV
    ? ""
    : "https://priyaredddy-cse-hyderabad-urban-intelligence-api.hf.space")
).replace(/\/$/, "");

export const apiUrl = (path) => `${API_BASE_URL}${path}`;

export async function fetchApi(path, options) {
  const response = await fetch(apiUrl(path), options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `API returned ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const getOverview = () => fetchApi("/api/overview");
export const getFleet = () => fetchApi("/api/fleet");
export const getRoutes = () => fetchApi("/api/routes");
export const getFitness = () => fetchApi("/api/fitness");
export const getDemandForecast = () => fetchApi("/api/demand-forecast");
export const getAlerts = () => fetchApi("/api/alerts");
export const getTrafficHistory = () => fetchApi("/api/traffic-history");

export const simulateTraffic = (vehicleCount) =>
  fetchApi("/api/traffic-simulation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vehicle_count: vehicleCount }),
  });
