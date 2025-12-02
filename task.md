# Aufgabenplan: PDF ohne Vorlage

## Schritt 1 – PDF-Ausgabe auf Fotos reduzieren

- **Ziel:** Entfernt Kopfzeile, Icons, Textbox und alle Styling-Konstanten aus `src/lib/pdf.ts`, sodass jede Seite nur das eingebettete Foto enthält.
- **Vorgehen:**
  - Entferne Imports der Logo-/Icon-Assets sowie der ungenutzten `StandardFonts`/Farbkonstanten.
  - Kürze `generatePhotoPdf` auf das Berechnen einer skalierenden Bounding-Box und zeichne das Bild mittig auf der Seite.
  - Behalte `embedImage` und das Yielding bei, damit große Exporte stabil bleiben.
- **Tests:**
  1. `npm install` (falls noch nicht) und `npm run build` sicherstellen, dass TypeScript/astro keine Fehler melden.
  2. Lokal in der UI mehrere Fotos auswählen → „PDF erstellen“ klicken → PDF muss ausschließlich Fotos pro Seite enthalten (kein Logo, kein Text).
  3. Datei öffnen und prüfen, dass Seitenverhältnis erhalten bleibt und große Bilder korrekt skaliert werden.

## Schritt 2 – Ungenutzte Assets und Imports bereinigen

- **Ziel:** Entfernt `logo-firmen.png` und `pot-single.png`, sofern nach Schritt 1 keine Referenzen mehr existieren.
- **Vorgehen:**
  - Mit `rg "logo-firmen|pot-single" src public` sicherstellen, dass keine Exporte mehr importiert werden.
  - Dateien in `src/assets/branding/` löschen, falls bestätigt.
  - Build erneut laufen lassen, um sicherzustellen, dass Vite/astro nicht auf die Dateien zugreift.
- **Tests:**
  1. `npm run build` → keine fehlenden Asset-Fehler.
  2. UI laden und prüfen, dass restliche Layouts (z. B. `AppLayout.astro`) weiterhin erwartete Assets anzeigen.

## Schritt 3 – Dokumentation/Statusmeldungen anpassen

- **Ziel:** Aktualisiert Hinweise im UI oder README, damit keine Textfelder oder Logos im PDF erwähnt werden.
- **Vorgehen:**
  - Suchen nach Textstellen wie „Logo“, „Textfeld“ oder „Notizen“ im Zusammenhang mit dem PDF.
  - Formulierungen anpassen (z. B. Statusmeldungen nach dem Export).
- **Tests:**
  1. UI manuell durchklicken und sicherstellen, dass Beschreibungen zum PDF-Export korrekt und konsistent sind.
  2. Optional Leseprobe im README prüfen.

## Schritt 4 – Abschlussprüfung

- **Ziel:** Gesamtfunktion verifizieren und Artefakte bereitstellen.
- **Vorgehen:**
  - Erneut Fotos aufnehmen/hochladen, PDF generieren, teilen und herunterladen.
  - Prüfen, dass `lastPdfBlob`/Share-Flow unverändert funktionieren.
  - Sample-PDF anhängen (falls benötigt) oder QA-Notiz in README ergänzen.
- **Tests:**

  1. `npm run build && npm run preview` oder `npm run dev` und manuelle End-to-End-Probe.
  2. QA-Checkliste abhaken: PDF nur Bilder, keine Crashs, Share/Download Buttons aktiv.

  # Erweiterung: Dokumentenmodus

  ## Schritt 5 – Modus-Konzept & Datenmodell

  - **Ziel:** Definiert, wie Foto- und Dokumentenmodus parallel existieren (globaler Toggle vs. pro Eintrag) und welche Daten an `generatePhotoPdf` übergeben werden müssen.
  - **Vorgehen:**
    - Audit von `entries[]` in `src/scripts/erfassung.ts` und `PhotoEntryPayload` in `src/lib/pdf.ts`, um zusätzliche Felder (z. B. `mode: "photo" | "document"`) vorzusehen.
    - Entscheiden, ob der Modus während der Session global ist oder je Foto gespeichert wird; Ergebnis als Kommentar in `erfassung.ts` dokumentieren.
    - Skizzieren, welche neuen UI-Controls benötigt werden (Button, Toggle, Dropdown) und wie sie mit Accessibility-Attributen versehen werden.
  - **Tests:**
    1. TypeScript-Typen kompilieren (`npm run build`) → sicherstellen, dass neue Felder überall berücksichtigt werden.
    2. Manuelles Clickthrough im UI: Toggle ändern, neues Foto hinzufügen, prüfen, dass der gewählte Modus intern korrekt gesetzt wird (per `console.log`-Probe oder DevTools Breakpoint).

  ## Schritt 6 – UI-Erweiterung & Persistenz

  - **Ziel:** Fügt das Bedien-Element für den Dokumentenmodus hinzu und speichert die Auswahl (global oder pro Eintrag).
  - **Vorgehen:**
    - UI-Kontrolle in `src/pages/index.astro` oder direkt im gerenderten Listenteil ergänzen.
    - Event-Handler in `erfassung.ts` einbinden, state aktualisieren, Rendering anpassen (z. B. Badge „Dokument“ auf Karten).
    - Optional: `localStorage` nutzen, um den letzten Modus zu merken.
  - **Tests:**
    1. `npm run dev` starten → Moduswechsel mehrfach testen, sicherstellen, dass UI-Elemente korrekt fokusierbar sind.
    2. Regressionstest: Fotos aufnehmen ohne Modusänderung → Verhalten unverändert.

  ## Schritt 7 – Bildaufbereitung für Dokumente

  - **Ziel:** Dokumentenmodus erhält eigene Qualitäts- und Canvas-Pipeline (z. B. Graustufen, autom. Zuschnitt, höhere Auflösung).
  - **Vorgehen:**
    - `convertFileToPreset` um ein neues Preset `document` erweitern (höhere `maxEdge`, ggf. `mimeType: "image/png"`).
    - Canvas-Postprocessing implementieren (Kontrastverstärkung, Graustufen, optionale Perspektivkorrektur).
    - Sicherstellen, dass `buildPayloadFromSources` und alle Aufrufer das neue Preset kennen.
  - **Tests:**
    1. Unit-ähnlicher Test: Dokumentfoto laden, Preset `document` erzwingen, Resultat visuell prüfen (speichern & öffnen).
    2. Performance-Test: 5+ Dokumente importieren → PDF-Erstellung darf nicht signifikant länger dauern als vorher.

  ## Schritt 8 – PDF-Layout für Dokumente

  - **Ziel:** PDF-Seiten im Dokumentenmodus sollen eher wie Scans aussehen (leichter Rand, optionale Seitenzahl, Hintergrundfarbe).
  - **Vorgehen:**
    - `generatePhotoPdf` in `src/lib/pdf.ts` so erweitern, dass ein optionales Optionsobjekt (`{ mode: "photo" | "document" }`) entgegengenommen wird.
    - Bei `mode === "document"` feste Margins (z. B. 18pt) und ggf. Seitenzahl/Text am Fußrand zeichnen; Foto weiterhin proportional skalieren.
    - Shared Code extrahieren (z. B. `drawImageCentered(page, image, padding)`), um Duplication zu vermeiden.
  - **Tests:**
    1. Zwei Exporte generieren (Foto vs. Dokument) und sicherstellen, dass sich das Layout sichtbar unterscheidet.
    2. `npm run build` + PDF manuell öffnen → keine Ausreißer bei Seitenrand oder Seitenzahlen.

  ## Schritt 9 – End-to-End-QA & Dokumentation

  - **Ziel:** Gesamtfunktion mit beiden Modi validieren und README/Doku aktualisieren.
  - **Vorgehen:**
    - QA-Checkliste erstellen (z. B. Tabelle Foto- vs. Dokumentmodus mit erwarteten Eigenschaften) und im Repo ablegen.
    - README und ggf. `architecture.md` ergänzen (neue Modi beschreiben, Screenshots/Animated GIFs hinzufügen).
  - **Tests:**
    1. `npm run build && npm run preview` → Browserstack/Real Device: beide Modi testen, Share/Download prüfen.
    2. Review der neuen Dokumentation gegen tatsächliches Verhalten (Peer-Review oder Self-Checkliste).

  ## Schritt 10 – OpenCV/Auto-Crop Infrastruktur

  - **Ziel:** Bringt die technische Basis für automatische Eckenerkennung & Perspektiv-Korrektur in den Dokumentenmodus.
  - **Vorgehen:**
    - `opencv.js` (oder vergleichbare WASM-Library) als optionales Asset integrieren; Lazy-Load erst im Dokumentmodus.
    - Utility `ensureVisionRuntime()` erstellen, der das Skript lädt und Promises cached.
    - TypeScript-Shims hinzufügen, damit `cv.Mat` & Co. typed sind, ohne globale `any`-Flut.
  - **Tests:**
    1. `npm run build` sicherstellen, dass Rollup/Vite die WASM-Dateien kopiert.
    2. In `npm run dev` Dokumentmodus aktivieren → Konsole darf beim ersten Wechsel keine Ladefehler werfen.

  ## Schritt 11 – Konturerkennung & Perspektive

  - **Ziel:** Implementiert `detectDocumentContour(canvas)` und `warpPerspective(canvas, corners)`.
  - **Vorgehen:**
    - Canvas → `cv.Mat`, Graustufen, Blur, Canny, `findContours`, `approxPolyDP`.
    - Größte konvexe 4-Punkt-Kontur wählen, Punkte sortieren (TL/TR/BR/BL) und mit `cv.getPerspectiveTransform` + `cv.warpPerspective` in ein neues Canvas projizieren.
    - Fallback, wenn keine Kontur gefunden wird (Original zurückgeben + Flag `cropped: false`).
  - **Tests:**
    1. Drei Beispiel-Dokumente (schräg, quer, schlechtes Licht) durchlaufen lassen → optisch prüfen, ob geradegezogen.
    2. Performance messen (Konsole `console.time`) – Ziel < 400 ms pro Bild auf Mobile.

  ## Schritt 12 – UI/UX Absicherung

  - **Ziel:** Nutzer:innen wissen, ob Auto-Crop gegriffen hat und können ggf. zurückwechseln.
  - **Vorgehen:**
    - Statusmeldung aktualisieren: „Dokument automatisch zugeschnitten“ bzw. „Scan-Optimierung nicht möglich“.
    - Optional Toggle pro Karte („Auto-Crop rückgängig machen“) implementieren, das gespeicherte Original (ohne Warp) wiederherstellt.
    - Debug-Modus (z. B. URL-Flag) einführen, der erkannte Ecken als Overlay zeigt, um QA zu vereinfachen.
  - **Tests:**
    1. UI-Clickthrough mit fehlerhaften Dokumenten → Meldung erscheint, keine Crashes.
    2. E2E: Auto-Crop deaktivieren & wieder aktivieren → PDF muss jeweils andere Variante enthalten.

  ## Schritt 13 – Qualitäts-Pass & Doku-Update

  - **Ziel:** Abschlussrunde speziell für den Scanner: Performance, Edge Cases, Dokumentation.
  - **Vorgehen:**
    - Diverse Dokumenttypen prüfen (Rechnung, Ausweis-Kopie, handschriftliche Notiz) und Ergebnisse protokollieren.
    - README + `architecture.md` um „Scanner-Modus“ erweitern; GIF/Screenshots hinzufügen.
    - Optional Lighthouse/Performance-Audit, falls opencv.js das Bundle stark vergrößert → ggf. Dynamic Import & Code-Splitting optimieren.
  - **Tests:**
    1. `npm run build` + `npm run preview` → Lighthouse-Check, Bundlesize notieren.
    2. QA-Checklist (siehe Schritt 9) erneut durchgehen, Fokus auf Dokument-Edge Cases.
