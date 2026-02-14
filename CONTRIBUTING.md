# Contributing to blur-reveal-input

Thanks for your interest in contributing! This guide will get you up and running.

## Setup

```bash
git clone https://github.com/iLoveMyCat/blur-reveal-input.git
cd blur-reveal-input
npm install
```

## Development

```bash
npm run dev          # Start dev server (Vite) with live reload
npm test             # Run tests in watch mode
npm run build        # Build all dist formats (ESM, UMD, IIFE, types)
```

## Testing

Tests use [Vitest](https://vitest.dev/) with jsdom:

```bash
npm test                # Watch mode
npm run test:coverage   # Coverage report
```

Please add or update tests for any code changes. All tests must pass before merging.

## Project structure

```
src/
  index.ts              # Public API exports
  blur-reveal-input.ts  # Main class (orchestrates renderer + adapters)
  blur-renderer.ts      # DOM structure, overlays, CSS variables
  platform-adapter.ts   # Desktop (mouse) and mobile (touch) handlers
  styles.ts             # Injected CSS
  config.ts             # Types, defaults, CSS class/variable names
  auto-apply.ts         # Auto-enhances password inputs (CDN usage)
  utils.ts              # Shared helpers
```

## Submitting a PR

1. Fork the repo and create a branch from `master`
2. Make your changes
3. Add or update tests as needed
4. Run `npm test` and `npm run build` — both must pass
5. Open a PR with a clear description of what and why

## Reporting bugs

Open an [issue](https://github.com/iLoveMyCat/blur-reveal-input/issues) with:
- What you expected vs. what happened
- Browser and OS
- A minimal reproduction if possible

## Code style

- TypeScript, no `any` types
- Prettier for formatting (`npm run format`)
- ESLint for linting (`npm run lint`)

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
