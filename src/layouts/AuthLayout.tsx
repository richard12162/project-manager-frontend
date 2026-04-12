import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <main className="auth-layout">
      <div className="container auth-layout__grid">
        <section className="auth-panel">
          <div>
            <p className="auth-panel__eyebrow">Project workspace</p>
            <h1>Aufgaben, Projekte und Teamarbeit an einem Ort.</h1>
            <p>
              Zugriff auf Projekte, Aufgaben, Kommentare und Aktivitäten in einer
              gemeinsamen Oberfläche.
            </p>
          </div>

          <div className="hero-metric-grid" aria-label="Produktmerkmale">
            <div className="metric-card">
              <strong>Projekte</strong>
              <p>Alle verfügbaren Projekte auf einen Blick.</p>
            </div>
            <div className="metric-card">
              <strong>Aufgaben</strong>
              <p>Status, Verantwortliche und Prioritäten zentral verwaltet.</p>
            </div>
            <div className="metric-card">
              <strong>Kommentare</strong>
              <p>Rückfragen und Abstimmungen direkt am Vorgang.</p>
            </div>
            <div className="metric-card">
              <strong>Aktivität</strong>
              <p>Änderungen chronologisch dokumentiert.</p>
            </div>
          </div>

          <div className="auth-panel__list">
            <div className="auth-panel__item">
              <strong>Direkter Einstieg</strong>
              <p>Nach der Anmeldung führt die Anwendung direkt in den Arbeitsbereich.</p>
            </div>
            <div className="auth-panel__item">
              <strong>Klare Struktur</strong>
              <p>Projekte, Aufgaben und Teamaktivitäten sind in getrennten Bereichen organisiert.</p>
            </div>
          </div>
        </section>

        <Outlet />
      </div>
    </main>
  )
}
