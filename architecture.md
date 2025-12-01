# Architekturüberblick

Dieses Dokument fasst Aufbau und Datenfluss der Foto-PDF-WebApp zusammen. Alle Bereiche folgen den Anforderungen aus `task.md` und `todo-task.md`.

## Technologiestack

- **Astro (statischer Modus)** für Seitenaufbau und Routing. Interaktionen laufen als Client-Script in `src/scripts/erfassung.ts`.
- **pdf-lib** erzeugt PDFs vollständig im Browser.
- **Vanilla TypeScript** für Client-Logik (kein Framework), damit die Bundle-Größe klein bleibt.
- **GitHub Pages** liefert die gebaute Site (`dist/`) aus; `.nojekyll` deaktiviert Jekyll-Rewrites.

## Verzeichnisstruktur (vereinfacht)

```
src/
├─ assets/branding/        # Logos & Siegel (lokale PNG/SVG)
├─ components/Icon.astro   # Einfache Icon-Komponente (inline SVG)
├─ layouts/AppLayout.astro # Gemeinsamer Seitenrahmen + Header/Footer
├─ pages/
│  └─ index.astro          # Aufnahme-/Upload-Seite
├─ scripts/erfassung.ts    # Client-Script: Upload, State, PDF-Trigger
├─ lib/pdf.ts              # pdf-lib Wrapper + Layoutdefinition
└─ styles/global.css       # Globales Branding & Komponentenstyles
```

## Datenfluss

1. **Upload** – `erfassung.ts` registriert `#photoInput`. Ausgewählte Dateien werden über `entries[]` verwaltet (inkl. `URL.createObjectURL`).
2. **Normalisierung** – Standardmäßig bleiben Bilder in Originalqualität erhalten; HEIC wird mit einer Fehlermeldung abgewiesen. Eine Canvas-Reduktion (~2000 px) existiert als Helper, wird jedoch derzeit nicht aktiv geschaltet.
3. **UI-Render** – `render()` erzeugt Karten mit Vorschaubild, Beschreibungstextfeld, Sortierbuttons. Änderungen aktualisieren das gemeinsame Array.
4. **PDF-Erzeugung** – `pdf.ts` legt pro Eintrag eine A4-Seite an und zeichnet ausschließlich das Foto zentriert (keine Kopfzeile, keine Textbox). Die Funktion gibt ein `Uint8Array` zurück.
5. **Export** – `erfassung.ts` erzeugt daraus einen Blob. Mobile Geräte nutzen `navigator.share` (mit Sicherheitsprüfungen), alle anderen triggern `triggerDownload`.

## Qualitätsstrategien

- **Datei-Checks**: HEIC/HEIF wird blockiert, alle anderen Bilder bleiben zunächst in voller Qualität. Der Canvas-basierte Downscale kann aktiviert werden, falls künftig notwendig.
- **Statusmeldungen** (`#statusMessage`) informieren über Fehler (z. B. nicht unterstützte Dateitypen, fehlgeschlagener Export).
- **Build-Garantie** – Nach jedem erledigten Task wird `npm run build` ausgeführt; `dist/` ist dadurch jederzeit publish-fähig.
- **Sharing-Fallback** – Desktop-Browser umgehen `navigator.share` automatisch und bieten nur den Download an, damit kein leerer Share-Versuch entsteht.

## Erweiterungspunkte

- Persistenz (z. B. `localStorage`) für Qualitätseinstellungen oder Foto-Sessions.
- Service Worker, um die App offline verfügbar zu machen.
- Zusätzliche PDF-Metadaten (Kundendaten, Signaturen, weitere Logos).
- Internationalisierung – aktuell ist die gesamte UI auf Deutsch.
