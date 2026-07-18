import { useRef, useState } from 'react'
import sampleBarrier from '../codex_image.jpeg'
import './App.css'

function App() {
  const fileInput = useRef(null)
  const [photo, setPhoto] = useState(sampleBarrier)
  const [placeType, setPlaceType] = useState('Metro / transit station')
  const [location, setLocation] = useState('Vyttila Metro Station')
  const [note, setNote] = useState('')

  function selectPhoto(event) {
    const file = event.target.files?.[0]
    if (file) setPhoto(URL.createObjectURL(file))
  }

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
          <button className="analyse-btn" type="button">Analyse barrier <span>→</span></button>
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
