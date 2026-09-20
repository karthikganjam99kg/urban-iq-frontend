import {
  BOOT_CHECK_NAMES,
  BOOT_SERVICES,
} from "../../constants/services";

export default function BootSplash({ checks, leaving }) {
  const completed = BOOT_CHECK_NAMES.filter(
    (name) => checks[name] !== "checking",
  ).length;
  const progress = Math.round((completed / BOOT_CHECK_NAMES.length) * 100);

  const serviceState = (names) => {
    const states = names.map((name) => checks[name]);
    if (states.some((state) => state === "checking")) return "checking";
    if (states.some((state) => state === "offline")) return "offline";
    return "ready";
  };

  const hasOfflineService = Object.values(checks).some(
    (state) => state === "offline",
  );

  return (
    <div
      className={`boot-splash${leaving ? " is-leaving" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={`UrbanIQ is preparing city services, ${progress}% complete`}
    >
      <div className="boot-grid" aria-hidden="true" />
      <div className="boot-glow boot-glow-one" aria-hidden="true" />
      <div className="boot-glow boot-glow-two" aria-hidden="true" />

      <div className="boot-panel">
        <div className="boot-mark" aria-hidden="true">
          <span className="boot-orbit boot-orbit-one" />
          <span className="boot-orbit boot-orbit-two" />
          <span className="boot-mark-core">⌁</span>
        </div>

        <div className="boot-brand">
          <span>URBAN</span>IQ
        </div>
        <p className="boot-kicker">HYDERABAD CITY INTELLIGENCE OS</p>
        <h1>Bringing the city online</h1>
        <p className="boot-copy">
          Connecting live traffic, fleet telemetry and AI services.
        </p>

        <div className="boot-progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="boot-services">
          {BOOT_SERVICES.map((service) => {
            const state = serviceState(service.checks);
            return (
              <div className={`boot-service ${state}`} key={service.label}>
                <span className="boot-service-dot" aria-hidden="true" />
                <span>{service.label}</span>
                <small>
                  {state === "checking"
                    ? "Checking"
                    : state === "offline"
                      ? "Offline"
                      : "Ready"}
                </small>
              </div>
            );
          })}
        </div>

        <p className="boot-footnote">
          {completed === BOOT_CHECK_NAMES.length
            ? hasOfflineService
              ? "Command centre ready with unavailable services"
              : "Command centre ready"
            : `Running service checks · ${progress}%`}
        </p>
      </div>
    </div>
  );
}
