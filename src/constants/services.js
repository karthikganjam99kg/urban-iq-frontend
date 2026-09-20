export const BOOT_CHECK_NAMES = [
  "traffic",
  "vision",
  "fleet",
  "demand",
  "overview",
  "routes",
  "fitness",
];

export const BOOT_SERVICES = [
  { label: "Traffic network", checks: ["traffic"] },
  { label: "AI vision engine", checks: ["vision"] },
  { label: "Fleet & telemetry", checks: ["fleet"] },
  {
    label: "City intelligence",
    checks: ["demand", "overview", "routes", "fitness"],
  },
];
