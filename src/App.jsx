import { useEffect, useRef, useState } from 'react'
import sampleBarrier from '../codex_image.jpeg'
import { supabase } from './lib/supabase'
import './App.css'

function App() {
  const fileInput = useRef(null)
  const [photo, setPhoto] = useState(sampleBarrier)
  const [photoFile, setPhotoFile] = useState(null)
  const [placeType, setPlaceType] = useState('Metro / transit station')
  const [location, setLocation] = useState('Vyttila Metro Station')
  const [note, setNote] = useState('')
  const [report, setReport] = useState(false)
  const [session, setSession] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [submitState, setSubmitState] = useState({ status: 'idle', message: '' })
  const [view, setView] = useState('report')
  const [myReports, setMyReports] = useState([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportsError, setReportsError] = useState('')
  const [role, setRole] = useState(null)
  const [adminReports, setAdminReports] = useState([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [adminEdits, setAdminEdits] = useState({})
  const [adminSaving, setAdminSaving] = useState(null)

  function selectPhoto(event) {
    const file = event.target.files?.[0]
    if (file) {
      setPhoto(URL.createObjectURL(file))
      setPhotoFile(file)
    }
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return undefined
    async function loadRole() {
      const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      setRole(data?.role || 'citizen')
    }
    loadRole()
    return undefined
  }, [session])

  useEffect(() => {
    if (!session) {
      return undefined
    }

    async function loadReports() {
      setReportsLoading(true)
      setReportsError('')
      const { data, error } = await supabase
        .from('reports')
        .select('*, report_updates(*)')
        .order('created_at', { ascending: false })
      if (error) {
        setReportsError(error.message)
        setReportsLoading(false)
        return
      }
      const reportsWithPhotos = await Promise.all(data.map(async (item) => {
        if (!item.photo_path) return item
        const { data: photo } = await supabase.storage.from('report-photos').createSignedUrl(item.photo_path, 3600)
        return { ...item, photoUrl: photo?.signedUrl }
      }))
      setMyReports(reportsWithPhotos)
      setReportsLoading(false)
    }

    loadReports()
    const channel = supabase
      .channel(`citizen-reports-${session.user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports', filter: `citizen_id=eq.${session.user.id}` }, loadReports)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'report_updates' }, loadReports)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [session])

  useEffect(() => {
    if (!session || role !== 'admin') return undefined

    async function loadAdminReports() {
      setAdminLoading(true)
      setAdminError('')
      const { data, error } = await supabase
        .from('reports')
        .select('*, report_updates(*)')
        .order('created_at', { ascending: false })
      if (error) {
        setAdminError(error.message)
        setAdminLoading(false)
        return
      }
      const reportsWithPhotos = await Promise.all(data.map(async (item) => {
        if (!item.photo_path) return item
        const { data: photo } = await supabase.storage.from('report-photos').createSignedUrl(item.photo_path, 3600)
        return { ...item, photoUrl: photo?.signedUrl }
      }))
      setAdminReports(reportsWithPhotos)
      setAdminLoading(false)
    }

    loadAdminReports()
    const channel = supabase
      .channel('admin-reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, loadAdminReports)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'report_updates' }, loadAdminReports)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [session, role])

  async function handleAuth(event) {
    event.preventDefault()
    setAuthBusy(true)
    setAuthMessage('')
    const action = authMode === 'signIn'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password })
    const { data, error } = await action
    setAuthBusy(false)
    if (error) {
      setAuthMessage(error.message)
      return
    }
    if (authMode === 'signUp' && !data.session) {
      setAuthMessage('Check your email to confirm your account, then sign in.')
      return
    }
    setAuthOpen(false)
    setEmail('')
    setPassword('')
  }

  async function signOut() {
    await supabase.auth.signOut()
    setView('report')
    setRole(null)
  }

  function updateAdminEdit(reportId, field, value) {
    setAdminEdits((current) => ({
      ...current,
      [reportId]: { status: current[reportId]?.status || adminReports.find((item) => item.id === reportId)?.status || 'submitted', remark: current[reportId]?.remark || '', [field]: value },
    }))
  }

  async function saveAdminUpdate(report) {
    const edit = adminEdits[report.id] || { status: report.status, remark: '' }
    if (!edit.remark.trim()) {
      setAdminError('Add a short remark before publishing an update.')
      return
    }
    setAdminSaving(report.id)
    setAdminError('')
    const { error: reportError } = await supabase.from('reports').update({ status: edit.status }).eq('id', report.id)
    if (reportError) {
      setAdminError(reportError.message)
      setAdminSaving(null)
      return
    }
    const { error: updateError } = await supabase.from('report_updates').insert({ report_id: report.id, author_id: session.user.id, status: edit.status, remark: edit.remark.trim() })
    if (updateError) setAdminError(updateError.message)
    else setAdminEdits((current) => ({ ...current, [report.id]: { status: edit.status, remark: '' } }))
    setAdminSaving(null)
  }

  async function submitReport() {
    if (!session) {
      setAuthMode('signIn')
      setAuthMessage('Sign in to submit and track this report.')
      setAuthOpen(true)
      return
    }
    setSubmitState({ status: 'loading', message: '' })
    try {
      const imageBlob = photoFile || await fetch(photo).then((response) => response.blob())
      const imageName = photoFile?.name || 'accesslens-demo-photo.jpeg'
      const photoPath = `${session.user.id}/${crypto.randomUUID()}-${imageName.replace(/[^a-zA-Z0-9._-]/g, '-')}`
      const { error: uploadError } = await supabase.storage
        .from('report-photos')
        .upload(photoPath, imageBlob, { contentType: imageBlob.type || 'image/jpeg' })
      if (uploadError) throw uploadError

      const { data, error: reportError } = await supabase
        .from('reports')
        .insert({
          citizen_id: session.user.id,
          place_type: placeType,
          location_name: location || 'Unnamed location',
          user_note: note || null,
          photo_path: photoPath,
          issue_category: currentAnalysis.category,
          severity: currentAnalysis.severity,
          affected_people: currentAnalysis.affected,
          accessibility_impact: currentAnalysis.impact,
          recommended_action: currentAnalysis.action,
          ai_analysis: { source: 'offline mock analysis', ...currentAnalysis },
        })
        .select('id')
        .single()
      if (reportError) throw reportError
      setSubmitState({ status: 'success', message: `Report submitted. Reference: ${data.id.slice(0, 8).toUpperCase()}` })
      setView('dashboard')
    } catch (error) {
      setSubmitState({ status: 'error', message: error.message || 'We could not submit your report. Please try again.' })
    }
  }

  return (
    <main>
      <header className="site-header">
        <button className="brand" type="button" onClick={() => setView('report')} aria-label="AccessLens home">
          <span className="brand-mark">◉</span>
          AccessLens
        </button>
        {session ? (
          <div className="header-actions"><button className="account-button" type="button" onClick={() => setView('dashboard')}>My reports</button>{role === 'admin' && <button className="account-button admin-nav" type="button" onClick={() => setView('admin')}>Admin</button>}<button className="account-button" type="button" onClick={signOut}>Sign out</button></div>
        ) : (
          <button className="account-button" type="button" onClick={() => { setAuthOpen(true); setAuthMessage('') }}>Sign in</button>
        )}
      </header>

      {view === 'report' ? <>
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
              <section className="submission-box">
                <div><p className="eyebrow">Ready to send</p><h3>Submit this report</h3><p>Your photo and report will be shared privately with the AccessLens response team.</p></div>
                <button type="button" onClick={submitReport} disabled={submitState.status === 'loading'}>{submitState.status === 'loading' ? 'Submitting…' : 'Submit report →'}</button>
                {submitState.message && <p className={`submit-message ${submitState.status}`}>{submitState.message}</p>}
              </section>
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
      </> : view === 'dashboard' ? (
        <section className="dashboard">
          <p className="eyebrow">Citizen dashboard</p>
          <div className="dashboard-heading"><div><h1>My reports</h1><p>Follow each issue from submission to resolution. New updates appear here automatically.</p></div><button className="new-report-button" type="button" onClick={() => setView('report')}>+ New report</button></div>
          {reportsLoading && <p className="dashboard-note">Loading your reports…</p>}
          {reportsError && <p className="dashboard-error">{reportsError}</p>}
          {!reportsLoading && !reportsError && myReports.length === 0 && <div className="no-reports"><span>◉</span><h2>No reports yet</h2><p>When you submit an issue, its progress and any authority remarks will appear here.</p><button type="button" onClick={() => setView('report')}>Create your first report</button></div>}
          <div className="reports-list">
            {myReports.map((item) => {
              const updates = [...(item.report_updates || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              return <article className="report-card" key={item.id}>
                {item.photoUrl ? <img src={item.photoUrl} alt={`Evidence for ${item.issue_category}`} /> : <div className="photo-missing">No photo</div>}
                <div className="report-card-content"><div className="report-card-top"><div><p className="eyebrow">{item.place_type}</p><h2>{item.location_name}</h2></div><span className={`status-label ${item.status}`}>{item.status.replace('_', ' ')}</span></div><p className="report-category">{item.issue_category} · {item.severity}</p><p className="report-date">Submitted {new Date(item.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p><div className="updates"><h3>Updates</h3>{updates.length ? updates.map((update) => <div className="update" key={update.id}><span></span><div>{update.status && <strong>{update.status.replace('_', ' ')}</strong>}<p>{update.remark}</p><time>{new Date(update.created_at).toLocaleString()}</time></div></div>) : <p className="waiting-update">No authority update yet. You’ll see it here as soon as there is one.</p>}</div></div>
              </article>
            })}
          </div>
        </section>
      ) : (
        <section className="dashboard admin-dashboard">
          <p className="eyebrow">Admin dashboard</p>
          <div className="dashboard-heading"><div><h1>Incoming reports</h1><p>Review citizen reports, update their progress, and publish an action note. Citizens see each update in real time.</p></div><span className="admin-count">{adminReports.length} total</span></div>
          {adminLoading && <p className="dashboard-note">Loading reports…</p>}
          {adminError && <p className="dashboard-error">{adminError}</p>}
          {!adminLoading && !adminError && adminReports.length === 0 && <div className="no-reports"><span>◉</span><h2>No reports yet</h2><p>New reports submitted by citizens will appear here automatically.</p></div>}
          <div className="reports-list">
            {adminReports.map((item) => {
              const edit = adminEdits[item.id] || { status: item.status, remark: '' }
              return <article className="report-card admin-report-card" key={item.id}>
                {item.photoUrl ? <img src={item.photoUrl} alt={`Evidence for ${item.issue_category}`} /> : <div className="photo-missing">No photo</div>}
                <div className="report-card-content"><div className="report-card-top"><div><p className="eyebrow">{item.place_type}</p><h2>{item.location_name}</h2></div><span className={`status-label ${item.status}`}>{item.status.replace('_', ' ')}</span></div><p className="report-category">{item.issue_category} · {item.severity}</p><p className="report-date">{item.accessibility_impact}</p>{item.user_note && <p className="citizen-note">Citizen note: “{item.user_note}”</p>}<div className="admin-update-form"><h3>Publish an update</h3><label htmlFor={`status-${item.id}`}>Status</label><select id={`status-${item.id}`} value={edit.status} onChange={(event) => updateAdminEdit(item.id, 'status', event.target.value)}><option value="submitted">Submitted</option><option value="under_review">Under review</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select><label htmlFor={`remark-${item.id}`}>Remark for the citizen</label><textarea id={`remark-${item.id}`} rows="3" value={edit.remark} onChange={(event) => updateAdminEdit(item.id, 'remark', event.target.value)} placeholder="E.g. A site inspection has been scheduled for tomorrow." /><button type="button" onClick={() => saveAdminUpdate(item)} disabled={adminSaving === item.id}>{adminSaving === item.id ? 'Publishing…' : 'Publish update'}</button></div></div>
              </article>
            })}
          </div>
        </section>
      )}

      <footer>AccessLens is a civic reporting prototype for more accessible public spaces.</footer>

      {authOpen && (
        <div className="auth-backdrop" role="presentation" onMouseDown={() => setAuthOpen(false)}>
          <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="close-button" type="button" onClick={() => setAuthOpen(false)} aria-label="Close">×</button>
            <p className="eyebrow">Your AccessLens account</p>
            <h2 id="auth-title">{authMode === 'signIn' ? 'Welcome back.' : 'Start reporting.'}</h2>
            <p className="auth-copy">{authMode === 'signIn' ? 'Sign in to follow your reports and see authority updates.' : 'Create an account to submit reports and track action.'}</p>
            <form onSubmit={handleAuth}>
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength="6" autoComplete={authMode === 'signIn' ? 'current-password' : 'new-password'} />
              {authMessage && <p className="auth-message">{authMessage}</p>}
              <button className="auth-submit" type="submit" disabled={authBusy}>{authBusy ? 'Please wait…' : authMode === 'signIn' ? 'Sign in' : 'Create account'}</button>
            </form>
            <button className="auth-switch" type="button" onClick={() => { setAuthMode(authMode === 'signIn' ? 'signUp' : 'signIn'); setAuthMessage('') }}>
              {authMode === 'signIn' ? 'New here? Create an account' : 'Already have an account? Sign in'}
            </button>
          </section>
        </div>
      )}
    </main>
  )
}

export default App
