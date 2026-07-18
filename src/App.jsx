import { useRef, useState } from 'react'
import sampleBarrier from '../codex_image.jpeg'
import './App.css'

function App() {
  const fileInput = useRef(null)
  const [photo, setPhoto] = useState(sampleBarrier)
  const [placeType, setPlaceType] = useState('Metro / transit station')
  const [location, setLocation] = useState('Vyttila Metro Station')
  const [note, setNote] = useState('')
  const [report, setReport] = useState(false)

  function selectPhoto(event) {
    const file = event.target.files?.[0]
    if (file) setPhoto(URL.createObjectURL(file))
  }

  const mockAnalyses = {
    'Metro / transit station': {
      category: 'Blocked step-free route', severity: 'High priority', affected: 'Wheelchair users, people using walkers, parents with prams, and older adults', impact: 'The step-free route is obstructed, leaving many commuters unable to enter or exit safely.', action: 'Clear the obstruction immediately and add visible “Keep ramp clear” markings with daily accessibility checks.',
    },
    'Hospital or clinic': {
      category: 'Unsafe accessible entrance', severity: 'High priority', affected: 'Patients with mobility needs, older adults, visitors with prams, and emergency visitors', impact: 'The barrier can delay or prevent safe access to essential healthcare services.', action: 'Restore an accessible entrance immediately and place temporary, clearly marked assistance signage until repaired.',
    },
    'School or college': {
      category: 'Inaccessible campus route', severity: 'High priority', affected: 'Students, staff, visitors, and parents with mobility needs', impact: 'The barrier prevents equal and independent access to learning spaces and services.', action: 'Make the route step-free, clear the obstruction, and include it in the campus accessibility audit.',
    },
    'Road, footpath, or crossing': {
      category: 'Unsafe pedestrian route', severity: 'High priority', affected: 'Pedestrians, wheelchair users, children, older adults, and people walking at night', impact: 'The damaged or obstructed route forces people into traffic and raises the risk of falls or injury.', action: 'Repair the route, add an accessible crossing, and install lighting or barriers where the walking path is unsafe.',
    },
    'Park or public space': {
      category: 'Public space access barrier', severity: 'Moderate priority', affected: 'Wheelchair users, families, older adults, and people with limited mobility', impact: 'The space cannot be used independently and safely by everyone in the community.', action: 'Clear the access route and add a maintained, step-free path with clear wayfinding.',
    },
    'Other public building': {
      category: 'Accessibility barrier', severity: 'High priority', affected: 'People with disabilities, older adults, families, and visitors with mobility needs', impact: 'The barrier restricts equal access to an essential public service or facility.', action: 'Remove the barrier promptly and provide a clearly marked accessible alternative while permanent work is completed.',
    },
  }
  const currentAnalysis = mockAnalyses[placeType]

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
          <h2>Show us the barrier</h2>
          <p>Upload a photo of a blocked ramp, broken lift, unsafe crossing, pothole, or dark route.</p>
          <button className="photo-picker" type="button" onClick={() => fileInput.current?.click()}>
            <img src={photo} alt="Selected report photo" />
            <span>↻ Change photo</span>
          </button>
          <input ref={fileInput} type="file" accept="image/*" onChange={selectPhoto} hidden />
          <p className="photo-help">Choose a clear photo that shows the barrier and its surroundings.</p>

          <label className="field-label" htmlFor="place-type"><span className="step-number">2</span> What kind of place is this?</label>
          <select id="place-type" value={placeType} onChange={(event) => setPlaceType(event.target.value)}>
            <option>Metro / transit station</option>
            <option>Hospital or clinic</option>
            <option>School or college</option>
            <option>Road, footpath, or crossing</option>
            <option>Park or public space</option>
            <option>Other public building</option>
          </select>

          <label className="field-label" htmlFor="location"><span className="step-number">3</span> Where is it?</label>
          <input id="location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="E.g. Vyttila Metro Station" />

          <label className="field-label" htmlFor="note"><span className="step-number">4</span> Anything else? <em>Optional</em></label>
          <textarea id="note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="E.g. The ramp has been blocked since morning" rows="3" />
          <button className="analyse-btn" type="button" onClick={() => setReport(true)}>Analyse barrier <span>→</span></button>
        </div>

        <div className="report-placeholder">
          {!report ? (
            <>
              <p className="eyebrow">Accessibility report</p>
              <div className="report-icon">✦</div>
              <h2>A clearer way to be heard.</h2>
              <p>Your photo will become a concise accessibility report and complaint draft—without requiring you to understand the civic system first.</p>
            </>
          ) : (
            <div className="report-content" aria-live="polite">
              <div className="report-heading">
                <div><p className="eyebrow">Accessibility report</p><h2>{location || 'Selected location'}</h2></div>
                <span className="status">● Analysis complete</span>
              </div>
              <div className="report-grid">
                <article><p>Issue category</p><h3>{currentAnalysis.category}</h3></article>
                <article><p>Severity</p><h3 className="severity">{currentAnalysis.severity}</h3></article>
                <article><p>Who is affected</p><h3>{currentAnalysis.affected}</h3></article>
                <article><p>Accessibility impact</p><h3>{currentAnalysis.impact}</h3></article>
              </div>
              <section className="recommendation"><span>✦</span><div><p>Recommended action</p><strong>{currentAnalysis.action}</strong></div></section>
              {note && <p className="note-recorded">Your note has been included in the report.</p>}
            </div>
          )}
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
