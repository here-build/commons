# @here.build/tsconfig

Shared TypeScript config bases for Here.build. Compose one **purpose** with one **environment** in your `tsconfig.json` `extends` array.

## Install

```bash
pnpm add -D @here.build/tsconfig typescript
```

## Usage

```jsonc
// tsconfig.json
{
  "extends": [
    "@here.build/tsconfig/purpose/lib",
    "@here.build/tsconfig/env/node"
  ],
  "compilerOptions": { "rootDir": "./src", "outDir": "./dist" }
}
```

- **purpose** (compilation intent):
  - `purpose/lib` — NodeNext libraries that emit declarations.
  - `purpose/app` — bundler/ESNext applications.
- **env** (target + lib):
  - `env/node` (also exported as `env/cf`), `env/browser`, `env/browser-widespread` (ES2022), `env/consumer` (ES2017).

## License

[MIT](./LICENSE.md)
