<!--
  Pull-request template — ENG-P0-002 (CI Pipeline, Templates and Change-Tracking Scaffold).
  Fill in every section. Delete this comment block before submitting.
-->

## Summary

<!-- One or two sentences: what does this PR do, and why? -->

## Related IDs

- Work package: <!-- e.g. ENG-P1-001 -->
- Requirement ID(s): <!-- e.g. FR-OPS-004 -->
- Decision ID(s): <!-- e.g. DEC-TECH-003 -->

## Testing Performed

<!-- Exact commands run locally and their result. Link the CI run once it completes. -->

- [ ] `pnpm build`
- [ ] `pnpm lint`
- [ ] `pnpm format:check`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm test:e2e`
- [ ] `pnpm emulators:validate`

## Screenshots

<!-- If this PR changes any visible UI, attach before/after screenshots. Delete this section if not applicable. -->

## Rollback Plan

<!-- Exact files/commits to revert if this change needs to be undone. See the Implementation Report's Rollback Instructions section. -->

## Checklist

- [ ] Build, lint, format check, typecheck, and tests all pass locally.
- [ ] No files outside this work package's approved scope were modified.
- [ ] `docs/changes/IMPLEMENTATION_CHANGES.md` has a new entry for this work package.
- [ ] The Implementation Report is complete and linked above.
- [ ] No secret, credential, or live Firebase project reference was introduced.
- [ ] No product-domain code was introduced unless this work package is explicitly scoped to do so.
