import './App.css'

function App() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="AccessLens home">
          <span className="brand-mark">◉</span>
          AccessLens
        </a>
        <span className="pilot-label">Civic accessibility pilot</span>
      </header>

      <section className="hero" id="top">
        <p className="eyebrow">Make access visible</p>
        <h1>One photo can start<br />meaningful action.</h1>
        <p className="intro">Report barriers at transit stations in a few clear steps. AccessLens turns what you see into a ready-to-send civic complaint.</p>
      </section>

      <section className="workspace" aria-label="Accessibility reporting workspace">
        <div className="capture-placeholder">
          <span className="step-number">1</span>
          <div className="capture-icon">⌁</div>
          <h2>Show us the barrier</h2>
          <p>Upload a photo of a blocked ramp, broken lift, or unsafe crossing.</p>
          <span className="coming-soon">Photo upload · Phase 2</span>
        </div>

        <div className="report-placeholder">
          <p className="eyebrow">Accessibility report</p>
          <div className="report-icon">✦</div>
          <h2>A clearer way to be heard.</h2>
          <p>Your photo will become a concise accessibility report and complaint draft—without requiring you to understand the civic system first.</p>
        </div>
      </section>

      <section className="promise">
        <p className="eyebrow">The promise</p>
        <h2>See a barrier. Start action.</h2>
        <div className="promise-steps">
          <article><span>01</span><h3>Capture</h3><p>Document the barrier in the moment.</p></article>
          <article><span>02</span><h3>Understand</h3><p>Make its impact clear for every commuter.</p></article>
          <article><span>03</span><h3>Act</h3><p>Share a complaint that is ready to send.</p></article>
        </div>
      </section>

      <footer>AccessLens is a civic reporting prototype for more accessible public spaces.</footer>
    </main>
  )
}

export default App
