import { MENU_ITEMS } from "../../constants/navigation";

export default function AppSidebar({
  activePage,
  activeAlertCount,
  onNavigate,
}) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon" aria-hidden="true">
          ⌁
        </div>
        <div>
          <h2>
            URBAN<span>IQ</span>
          </h2>
          <small>City Intelligence OS</small>
        </div>
      </div>

      <nav aria-label="Primary navigation">
        {MENU_ITEMS.map((item) => {
          const isActive = activePage === item.name;
          const accessibleLabel =
            item.id === "alerts"
              ? `${item.name}, ${activeAlertCount} active`
              : item.name;

          return (
            <button
              key={item.id}
              className={`nav-item${isActive ? " active" : ""}`}
              onClick={() => onNavigate(item.name)}
              aria-current={isActive ? "page" : undefined}
              aria-label={accessibleLabel}
              title={item.name}
            >
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="nav-label">{item.name}</span>
              {item.id === "alerts" && (
                <small className="alert-count" aria-hidden="true">
                  {activeAlertCount}
                </small>
              )}
            </button>
          );
        })}
      </nav>

      <a
        className="sidebar-bottom"
        href="/fleet-device.html"
        aria-label="Open the UrbanIQ fleet device console"
        title="Open fleet device console"
      >
        <div className="sih-mark">SIH</div>
        <div>
          <strong>SIH26124</strong>
          <span>Fleet device console ↗</span>
        </div>
      </a>
    </aside>
  );
}
