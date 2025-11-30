# TODO-Plan für Astro-WebApp & GitHub Pages

> Reihenfolge = Priorität. Nach jedem Schritt **sofort** `npm run build` ausführen und dokumentieren, damit die statische Site jederzeit deploybar bleibt. Sämtliche UX-Texte, Labels und Dokumentation entstehen konsequent auf Deutsch.

## 1. Projektgrundlage

- [x] Astro-Projekt initialisieren (`npm create astro@latest`, Template: minimal, TypeScript on). Abhängigkeiten installieren.
  - Test: `npm run build`
- [x] Basisprojekt anpassen: `package.json`-Scripts prüfen, `tsconfig` und `.editorconfig` übernehmen, sinnvolle README-Notiz ergänzen.
  - Test: `npm run build`

## 2. Globale Konfiguration & Assets

- [x] `astro.config.mjs` auf GitHub-Pages-Domain einstellen (`site`, `base` falls Repository-Name ≠ Benutzername). Vite-Alias für `@assets` setzen.
  - Test: `npm run build`
- [x] Logos & Siegel herunterladen (Dateien aus `meta-info.md`) und unter `src/assets/branding/` ablegen. Referenzen im Code nur lokal (kein externes CDN).
  - Test: `npm run build`
- [x] `.nojekyll` im Projektwurzelverzeichnis anlegen, damit GitHub Pages keine Unterordner blockiert.
  - Test: `npm run build`

## 3. Seiten & UX

- [x] Startseite mit Intro + Call-to-Action zur Fotoerfassung bauen (responsive Layout, Farben aus Branding).
  - Test: `npm run build`
- [x] Erfassungsseite implementieren: Kamera-/Galerie-Upload (über `<input type="file" accept="image/*" capture>`), Preview-Liste, beschreibbare Felder.
  - Test: `npm run build`
- [x] Datenhaltung (State-Management oder Stores) inklusive Sortiermöglichkeit und Lösch-Flow ergänzen.
  - Test: `npm run build`

## 4. PDF-Export & Teilen

- [x] PDF-Generator einbinden (z. B. `pdf-lib`). Template mit schlanker Kopfzeile (Logo/Siegel, Kontaktdaten) und Bild+Text-Modulen erstellen.
  - Test: `npm run build`
- [x] Export-Flow verdrahten: Button „PDF erzeugen“, Erstellung rein clientseitig, Download + `navigator.share`-Fallback.
  - Test: `npm run build`
- [x] Qualitäts-/Performance-Optionen umsetzen (z. B. High/Standard-Auflösung, Hinweis bei zu großen Dateien).
  - Test: `npm run build`

## 5. Deployment-Automatisierung

- [x] GitHub Actions Workflow (`.github/workflows/deploy.yml`) hinzufügen: `npm ci`, `npm run build`, `with: deploy_branch: gh-pages`. Secrets prüfen.
  - Test lokal: `npm run build`
- [x] `astro add github` (oder manuell) ausführen, anschließend README mit Deploy-Hinweisen + Share-Hinweis aktualisieren.
  - Test: `npm run build`

## 6. Abschluss & Qualität

- [x] End-to-End Smoke-Test (Fotos aufnehmen, beschreiben, PDF erzeugen, Sharing öffnen). Ergebnisse kurz in `README` festhalten.
  - Test: `npm run build`
- [x] Repository aufräumen: `npm run lint` (falls vorhanden), `npm run build`, Änderungen committen/pushen.
  - Test: `npm run build`

## 7. Dokumentation (DE)

- [x] `README.md` um deutschsprachige Nutzeranleitung, Build-/Deploy-Schritte (inkl. GitHub Pages, `.nojekyll`) und bekannten Einschränkungen erweitern.
  - Test: `npm run build`
- [x] `architecture.md` erstellen: Überblick über Astro-Struktur, Komponenten (Upload, State, PDF), Datenfluss, verwendete Bibliotheken, Qualitäts-Strategien.
  - Test: `npm run build`
