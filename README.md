# commons

The shared floor of [here.build](https://here.build) and
[inhuman.tools](https://inhuman.tools). Deliberately boring: configuration
bases and small, stable primitives that everything else stands on.

## Packages

- `tsconfig` — TypeScript config bases (`purpose/lib`, `purpose/app`, `env/*`).
- `eslint-config` — shared ESLint flat configs (`@here.build/eslint-configs`).
- `collections` — small collection primitives: multimaps, computed/defaulted
  maps, ordinal keys, path maps; MobX-aware where it matters.
- `chunked-websocket` — chunked transport over WebSocket (incl. a Durable
  Object flavor).
- `error-invariant` — `invariant()` with honest error types.
- `lexical-namer` — deterministic identifier allocation: candidate ladders,
  collision resolution, destructure handling.
- `arrival-env` — types and protocol for arrival S-expression serialization
  (lives here because both product families need it; it is the floor's only
  arrival-flavored piece).
- `editor-theme` — hermetic CodeMirror 6 look pack: self-hosted fonts (OFL)
  and H-K-compensated Darcula chrome for editors in both products. No CDN.
- `postcss-oklch-plus` — build-time `oklch()` / `oklchhk()` with correct gamut
  clamping and Helmholtz–Kohlrausch compensation.

## Repository shape

This is a standalone pnpm/turbo workspace. Day-to-day development also happens
inside the private here.build monorepo (`commons/` directory); this repository
is the public home and npm publish source. History is projected from monorepo
development history under a single publishing identity.

## License

[MIT](./LICENSE.md), except `packages/lexical-namer` which is
[FSL-1.1-MIT](./packages/lexical-namer/LICENSE.md).
