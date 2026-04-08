import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <main className="auth-layout">
      <div className="container auth-layout__grid">
        <section className="auth-panel">
          <div>
            <p className="auth-panel__eyebrow">Project workspace</p>
            <h1>Tasks, Projekte und Teamarbeit an einem Ort.</h1>
            <p>
              Ein ruhiger, fokussierter Einstieg in das taegliche Projektgeschaeft.
              Ohne Overhead, mit klaren Wegen fuer Aufgaben, Kommentare und Aktivitaet.
            </p>
          </div>

          <div className="hero-metric-grid" aria-label="Produktmerkmale">
            <div className="metric-card">
              <strong>Projekte</strong>
              <p>Zentrale Startseite fuer laufende Teamarbeit.</p>
            </div>
            <div className="metric-card">
              <strong>Tasks</strong>
              <p>Status, Verantwortliche und Prioritaeten im Blick.</p>
            </div>
            <div className="metric-card">
              <strong>Kommentare</strong>
              <p>Absprachen direkt am Vorgang statt im Postfach.</p>
            </div>
            <div className="metric-card">
              <strong>Aktivitaet</strong>
              <p>Aenderungen nachvollziehbar fuer das ganze Team.</p>
            </div>
          </div>

          <div className="auth-panel__list">
            <div className="auth-panel__item">
              <strong>Fuer taegliche Nutzung gebaut</strong>
              <p>Die App startet direkt in echten Arbeitsablaeufen statt in Demoscreens.</p>
            </div>
            <div className="auth-panel__item">
              <strong>Saubere Basis fuer das Backend</strong>
              <p>Routing, Layouts und Struktur sind bereits auf das Spring-API vorbereitet.</p>
            </div>
          </div>
        </section>

        <Outlet />
      </div>
    </main>
  )
}
