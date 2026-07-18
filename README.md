# commons

The shared floor of [here.build](https://here.build) and
[inhuman.tools](https://inhuman.tools). Deliberately boring: configuration
bases and small, stable primitives that everything else stands on.

## Packages

- `tsconfig` — TypeScript config bases (`purpose/lib`, `purpose/app`, `env/*`).
- `eslint-config` — shared ESLint flat configs.
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

## Repository shape

Lives a double life: a standalone pnpm/turbo workspace, and an embedded
directory of the here.build product monorepo where day-to-day development
happens. History is real development history.

## License

[Functional Source License, Version 1.1, MIT Future License](./LICENSE.md).
