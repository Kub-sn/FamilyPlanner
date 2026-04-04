# Repository Agent Rules

## Review First

- After every code change, do a short, hard code review of your own changes first.
- Always focus on bugs, regression risks, security issues, unclear assumptions, and missing tests.
- The review comes before adjusting or writing new tests.

## Test Policy

- Every behavioral change requires unit tests or updated existing unit tests.
- Every relevant user flow change requires E2E tests or updated existing E2E tests.
- Standard tools:
  - Unit: Vitest + Testing Library
  - E2E: Playwright

## Execution Policy

- At the end of a change, always run this sequence:
  1. `npm run test:unit`
  2. `npm run test:e2e`
- If there are failures, fix the code or configuration first.
- Then rerun only the tests that were failing before.
- A change is not finished as long as the build or tests are failing.
