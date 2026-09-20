export default function AppHeader({ overview }) {
  const statusClass =
    overview?.status === "operational"
      ? "is-operational"
      : overview
        ? "is-degraded"
        : "is-checking";

  const statusLabel =
    overview?.status === "operational"
      ? "All systems operational"
      : overview
        ? "Service degradation detected"
        : "Checking system status";

  return (
    <header className="topbar">
      <div>
        <span className="project-code">SIH 2026 · PROBLEM 26124</span>
        <h1>Hyderabad Urban Intelligence</h1>
        <p>AI-powered command centre for safer, faster, cleaner cities</p>
      </div>

      <div className="status-cluster">
        <div className={`system-status ${statusClass}`}>
          <span className="status-dot" aria-hidden="true" />
          {statusLabel}
        </div>
        <span className="command-location">📍 Hyderabad, IN</span>
      </div>
    </header>
  );
}
