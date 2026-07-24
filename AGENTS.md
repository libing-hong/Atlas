# Atlas repository rules

## Recommendation Protected Core

Protected paths:

- `src/lib/recommendation/**`
- `src/app/api/recommendations/**`
- `data/programmes/**`
- `src/lib/student-profile.ts`

UI, visa, materials, application, navigation, copy, and styling changes must not
modify the Protected Core by default. If a core change is required, the PR must
explain why and run the complete recommendation regression suite.

1. Never paste terminal/tool metadata (`Exit code:`, `Wall time:`, `Output:`) into source files.
2. Never delete, skip, or weaken a test to make a build pass.
3. Never add one-school or one-subject hard-coding in place of a general solution.
4. One PR must address one clearly stated scope.
5. Codex must report changed files, test commands and results, and whether the Protected Core changed.

Run `npm run test:ci` after every Protected Core change.
