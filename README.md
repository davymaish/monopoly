# Monopoly

An in-progress browser-based, local pass-and-play Monopoly game for 2–4 players sharing one device. A minimal Vite shell is in place; gameplay and application code will arrive in focused pull requests.

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

After installation, `pnpm dev` starts the local Vite server at `http://localhost:5173`. Run `pnpm build` to create the production output in `dist/`.

## Project layout

The application source will live under `src/`, organized by responsibility:

- `src/app/` — application shell and top-level game screen
- `src/game/` — typed board data, rules, state, and transitions
- `src/components/` — setup, board, controls, panels, and dialogs
- `src/styles/` — board and responsive styles
- `src/test/` — rule, reducer, and component tests

The `src/` tree will be added when the application shell is introduced. The repository root currently contains shared project configuration, documentation, and the license.

## Repository baseline

- `.gitignore` excludes dependencies, generated build/test output, local environment files, and machine-specific editor/OS files. A future `.env.example` may be committed; real environment files and secrets must not be.
- `.editorconfig` defines consistent UTF-8, LF line endings, final newlines, and two-space indentation.
- `LICENSE` currently provides the MIT license.

Vite dev/build scripts are available. React/TypeScript, test tooling, CI, and game functionality remain later roadmap milestones.
