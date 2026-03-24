# Repository Agent Rules

## Review First

- Nach jeder Codeänderung zuerst eine kurze, harte Code-Review auf die eigenen Änderungen machen.
- Fokus immer auf Fehler, Regressionsrisiken, Sicherheitslücken, unklare Annahmen und fehlende Tests.
- Review kommt vor dem Anpassen oder Schreiben neuer Tests.

## Test Policy

- Jede Verhaltensänderung braucht Unit-Tests oder aktualisierte bestehende Unit-Tests.
- Jede relevante Nutzerfluss-Änderung braucht E2E-Tests oder aktualisierte bestehende E2E-Tests.
- Standardwerkzeuge:
  - Unit: Vitest + Testing Library
  - E2E: Playwright

## Execution Policy

- Am Ende einer Änderung immer diese Reihenfolge ausführen:
  1. `npm run test:unit`
  2. `npm run test:e2e`
- Bei Fehlern zuerst Code oder Konfiguration beheben.
- Danach nur die zuvor kaputten Tests erneut laufen lassen.
- Eine Änderung ist nicht fertig, solange Build oder Tests fehlschlagen.
