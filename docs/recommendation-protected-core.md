# Recommendation Protected Core

The protected paths are defined in the root `AGENTS.md`.

For a pull request limited to UI, visa, materials, content, or application work,
apply exactly one of these labels:

- `ui-only`
- `visa-only`
- `materials-only`
- `content-only`
- `application-only`

The `CI / test:ci` check maps that label to `PR_SCOPE` and fails with the exact
file list if the PR changes Recommendation Protected Core. A PR intentionally
changing the core must not use a restricted label; its description must explain
the reason and include the complete `npm run test:ci` result.

Repository administrators must create these five labels before relying on the
scope gate. The gate remains unrestricted when no recognized label is present.

## Database security scope

Production database migrations, RLS policies, storage policies, and their complete integration tests are intentionally outside this recommendation-stability PR. They must be introduced and reviewed together in a separate database security PR. The CI suite in this PR does not reference migration files that are absent from the repository.
