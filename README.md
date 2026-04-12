# Project Manager Frontend

React-, TypeScript- und Vite-Frontend für ein bestehendes Task-Management-Backend.

## Funktionsumfang

- Authentifizierung mit Login, Registrierung und Session-Wiederherstellung über `me`
- Projektübersicht mit Projektanlage
- Projekt-Details mit Bereichen für Aufgaben, Mitglieder und Aktivität
- Aufgabenverwaltung mit Filtern, Erstellen, Bearbeiten, Status- und Zuweisungsänderung
- Kommentare an Aufgaben inklusive Erstellen, Bearbeiten und Löschen

## Technischer Stand

- Routing mit `react-router-dom`
- Zentrale API-Schicht unter `src/api`
- Vorhandene OpenAPI-Typen aus `src/types/api.ts`
- Geschützte Routen für den angemeldeten Bereich

## Entwicklung

```bash
npm install
npm run dev
```

Weitere Skripte:

```bash
npm run build
npm run lint
npm run preview
```

## Backend-Anbindung

Standardmäßig erwartet das Frontend das Backend unter:

```bash
http://localhost:8080
```

Eine abweichende URL kann über `VITE_API_URL` gesetzt werden:

```bash
VITE_API_URL=http://localhost:8080
```

Für den lokalen Betrieb muss das Backend CORS für das Vite-Frontend erlauben, zum Beispiel für:

```bash
http://localhost:5173
```
