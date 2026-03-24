# Familienplaner

Ein erster MVP fuer eine familienfreundliche Planer-App, die im Browser laeuft, lokal speichert und fuer Supabase sowie Android mit Capacitor vorbereitet ist.

## Enthaltene Bereiche

- Einkaufsliste
- To-do-Listen
- Notizen
- Kalender
- Essensplan
- Dokumente
- Rollenmodell mit `admin` und `familyuser`

## Technik

- Vite
- React
- TypeScript
- PWA-Basis mit `manifest.webmanifest`
- Local Storage fuer sofortige Persistenz
- Supabase-Client vorbereitet fuer Auth, Sync und Familienfreigaben
- Capacitor-Konfiguration fuer Android

## Aktueller Stand

Die App speichert ihren Zustand jetzt dauerhaft in Local Storage. Zusaetzlich sind Supabase und Capacitor vorbereitet, damit du auf echte Benutzerkonten, Familienfreigaben und eine Android-App erweitern kannst. Alle Planer-Module laufen fuer angemeldete Nutzer jetzt ueber Supabase. Eingebaute Mock-Daten wurden entfernt, neue Konten starten leer.

## Empfehlung zur Speicherung

- Kurzfristig: Local Storage ist perfekt fuer schnelles Prototyping und Offline-MVPs.
- Mittelfristig: Supabase ist die richtige Wahl fuer mehrere Benutzer, Familienfreigaben und Geraete-Synchronisierung.
- Empfehlung fuer dieses Projekt: Local Storage fuer den aktuellen Stand behalten und anschliessend auf Supabase fuer Benutzerkonten und gemeinsame Daten erweitern.

## Sicherheit mit Supabase

- Supabase ist fuer diesen Anwendungsfall ausreichend sicher, wenn du Row Level Security aktivierst.
- Der `anon key` ist nicht geheim. Sicherheit entsteht durch Authentifizierung, Policies und saubere Datenmodellierung.
- Bei neuen Supabase-Projekten kannst du statt des alten `anon key` direkt den `publishable key` verwenden.
- Rollenmodell in diesem Projekt: `admin` und `familyuser`.
- Beispieltabellen und erste Policies liegen in `supabase/schema.sql`.

## Supabase einrichten

1. `.env.example` nach `.env` kopieren.
2. `VITE_SUPABASE_URL` und `VITE_SUPABASE_PUBLISHABLE_KEY` eintragen.
3. SQL aus `supabase/schema.sql` im Supabase SQL Editor ausfuehren.
4. Danach Auth und Datenabgleich im Frontend aktivieren.

## Auth-Flow

- Registrierung mit E-Mail und Passwort ist im Frontend eingebaut.
- Nach der ersten Anmeldung wird automatisch ein eigenes Profil in `profiles` angelegt.
- Wenn noch keine Familie existiert, fuehrt die App in ein Onboarding und legt eine neue Familie an.
- Der erste Benutzer dieser Familie wird automatisch `admin`.
- Weitere Benutzer laufen spaeter ueber gemeinsame Cloud-Tabellen und Einladungslogik.

## Erste Cloud-Module

- Einkauf, To-dos, Notizen, Kalender, Essensplan und Dokumente werden fuer authentifizierte Familienmitglieder aus Supabase geladen.
- Neue Einkaufsartikel, Aufgaben, Notizen, Termine, Gerichte und Dokumente werden direkt in Supabase gespeichert.
- Dokumente koennen optional einen Link auf eine externe Datei oder Freigabe enthalten.
- Dokumente koennen ausserdem direkt als Datei in Supabase Storage hochgeladen werden, zum Beispiel als PDF oder Foto.
- Dokumente unterstuetzen jetzt auch Word-Dateien, Mehrfach-Upload, Drag and Drop, Vorschaubilder fuer Bilder sowie Loeschen inklusive Storage-Datei.
- Die Dokumentansicht bietet Suche, Filter und Sortierung, Bearbeiten der Metadaten und eine In-App-Vorschau fuer Bilder und PDFs.
- Statusaenderungen bei Einkauf, To-dos und Essensplan werden direkt in Supabase aktualisiert.
- Wichtig: Nach der Schema-Erweiterung musst du das aktuelle SQL aus `supabase/schema.sql` in Supabase erneut ausfuehren.

## Familien-Einladungen

- Admins koennen Einladungen fuer weitere Familienmitglieder per E-Mail anlegen.
- Registriert oder meldet sich ein Nutzer mit derselben E-Mail an, wird die Einladung beim Login automatisch angenommen.
- Fuer bestehende Supabase-Projekte fuehre zusaetzlich `supabase/add-family-invites.sql` aus.
- Fuer bestehende Supabase-Projekte mit Dokument-Uploads fuehre zusaetzlich `supabase/add-document-uploads.sql` aus. Das aktuelle Skript enthaelt jetzt auch die Update-Policy fuer bearbeitbare Dokument-Metadaten.

## Supabase Troubleshooting

- Wenn Supabase `infinite recursion detected in policy for relation "family_members"` meldet, fuehre fuer bestehende Projekte das SQL aus `supabase/fix-family-members-recursion.sql` im SQL Editor aus.
- Ursache war eine rekursive RLS-Pruefung auf `family_members`. Das Fix-Script ersetzt diese Pruefungen durch sichere Helper-Funktionen.

## Rollen

- `admin`: darf Familie anlegen und verwalten.
- `familyuser`: arbeitet mit den Inhalten im Alltag.

## Testen des Auth-Setups

1. In Supabase unter Authentication den E-Mail-Provider aktivieren.
2. Optional E-Mail-Bestaetigung konfigurieren.
3. App starten und einen neuen Benutzer registrieren.
4. Nach dem Login die Familie anlegen.
5. Danach steht die geschuetzte App-Ansicht bereit.

## CI

Eine GitHub-Actions-Pipeline liegt in `.github/workflows/ci.yml` und fuehrt fuer Pushes und Pull Requests aus:

1. `npm run build`
2. `npm run test:unit`
3. `npm run test:e2e`

## Android mit Capacitor

Nach einem erfolgreichen Web-Build:

```bash
npm run build
npm run cap:sync
npm run cap:android
```

Hinweis: Fuer den letzten Schritt brauchst du Android Studio.

## Starten

Voraussetzung: Node.js und npm muessen installiert und im Pfad verfuegbar sein.

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
