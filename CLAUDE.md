# slopMachine

<!-- TODO: Replace this paragraph with a concrete description of what slopMachine does. -->
slopMachine is a full-stack web application. This file is the authoritative guide for
Claude Code to work on this project. Keep it up to date as the project evolves.

## Project Layout

```
slopMachine/
├── service/        # Backend — TypeScript + Node.js, deployed as AWS Lambda
│   ├── src/
│   │   ├── app.ts          # Express app — shared by local dev and Lambda
│   │   ├── lambda.ts       # Lambda handler (production entry point)
│   │   ├── index.ts        # Local dev server — calls app.listen()
│   │   ├── features/       # One directory per feature/domain (application core)
|   |   |   |── <domain>/
|   │   │   │   ├── <domain>.routes.ts      # Parse HTTP input, delegate to controller
|   │   │   │   ├── <domain>.model.ts       # Data model / DB schema for this feature
|   │   │   │   |── <domain>.ports.ts       # Port interfaces this feature depends on
│   │   │   |   └── <feature>/  # e.g. auth/, users/, posts/
|   │   │   │       ├── <feature>.interactor.ts  # Business logic — HTTP-agnostic, unit-testable
|   |   |   |       |── <feature>.interactor.test.ts # Tests for the business logic.
│   │   ├── adapters/       # Adapter implementations — one dir per external system
│   │   └── middleware/     # Auth, logging, error handling
│   ├── tests/
│   │   └── integration/    # Integration tests that go through the entire system.
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
pnpm dev            # Start local dev server (tsx watch src/index.ts) on port 3000
pnpm build          # Compile TypeScript to dist/ (tsc)
pnpm start          # Run compiled Lambda handler locally (node dist/lambda.js)
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

### Dual Entry Points

The service has two entry points that share the same Express app (`src/app.ts`):

- `src/lambda.ts` — **production entry point**. Uses `@vendia/serverless-express` to
  translate Lambda proxy events into Express-compatible requests. Deploy this as the Lambda
  handler (`handler` export).
- `src/index.ts` — **local dev entry point**. Calls `app.listen()` so the service runs as
  a plain HTTP server. No Lambda emulator required.

`src/app.ts` owns the Express instance, middleware, and router mounts. It never calls
`listen()` — that concern belongs to `index.ts` only.

### Service Structure

Code is organized by **feature**, not by role. Each feature lives in its own directory
under `src/features/<feature>/` and owns all four layers for that domain:

- `<feature>.routes.ts` — parse HTTP input, delegate to controller. No business logic.
- `<feature>.controller.ts` — orchestrate service calls, format responses. No direct DB calls.
- `<feature>.service.ts` — all business logic. HTTP-agnostic and independently unit-testable.
- `<feature>.model.ts` — data shapes and DB interactions for this feature.

#### Dependency direction

Within a slice, dependencies only point inward:

```
routes → controller → service → model / ports
```

No layer may import from a layer above it. The service must not know about HTTP; the
controller must not query the DB directly.

#### What belongs inside vs. outside a slice

| Location | What lives there |
|---|---|
| `src/features/<feature>/` | Domain types, request/response shapes, business rules, DB queries, port interfaces |
| `src/middleware/` or `src/shared/` | Auth middleware, error base classes, request logging, HTTP utilities |
| `src/adapters/` | Concrete AWS/external adapter implementations |

#### Composition root (`src/index.ts`)

Router factories accept their service as a parameter — no singletons or global registries:

```typescript
// src/index.ts
const storage = new S3StorageAdapter(new S3Client({ region: '...' }));
const uploadsService = new UploadsService(storage);
const uploadsRouter = createUploadsRouter(uploadsService);
app.use('/api/v1/uploads', uploadsRouter);
```

#### Cross-feature dependencies

When feature A needs data owned by feature B, feature A defines a port interface for what
it needs and feature B's service is injected at the composition root. Never import a
controller or route from another feature — only service-level interfaces.

```typescript
// src/features/posts/posts.ports.ts
export interface UserLookupPort {
  findById(id: string): Promise<{ id: string; name: string } | null>;
}

// src/index.ts — UsersService satisfies the interface; injected into PostsService
const postsService = new PostsService(postsDb, usersService);
```

#### Template slice

The `health` feature should serve as the canonical template for new slices. When adding a
feature, copy its structure and follow the `<feature>.<role>.ts` naming convention
throughout (e.g. `health.routes.ts`, not `status.ts`).

Cross-feature dependencies go through service interfaces only — never import a controller or
route from another feature. Shared utilities (e.g. auth middleware, error classes) live in
`src/middleware/` or a `src/shared/` directory if needed.

### Ports and Adapters

The service uses a ports-and-adapters (hexagonal) architecture. The application core
(features) defines what it needs via ports; adapters fulfill those contracts using external
systems (AWS or otherwise).

- **Ports** are TypeScript interfaces defined in `<feature>.ports.ts`, inside the feature
  that depends on them. They use domain language — no AWS types, no SDK imports.
- **Adapters** live in `src/adapters/` and implement port interfaces using real external
  systems. `@aws-sdk/*` imports are only allowed here.
- **Wiring** happens at `src/index.ts` (the composition root) — this is the only place that
  imports both a service and its adapter to connect them.
- Services receive ports via **constructor injection**. They never instantiate adapters or
  import SDK clients.

**Example:**

```typescript
// src/features/uploads/uploads.ports.ts — domain interface, no AWS
export interface StoragePort {
  upload(key: string, body: Buffer, contentType: string): Promise<void>;
  download(key: string): Promise<Buffer>;
}

// src/adapters/s3/s3Storage.adapter.ts — AWS confined here
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
export class S3StorageAdapter implements StoragePort { ... }

// src/features/uploads/uploads.service.ts — no AWS, no adapter import
export class UploadsService {
  constructor(private readonly storage: StoragePort) {}
}

// src/index.ts — composition root wires everything together
const storage = new S3StorageAdapter(s3Client);
const uploadsService = new UploadsService(storage);
```

In tests, swap the adapter for an in-memory stub — no mocking frameworks needed.

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
  `src/features/users/users.service.ts` → `tests/unit/features/users/users.service.test.ts`
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
- **No AWS SDK outside `adapters/`**: Never import `@aws-sdk/*` in `features/`, `middleware/`,
  or anywhere outside `src/adapters/`. Violations break testability and couple business logic
  to external systems.
- **CORS**: Never use a wildcard `*` origin in production CORS configuration.
- **Unhandled promises**: All async route handlers must be wrapped in error-catching
  middleware or a helper — never let an unhandled rejection crash the server.
