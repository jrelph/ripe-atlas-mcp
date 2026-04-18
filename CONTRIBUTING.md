# Contributing to RIPE Atlas MCP Server

Thanks for your interest in contributing! This project is open to contributions of all kinds — bug fixes, new features, documentation improvements, and more.

## Getting Started

```bash
git clone https://github.com/jrelph/ripe-atlas-mcp.git
cd ripe-atlas-mcp
npm install
npm run build
```

### Running locally

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

You'll need a [RIPE Atlas API key](https://atlas.ripe.net/keys/) for measurement creation. Read-only operations work without one.

```bash
export RIPE_ATLAS_API_KEY=your_key_here
```

## Making Changes

1. **Fork the repo** and create a branch from `main`
2. **Make your changes** — keep commits focused and descriptive
3. **Build and test** — ensure `npm run build` passes with zero errors
4. **Submit a PR** — describe what you changed and why

### Code Style

- TypeScript with `strict: true`
- Input validation via [Zod](https://zod.dev/) schemas
- Keep tool definitions in `src/tools/`, schemas in `src/schemas/`

### Adding a New Tool

1. Define the Zod schema in `src/schemas/`
2. Implement the tool handler in `src/tools/`
3. Register it in `src/index.ts`
4. Update `README.md` with the new tool's description and parameters

### Adding a New Measurement Type

If RIPE Atlas adds a new measurement type, follow the pattern in `src/tools/measurements.ts` — each type has a create function, a schema, and a formatter for results.

## Reporting Issues

- **Bugs** — use the [bug report template](https://github.com/jrelph/ripe-atlas-mcp/issues/new?template=bug_report.md)
- **Feature requests** — use the [feature request template](https://github.com/jrelph/ripe-atlas-mcp/issues/new?template=feature_request.md)

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
