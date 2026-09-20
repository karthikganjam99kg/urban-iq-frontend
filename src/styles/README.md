# Styling

`app.css` contains the shared UrbanIQ design system, page components, and
responsive breakpoints. Keep global browser/root resets in `../index.css`.

Mobile navigation is an icon rail below 750 px. Add new navigation selectors
through `.nav-icon` and `.nav-label`; avoid generic descendant selectors so
accessible labels remain independent from icon styling.
