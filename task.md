Hier ist eine mögliche **Zielbeschreibung als `task.md`** – komplett ohne Code, nur mit Beschreibung:

---

# task.md – Astro-WebApp für Foto-Erfassung & PDF-Export (mobil, statisch, GitHub Pages)

## 1. Kontext & Zweck der Anwendung

Diese Anwendung ist eine **rein statische WebApp**, die mit **Astro** gebaut und auf **GitHub Pages** gehostet wird.
Sie soll insbesondere auf **Smartphones** (Android, iOS) nutzbar sein und wird über eine normale URL im Browser aufgerufen.

Zweck der App:

* Nutzer (z. B. Gärtner, Händler, Dienstleister) sollen **Objekte/Pflanzen fotografieren** können.
* Zu **jedem Foto** soll eine **Textbeschreibung** erfasst werden (z. B. Name, Besonderheiten, Hinweise für Kunden).
* Am Ende soll der Nutzer aus allen aufgenommenen Fotos und ihren Beschreibungen **lokal im Browser** ein **PDF-Dokument erzeugen** können.
* Dieses PDF soll vom Nutzer auf dem **Endgerät gespeichert, geteilt oder versendet** werden können (z. B. per Messenger oder E-Mail).

Wichtig:
Es gibt **kein Backend** und keinen eigenen Server. Alle Datenverarbeitung findet **ausschließlich im Browser des Nutzers** statt.

---

## 2. Zielbild aus Sicht der Benutzer

### 2.1 Typischer Ablauf (Use Case)

1. Nutzer öffnet die WebApp im Browser seines Smartphones.
2. Auf der Startseite sieht er eine kurze Erklärung und einen Button, um zur Foto-Erfassung zu wechseln.
3. Auf der Erfassungsseite:

   * Nutzer kann die **Kamera öffnen** und ein Foto aufnehmen.
   * Alternativ kann er bei Bedarf ein bereits vorhandenes Bild aus der Galerie wählen.
4. Nach jedem aufgenommenen oder ausgewählten Foto:

   * Das Foto wird in einer Liste/Übersicht angezeigt.
   * Der Nutzer kann direkt darunter eine **Beschreibung** eingeben (z. B. „Rosenstrauch, 1,20 m, Lieferung ab KW 15 möglich“).
5. Nutzer kann mehrere Fotos nacheinander erfassen und beschreiben.
6. Wenn er fertig ist, klickt er auf einen Button wie „PDF erstellen“:

   * Die App erzeugt **lokal im Browser** ein PDF-Dokument mit allen Fotos und den zugehörigen Texten.
   * Das PDF wird zum **Download/Speichern** angeboten (z. B. in der Dateien-App, oder zum Teilen über andere Apps).
7. Nutzer kann das PDF anschließend an Kunden oder Kollegen weitergeben.

### 2.2 Wichtige Eigenschaften aus Nutzersicht

* **Einfache Bedienung**: wenige Buttons, klare Beschriftungen, große Touch-Flächen.
* **Hohe Bildqualität**: Fotos sollen in **hoher oder maximal möglicher Auflösung** aufgenommen werden, damit Details erkennbar sind.
* **Keine Registrierung, kein Login**.
* **Schnelle Reaktion**: trotz hoher Auflösung soll die App möglichst flüssig reagieren.
* **Datenschutz**: Bilder und Texte bleiben standardmäßig auf dem Gerät des Nutzers (keine automatische Übertragung an Server).

---

## 3. Technische Rahmenbedingungen

1. **Astro als Framework**

   * Die App wird mit Astro entwickelt.
   * Astro wird im **statischen Modus** verwendet (statisches HTML, CSS, JS).
   * Interaktive Teile (Kamera, PDF-Erzeugung) laufen als Client-Side-JavaScript in einer Astro-Seite oder Komponente.

2. **Hosting über GitHub Pages**

   * Der Build wird als statische Website auf GitHub Pages veröffentlicht.
   * Die Seite ist über HTTPS erreichbar (wichtig für Kamera-Zugriff).

3. **Kamera-Zugriff**

   * Die App nutzt Standard-Webtechnologie, um auf die Kamera zuzugreifen.
   * Ziel: **möglichst hohe Auflösung** der Bilder, idealerweise die von der Kamera-App gelieferte Standard- oder Maximalauflösung.
   * Bevorzugter Ansatz: über eine Datei-Eingabe (z. B. System-Kamera-UI) statt reinem Video-Stream, um echte Foto-Dateien in hoher Auflösung zu erhalten.

4. **PDF-Erzeugung**

   * Das PDF wird rein clientseitig erstellt (JavaScript-Bibliothek).
   * Die Fotos sollen im PDF so eingebettet werden, dass beim Zoomen möglichst viele Details sichtbar bleiben.
   * Die Texte der Beschreibungen werden zu den jeweiligen Fotos platziert (z. B. darunter oder daneben).

5. **Keine Server-Abhängigkeiten**

   * Es gibt keinen eigenen Application-Server, keine Datenbank und keine Cloud-Funktionen.
   * Alle Funktionen müssen **offline-fähig** sein, sobald die Seite einmal geladen wurde (optional, aber wünschenswert).

---

## 4. Funktionsumfang im Detail

### 4.1 Kamera- und Fotoverwaltung

* Die App bietet eine **klare Schaltfläche** zum Hinzufügen von Fotos.
* Beim Hinzufügen wird:

  * die Smartphone-Kamera geöffnet (oder die Galerie), damit der Nutzer ein neues Foto aufnehmen oder ein vorhandenes auswählen kann.
  * jedes aufgenommene/ausgewählte Foto als **eigenes Element** in einer Liste gespeichert.
* Es soll möglich sein:

  * **mehrere Fotos** nacheinander hinzuzufügen.
  * einzelne Fotos wieder zu **löschen** (falls das Bild fehlerhaft ist oder doppelt).

Schwerpunkt:
Die Fotos sollen in **hoher Bildqualität** vorliegen. Die Anwendung soll **bewusst nicht** die Auflösung der Bilder unnötig verkleinern, sofern das Gerät damit umgehen kann.

### 4.2 Beschreibungen pro Foto

* Zu jedem Foto gehört ein **freier Text**, der individuell bearbeitet werden kann.
* Der Text kann z. B. folgende Informationen enthalten (nur Beispiele, keine Pflicht):

  * Name der Pflanze / des Objekts
  * Sorte / Variante
  * Größe, Zustand, Liefertermin
  * Notizen für den Kunden
* Die Beschreibung soll jederzeit **änderbar** sein (auch nachträglich, bevor das PDF erstellt wird).

### 4.3 Übersicht / Galerie

* Die App zeigt eine **Übersichtsliste** aller bisher aufgenommenen Fotos.
* Jedes Element in dieser Übersicht enthält:

  * eine gut erkennbare **Vorschau** des Fotos,
  * das zugehörige **Beschreibungsfeld**,
  * Steuerelemente (z. B. zum Löschen).
* Optional, aber wünschenswert:

  * Sortierung der Fotos durch den Nutzer (z. B. Reihenfolge ändern), damit das PDF später in der gewünschten Reihenfolge erzeugt wird.

### 4.4 PDF-Erstellung und Download

* Es gibt eine deutliche Schaltfläche „PDF erzeugen“ (oder ähnlich).
* Beim Auslösen:

  * wird aus den aktuell vorhandenen Fotos und ihren Beschreibungen ein **PDF-Dokument** erzeugt.
  * die Fotos werden seitenweise angeordnet (z. B. ein Foto pro Seite, mit Text darunter; oder mehrere pro Seite, aber die Layout-Details können später festgelegt werden).
  * zu jedem Foto wird die entsprechende Beschreibung in Textform ins PDF geschrieben.
* Nach der Erstellung:

  * bietet die App das PDF als **Download** an (Standard-Downloadmechanismus des Browsers, inklusive „In Dateien speichern“ etc.).
  * die Dateien liegen anschließend beim Nutzer auf dem Gerät und können weiterverwendet werden.

---

## 5. Anforderungen an Bildqualität & Performance

### 5.1 Bildqualität

* Ziel ist es, die **höchste praktikable Auflösung** der Kamera zu nutzen, die das Gerät ohne Probleme verarbeiten kann.
* Die App soll **nicht unnötig früh** die Auflösung reduzieren.
* Wenn aus technischen Gründen eine Begrenzung notwendig ist (z. B. wegen Speicher- oder Performanceproblemen), soll diese:

  * **klar dokumentiert** sein,
  * möglichst hoch angesetzt werden,
  * und ggf. als konfigurierbare Option gedacht werden („Hohe Qualität“ vs. „Standardqualität“).

### 5.2 Performance und Stabilität

* Trotz hoher Auflösung soll die App **stabil** bleiben.
* Falls viele sehr große Fotos verwendet werden, soll die App:

  * den Nutzer ggf. informieren (z. B. Hinweis auf große Dateigröße),
  * oder die Anzahl der Fotos sinnvoll begrenzen (z. B. Empfehlung / Hinweis bei sehr vielen Bildern).
* Die App soll auch bei mittleren Geräten (Smartphones im Alltagsgebrauch, keine High-End-Flaggschiffe) verwendbar sein.

---

## 6. UX-, UI- und Design-Anforderungen (Überblick)

* **Responsive Design**: Die App ist primär für Smartphones optimiert, soll aber auch im Desktop-Browser nutzbar sein.
* **Klares Layout**:

  * Bereich für den Aufnahme-/Hinzufüge-Button.
  * Bereich für die Liste der Fotos inkl. Beschreibung.
  * Bereich für Aktionen (z. B. „PDF erzeugen“, „Alle löschen“).
* **Barrierearme Bedienung**:

  * Große Buttons, gut lesbare Beschriftungen.
  * Wenige Schritte, möglichst selbsterklärend.
* **Einfache, neutrale Gestaltung**:

  * Fokus auf Funktion und Lesbarkeit (kein überladenes Design).
  * Optional: Logo, kurze Einleitung, Hinweise für den Nutzer.

---

## 7. Datenschutz & Sicherheit

* Die App überträgt **keine Fotos und Texte automatisch an einen Server**.
* Alle Datenverarbeitung (Fotos laden, Beschreibungen, PDF bauen) findet **lokal im Browser** statt.
* Wenn in Zukunft eine optionale Synchronisation oder ein Upload ergänzt wird, muss dies klar erkennbar und getrennt von der reinen Offline-Nutzung sein.
* Da GitHub Pages per HTTPS ausliefert, wird der **Kamera-Zugriff** über die Browser-Sicherheitsmechanismen geregelt (Nutzer muss die Freigabe explizit erlauben).

---

## 8. Erweiterbarkeit (nur grobe Ideen, nicht Teil der ersten Version)

Diese Punkte sind **nicht** Pflicht in der ersten Version, können aber als zukünftige Erweiterungen vorgesehen werden:

* Optionaler **Offline-Modus** mit Service Worker (PWA), sodass die App auch ohne Internet nutzbar ist, sobald sie einmal geladen wurde.
* Möglichkeit, **Kundendaten** zu erfassen (Name, Kontaktdaten), die im PDF mit erscheinen.
* Option, ein **einheitliches Layout/Branding** für das PDF zu definieren (Logo, Kopfzeile, Fußzeile).
* Export/Import der erfassten Daten (z. B. JSON) zur späteren Weiterbearbeitung.

---
