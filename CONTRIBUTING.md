# Contributing

Thanks for helping improve this in-progress local pass-and-play game. Keep changes focused on one roadmap slice where possible.

## Set up and run checks

Use the Node.js version in `.nvmrc` and the pnpm version pinned in `package.json`. From the repository root, install exactly from the lockfile:

```sh
npm exec --yes --package=pnpm@12.21.0 -- pnpm install --frozen-lockfile
```

If `pnpm` is not already on your `PATH`, run each script below as `npm exec --yes --package=pnpm@12.21.0 -- pnpm <command>`.

Available scripts:

| Command               | Purpose                                 |
| --------------------- | --------------------------------------- |
| `pnpm dev`            | Start the Vite development server       |
| `pnpm format`         | Apply Prettier formatting               |
| `pnpm format:check`   | Check formatting without changing files |
| `pnpm lint`           | Run ESLint                              |
| `pnpm typecheck`      | Run the strict TypeScript check         |
| `pnpm test`           | Run Vitest tests                        |
| `pnpm contrast:check` | Check theme color contrast              |
| `pnpm build`          | Create the production build in `dist/`  |

GitHub Actions runs the frozen install and all checks above on pull requests to `main` and pushes to `main`.

## Branches, commits, and pull requests

- Start each change from the latest `main`; do not commit directly to `main`.
- Use a short descriptive branch name such as `app-shell` or `visual-tokens`; a PR number or `chore` prefix is not required.
- Use Conventional Commit prefixes such as `feat:`, `fix:`, `test:`, `refactor:`, `docs:`, and `chore:`. For a roadmap PR, aim for 2–4 meaningful commits where the work supports that; do not split changes merely to increase the count.
- Open a PR against `main`. Explain its objective and scope, note relevant rule or implementation decisions, and list the checks run. Include screenshots for visible UI changes.
- Keep the PR’s checks green and follow repository branch protection. Merge through the agreed repository method; do not bypass protections.

## Support and issue reporting

Use [GitHub Issues](https://github.com/davymaish/monopoly/issues) for reproducible bugs, project questions, and feature suggestions. Include the operating system, Node.js version, steps to reproduce, and relevant non-sensitive logs. Never post credentials, tokens, or personal data.

This is an in-progress project; support is best-effort and no response time is guaranteed. Do not disclose security-sensitive details in a public issue; use GitHub’s private vulnerability reporting if it is enabled for the repository.
