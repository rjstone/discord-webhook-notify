# Contributing

Thanks for helping improve **discord-webhook-notify**. This is a small GitHub Action with extreme unit tests and CI tooling: most work is JavaScript under `src/`, bundled into `dist/` for runtime.

## Ground rules

- Open an [issue](https://github.com/rjstone/discord-webhook-notify/issues) for bugs or feature ideas when practical (especially behavior changes).
- Prefer a **focused PR** against **`main`** for features (not `v2`).
- Target a minor fix **super-focused PR** that should go out immediately at the `v2` branch but if in doubt target `main`
- Keep the public action API backward compatible within v2 (`uses: …@v2`). Breaking changes belong in a future major (v3+).
- Do not commit secrets, webhook URLs, or local env files (`.env`, lockfiles used for rate-limit testing, etc.).
- Security-sensitive reports: see [SECURITY.md](SECURITY.md).

## Branch and release model (so PRs land in the right place)

| Ref | Role |
| --- | --- |
| **`main`** | Development trunk. Open PRs here. |
| **`v2`** | Floating major line for consumers (`uses: rjstone/discord-webhook-notify@v2`). Maintainers promote from `main`; do not target feature work only at `v2`. |
| **`v2.x.y` tags** | Immutable releases. Prefer pinning these in production workflows. |
| **`feat-*`** | Feature branches; CI is configured to run on this pattern. |
| **`v1` / `v1.x.y`** | Legacy; not supported. |

Semver for this action (consumer-facing):

- **patch** — bug fixes only
- **minor** — new optional inputs / backward-compatible behavior
- **major** — breaking `with:` or behavior changes

`package.json` `"version"` should match the release tag when cutting a release.

## Development setup

Requirements: **Node.js ≥ 20** (see `.node-version`).

```bash
git clone https://github.com/rjstone/discord-webhook-notify.git
cd discord-webhook-notify
npm install
```

Useful scripts:

| Script | Purpose |
| --- | --- |
| `npm test` | Unit tests (Jest) |
| `npm run test-ci` | CI-style tests with coverage |
| `npm run lint` | ESLint |
| `npm run package` | Build `dist/index.js` via Rollup (**required** before shipping action changes) |
| `npm run local-action` | Run against `src` with `@github/local-action` (needs a local `.env`) |
| `npm run local-action-dist` | Same, against the packaged `dist` entry |

The action entrypoint is `dist/index.js` (`action.yml` → `runs.main`). **Source-only changes are not what GitHub Actions executes** until you rebuild `dist/`.

### Local webhook testing

1. Create a Discord webhook in a test channel.
2. Put the URL in a file **outside** the repo if using debug helpers, or use `.env` for `@github/local-action` (never commit it).
3. Prefer mocked unit tests in `__tests__/` for routine work.

## Making changes

1. Branch from up-to-date `main` (e.g. `yourusername/feat-my-change`).
2. Edit `src/` (and `action.yml` / README when inputs or behavior change).
3. Add or update tests under `__tests__/`.
4. Run `npm run lint` and `npm test`.
5. Run `npm run package` and include updated **`dist/`** in the PR when runtime behavior changes.
6. Open a PR to **`main`**.

### Input / docs checklist

If you add or change an input:

- [ ] Declare it in `action.yml` with a clear description
- [ ] Implement in `src/` and cover with tests
- [ ] Rebuild `dist/`
- [ ] Document in `README.md` (inputs section and an example if non-obvious)

### Experimental / passthrough features

Raw **`embeds`** and **`components`** are intentionally thin passthroughs (YAML/JSON strings). Prefer documenting limits and Discord constraints over building a full schema validator unless there is a strong reason.

Note that Discord may just decide to filter out any webhook features at any moment or place constraints on them which cause them to siletly fail, so who knows what will work. Typically the details are not well documented and trial-and-error is often the only option.

Not all Discord components work on **webhooks** (no bot interaction endpoint), and what works and what doesn't is also usually undocumented.

## Code style

- ES modules (`"type": "module"`).
- Match existing patterns in `src/` and tests (including Jest ESM mocking via `__fixtures__/`).
- Prefer small, explicit helpers over large refactors in the same PR.

## CI

On push to `main`, `v2`, and `feat-*` (with path filters), workflows typically run:

- Unit tests / lint
- Dist smoke tests (multi-OS + sample embeds/components)
- CodeQL

PRs should stay green. Smoke tests need a repo secret webhook where configured; unit tests should not require a live Discord channel.

## After merge (maintainers)

Typical ship path:

1. Land PR on **`main`**.
2. Bump `package.json` (and lockfile root version) if releasing.
3. Tag **`v2.x.y`**, publish a GitHub Release.
4. Merge/promote **`main` → `v2`** so `@v2` consumers receive the update.
5. Avoid retagging published tags unless fixing a mistaken release.

## License

By contributing, you agree that your contributions are licensed under the same terms as this repository: [MIT](LICENSE).
