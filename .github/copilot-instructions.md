# Repository Rules

## Review First

- For every code change, do a short, honest code review of your own changes first.
- Review focus: bugs, risks, regression potential, security issues, missing tests, and sloppy assumptions.
- Be direct and brutally honest. Do not downplay risks.
- The review comes before adjusting or writing new tests.

## Test Policy

- Every functional change needs appropriate unit tests or a conscious justification for why none are meaningful.
- Every relevant user flow change needs appropriate E2E tests or a conscious justification for why none are meaningful.
- When adding or refactoring dialogs/modals, prefer reusing `src/components/planner/ModalDialog.tsx` whenever practical instead of creating bespoke dialog shells.
- For all new UI styling and UI refactors, use Tailwind CSS by default.
- Do not add or expand component styling in `src/styles.css` unless it is truly global, required for third-party/browser quirks, or cannot be expressed cleanly in Tailwind.
- Keep Tailwind code readable: prefer consistent utility ordering and extract repeated utility groups into small reusable components when that improves maintainability.
- Standard tools:
  - Unit: Vitest + Testing Library
  - E2E: Playwright

## Execution Policy

- After changes, always run `npm run test:unit` and `npm run test:e2e`.
- If tests fail, fix the root cause in the code first instead of watering down the tests.
- Then rerun the previously failing tests until they are green.
- A change is not finished as long as the build or tests are failing.

## Frontend / React

When working on frontend code (files under `src/`), also follow the guidelines in [REACT_BEST_PRACTICES.md](../REACT_BEST_PRACTICES.md).