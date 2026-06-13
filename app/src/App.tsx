import './App.css';

export function App() {
  return (
    <main className="app-shell">
      <header className="top-status">
        <div className="brand-lockup" aria-label="Gesture Mask Studio">
          <span className="brand-mark" aria-hidden="true" />
          <h1>Gesture Mask Studio</h1>
        </div>
        <div className="tracking-state" aria-label="Tracking status">
          <span className="status-dot" aria-hidden="true" />
          <span>Camera</span>
        </div>
      </header>

      <section className="camera-stage" aria-label="Realtime camera stage">
        <div className="stage-copy">
          <p className="stage-label">Realtime light sheet</p>
          <p className="stage-title">Camera permission starts the live scene sampler.</p>
        </div>
      </section>

      <footer className="control-dock" aria-label="Camera controls">
        <button type="button" disabled>
          Start camera
        </button>
      </footer>
    </main>
  );
}
