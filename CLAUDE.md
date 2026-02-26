# slopMachine

<!-- TODO: Replace this paragraph with a concrete description of what slopMachine does. -->
slopMachine is a full-stack web application. This file is the authoritative guide for
Claude Code to work on this project. Keep it up to date as the project evolves.

## Project Layout

```
slopMachine/
├── service/        # Backend — TypeScript + Node.js
│   ├── src/
│   │   ├── routes/         # Route handlers — parse HTTP input, delegate to controllers
│   │   ├── controllers/    # Orchestrate service calls, format responses
│   │   ├── services/       # Business logic — HTTP-agnostic, unit-testable
│   │   ├── models/         # Data models / DB schema definitions
│   │   ├── middleware/     # Auth, logging, error handling
│   │   └── index.ts        # Entry point
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.example        # Committed env template — never commit .env
└── ui/             # Frontend — Vanilla JS, no framework
    ├── src/
    │   ├── pages/          # One JS module per page/view
    │   ├── components/     # Reusable DOM-building functions
    │   ├── api/            # fetch() wrappers for all service calls
    │   ├── state/          # Client-side state management
    │   └── utils/          # Pure utility functions
    ├── public/
    │   ├── index.html
    │   └── assets/         # Images, fonts, icons
    └── styles/             # CSS; one file per component or page
```

## Commands

Run service commands from `service/`, UI commands from `ui/`.

### Service

```bash
pnpm install        # Install dependencies
pnpm dev            # Development server with hot reload
pnpm build          # Production build
pnpm test           # Run all tests
pnpm test:watch     # Watch mode
pnpm lint           # Lint
pnpm lint:fix       # Lint and auto-fix
pnpm format         # Format with Prettier
pnpm typecheck      # Type-check without emitting
```

### UI

```bash
# TODO: Update once build tooling is decided
pnpm dev            # Serve UI locally
pnpm lint           # Lint JS/CSS
```

### Root (Monorepo)

```bash
# TODO: Wire up root scripts once both packages are initialized
pnpm dev            # Run service + ui in parallel
```

## Architecture

### Service Layering

- **Routes** only parse HTTP input and delegate to controllers. No business logic.
- **Controllers** orchestrate service calls and format responses. No direct DB calls.
- **Services** contain all business logic. HTTP-agnostic and independently unit-testable.
- **Models** define data shapes and interact with the database.

### Frontend

The UI is intentionally plain Vanilla JS — no framework.

- Each page is driven by a module in `ui/src/pages/`.
- DOM construction uses helper functions in `ui/src/components/`, never `innerHTML` string
  concatenation (prevents XSS).
- All `fetch()` calls go through `ui/src/api/` — never directly in page or component code.
- Styling uses CSS classes, never inline styles.

### Service-UI Contract

The service exposes a JSON REST API under `/api/v1/`. All responses use this envelope:

```json
{ "data": ..., "error": null }
{ "data": null, "error": { "code": "...", "message": "..." } }
```

## Code Style

### TypeScript (Service)

- `"strict": true` in tsconfig. No `any` — use `unknown` and narrow it.
- `interface` for object shapes; `type` for unions and mapped types.
- Named exports only. No default exports.
- Async functions return typed promises: `Promise<ResultType>`, not `Promise<any>`.
- Errors: throw typed custom error classes (extend `Error`), not strings.

### JavaScript (UI)

- ES2022+ syntax. No transpilation assumed until a bundler is added.
- `const` by default; `let` only when reassignment is required; never `var`.
- Attach event listeners in JS — never use `onclick=""` attributes in HTML.
- Keep functions under ~30 lines. Extract helpers liberally.

### General

- 2-space indentation (JS, TS, JSON, HTML, CSS).
- Single quotes in JS/TS; double quotes in JSON and HTML attributes.
- Trailing commas in multi-line JS/TS structures.
- Max line length: 100 characters.
- File naming: `camelCase.ts`, `kebab-case.css`, `kebab-case.html`.
- `camelCase` for variables and functions; `PascalCase` for types; `UPPER_SNAKE_CASE` for constants.

### ESLint + Prettier

- Prettier owns all formatting decisions. Do not fight it.
- Code must pass `pnpm lint` and `pnpm format --check` before committing.

## Environment Variables

- Never commit `.env`. Always commit `.env.example` with dummy values and comments.
- All env vars are read and validated at startup in `service/src/config.ts`. Fail fast if
  required vars are missing — never access `process.env` elsewhere.
- Never log, return in API responses, or commit secrets or tokens.

## Testing

- Unit tests: `tests/unit/`, mirroring the source structure.
  `src/services/userService.ts` → `tests/unit/services/userService.test.ts`
- Integration tests (require a running server or DB): `tests/integration/`.
- Test files use the `.test.ts` suffix.
- Mock all external I/O (DB, HTTP calls). Tests must not make real network requests.
- Tests must be fast (< 1s each) and isolated (no shared mutable state between tests).

## Git Workflow

- Branch naming: `feat/<desc>`, `fix/<desc>`, `chore/<desc>`, `docs/<desc>`.
- Commit messages follow Conventional Commits:
  `<type>(<scope>): <imperative description>`
  Examples: `feat(auth): add JWT refresh endpoint`, `fix(ui): correct button disabled state`
- Claude may commit autonomously when a discrete task is complete AND lint + typecheck + tests
  all pass.
- Claude must NOT push to remote unless explicitly asked.
- One logical change per commit. No commented-out code or leftover debug logs in commits.

## Constraints and Gotchas

- **pnpm only**: Never run `npm install` or `yarn`. Delete any `package-lock.json` or
  `yarn.lock` if found — only `pnpm-lock.yaml` is correct.
- **No UI framework**: Do not introduce React, Vue, Svelte, or any framework without explicit
  instruction. Vanilla JS is intentional.
- **No bundler assumed**: Do not add Webpack, Rollup, Vite, or esbuild to the UI without
  explicit instruction.
- **No `@ts-ignore`**: Do not suppress TypeScript errors with `@ts-ignore` or
  `@ts-expect-error` without a comment explaining exactly why it is unavoidable.
- **CORS**: Never use a wildcard `*` origin in production CORS configuration.
- **Unhandled promises**: All async route handlers must be wrapped in error-catching
  middleware or a helper — never let an unhandled rejection crash the server.
