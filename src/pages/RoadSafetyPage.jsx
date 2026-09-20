export default function RoadSafetyPage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">FEATURE PREVIEW • IN DEVELOPMENT</span>
          <h2 className="page-title">Road Safety Lab</h2>
          <p>
            Edge-assisted enforcement for speeding vehicles and low-quality
            roadside footage.
          </p>
        </div>
        <span className="development-chip">PLANNED</span>
      </div>

      <section className="safety-hero">
        <div>
          <span className="safety-kicker">NEXT-GENERATION ROAD SAFETY</span>
          <h2>From a speeding event to actionable evidence.</h2>
          <p>
            UrbanIQ will combine speed telemetry, number-plate detection and
            edge image restoration to produce a reviewable violation package
            before any alert is issued.
          </p>
        </div>
        <div className="safety-orbit" aria-hidden="true">
          <span>⚡</span>
          <strong>EDGE AI</strong>
          <small>PROCESSING</small>
        </div>
      </section>

      <div className="safety-feature-grid">
        <section className="section-card safety-feature-card">
          <div className="feature-number">01</div>
          <span className="feature-icon">🏎️</span>
          <h2>Rash Driving &amp; Speed Enforcement</h2>
          <p>
            Detect a speed-limit violation, capture the best frame, isolate the
            licence plate and prepare a verified alert.
          </p>
          <div className="pipeline-list">
            <div>
              <span>1</span>
              <p>
                <strong>Detect</strong> Compare measured speed with the road
                limit.
              </p>
            </div>
            <div>
              <span>2</span>
              <p>
                <strong>Capture</strong> Select the clearest frame around the
                event.
              </p>
            </div>
            <div>
              <span>3</span>
              <p>
                <strong>Read</strong> Localise the plate and run OCR with
                confidence scoring.
              </p>
            </div>
            <div>
              <span>4</span>
              <p>
                <strong>Review</strong> Human verification before an alert is
                sent.
              </p>
            </div>
          </div>
          <span className="feature-status">
            MODEL + WORKFLOW IN DEVELOPMENT
          </span>
        </section>

        <section className="section-card safety-feature-card">
          <div className="feature-number">02</div>
          <span className="feature-icon">✨</span>
          <h2>Edge Image Restoration</h2>
          <p>
            Improve difficult camera frames on-device before detection, while
            retaining the original image as evidence.
          </p>
          <div className="enhancement-preview">
            <div className="preview-frame preview-before">
              <span>RAW FRAME</span>
              <strong>TS •• 7B ••••</strong>
              <small>motion blur · low contrast</small>
            </div>
            <div className="preview-arrow">→</div>
            <div className="preview-frame preview-after">
              <span>RESTORED</span>
              <strong>TS 09 EB 4821</strong>
              <small>sharpened · contrast recovered</small>
            </div>
          </div>
          <div className="enhancement-tags">
            <span>Deblur</span>
            <span>Denoise</span>
            <span>Low-light recovery</span>
            <span>Super-resolution</span>
          </div>
          <small className="evidence-note">
            Restoration assists review; it does not guarantee recovery of
            details that were never captured.
          </small>
        </section>
      </div>

      <section className="section-card delivery-roadmap">
        <div className="section-header">
          <div>
            <h2>Delivery Roadmap</h2>
            <p>Planned safeguards before real-world enforcement.</p>
          </div>
          <span className="development-chip">R&amp;D</span>
        </div>
        <div className="roadmap-steps">
          <div className="roadmap-step active">
            <span>1</span>
            <strong>Prototype</strong>
            <small>Speed + plate pipeline</small>
          </div>
          <div className="roadmap-step">
            <span>2</span>
            <strong>Edge validation</strong>
            <small>Night, rain and motion tests</small>
          </div>
          <div className="roadmap-step">
            <span>3</span>
            <strong>Human review</strong>
            <small>Confidence and evidence checks</small>
          </div>
          <div className="roadmap-step">
            <span>4</span>
            <strong>Pilot</strong>
            <small>Authority-approved deployment</small>
          </div>
        </div>
      </section>
    </>
  );
}
