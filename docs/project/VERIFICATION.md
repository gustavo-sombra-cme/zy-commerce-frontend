# Verification

Run these commands before completing frontend behavior changes:

```powershell
npm run build
npm test -- --no-watch --no-progress
npm audit --omit=dev
```

## Command Purpose

- `npm run build`: verifies Angular production compilation, template type checking, routing chunks, and budgets.
- `npm test -- --no-watch --no-progress`: runs the unit test suite once.
- `npm audit --omit=dev`: checks production dependency advisories.

## Documentation-Only Changes

For documentation-only harness changes:

- Do not change application behavior.
- Inspect changed files.
- Run build/test only if the documentation change also touched Angular code or project config.
