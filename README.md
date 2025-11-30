# Foto-PDF-App

Web-App zum Erfassen von Fotos mit kurzen Beschreibungen und anschließendem PDF-Export – alles läuft direkt im Browser, ohne Server oder Datenspeicherung.

## So funktioniert’s

1. Seite öffnen: `https://abbas-hoseiny.github.io/new-pdf/`
2. Fotos aufnehmen oder aus der Galerie wählen, Beschreibung ergänzen, Reihenfolge anpassen.
3. Fotos werden automatisch für den Ausdruck optimiert und korrekt ausgerichtet.
4. „PDF erzeugen“ tippen, anschließend entweder teilen (mobiles Share Sheet) oder lokal speichern.

## Highlights

- Läuft komplett offline im Browser, keine Uploads an Server.
- HEIC wird abgefangen; JPG/PNG/WebP funktionieren sofort.
- PDF-Layout mit Logo, Pflanzen-Icon und Textbox pro Foto.
- Mobile Geräte nutzen das Share Sheet, Desktop lädt automatisch herunter.

## Entwicklung (kurz)

```bash
npm install
npm run dev    # lokale Vorschau
npm run build  # Produktion / Deployment
```

Deploy erfolgt über GitHub Pages (`main` → `gh-pages`). Änderungen bitte immer mit `npm run build` testen.

## Lizenz

Veröffentlicht unter der MIT-Lizenz (deutsche Fassung, siehe `LICENSE`).
