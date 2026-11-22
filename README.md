# Monopoly

An in-progress browser-based, local pass-and-play Monopoly game for 2–4 players sharing one device. A typed React/TypeScript entry is in place; game features will arrive in focused pull requests.

## Planned stack

- React, TypeScript, and Vite
- CSS Grid for the classic 11×11 board perimeter
- Vitest and React Testing Library
- Local play only: no accounts, backend, or online multiplayer

## Toolchain and installation

Use the Node.js version pinned in `.nvmrc` (26.13.1). `package.json` pins pnpm to 12.21.0. Install dependencies from the committed lockfile with this single command:

```sh
npm exec --yes --package=pnpm@12.21.0 -- pnpm install --frozen-lockfile
```

The command invokes the pinned pnpm version and fails rather than rewriting the lockfile.

## Run and build

After installation, `pnpm dev` starts the local Vite server at `http://localhost:5173`. Run `pnpm typecheck` to check the strict TypeScript source, `pnpm format` to apply formatting, `pnpm format:check` to verify formatting, `pnpm lint` to run ESLint, `pnpm test` to run Vitest, and `pnpm build` to create production output in `dist/`.

GitHub Actions runs the frozen install, format check, lint, type-check, tests, and production build on pull requests to `main` and pushes to `main`.

## Project layout

The current entry points are `src/main.tsx` and `src/App.tsx`; the source will expand by responsibility:

- `src/app/` — application shell and top-level game screen
- `src/game/` — typed board data, rules, state, and transitions
- `src/components/` — setup, board, controls, panels, and dialogs
- `src/styles/` — board and responsive styles
- `src/test/` — rule, reducer, and component tests

The `src/` tree will expand across the roadmap. The repository root contains shared project configuration, documentation, and the license.

## Repository baseline

- `.gitignore` excludes dependencies, generated build/test output, local environment files, and machine-specific editor/OS files. A future `.env.example` may be committed; real environment files and secrets must not be.
- `.editorconfig` defines consistent UTF-8, LF line endings, final newlines, and two-space indentation.
- `LICENSE` currently provides the MIT license.

Vite, typed React/TypeScript, formatting, lint, and test commands are available; game functionality remains later roadmap milestones.
