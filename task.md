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
