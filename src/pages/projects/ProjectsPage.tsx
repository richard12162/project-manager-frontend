export function ProjectsPage() {
  return (
    <section className="content-card">
      <div className="content-card__header split-header">
        <div>
          <p className="section-eyebrow">Projects</p>
          <h1>Projektarbeitsbereich</h1>
          <p>
            Die Projektstartseite ist bereits als echter Einstieg vorbereitet und
            wird im naechsten Schritt an das Backend angebunden.
          </p>
        </div>

        <button className="button button--secondary" type="button">
          Neues Projekt
        </button>
      </div>

      <div className="placeholder-grid">
        <aside className="placeholder-panel">
          <h2>Ansicht</h2>
          <p>
            Navigation und Seitenrahmen stehen, damit wir direkt echte Daten
            integrieren koennen.
          </p>
          <div className="placeholder-list">
            <div className="placeholder-item">
              <strong>Projektliste</strong>
              <span>Folgt mit API-Anbindung und Zustandsbehandlung.</span>
            </div>
            <div className="placeholder-item">
              <strong>Schnellzugriffe</strong>
              <span>Raum fuer Filter und Aktionen im produktiven Flow.</span>
            </div>
          </div>
        </aside>

        <div className="placeholder-panel">
          <h2>Bereit fuer die erste echte Seite</h2>
          <p>
            Dieser Screen ist bewusst schlank: keine Demo-Widgets, keine
            Architekturseiten, sondern direkt die spaetere Produktflaeche.
          </p>
        </div>
      </div>
    </section>
  )
}
