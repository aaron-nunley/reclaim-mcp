# MCP SDK v2 Migration Checklist

When `@modelcontextprotocol/server` reaches stable release, follow this checklist.

## Pre-flight

- [ ] Confirm v2 is stable (not alpha/beta) on [npm](https://www.npmjs.com/package/@modelcontextprotocol/server)
- [ ] Read the [migration guide](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/migration.md) if one exists
- [ ] Check if Zod v3 is still supported or if v4 is required

## Package changes

- [ ] Replace `@modelcontextprotocol/sdk` with `@modelcontextprotocol/server` in `package.json`
- [ ] Remove old SDK: `npm uninstall @modelcontextprotocol/sdk`
- [ ] Install new SDK: `npm install @modelcontextprotocol/server`
- [ ] Update Node engine minimum if v2 requires it (currently >=20)

## Code changes

### Imports (grep: `@modelcontextprotocol/sdk`)

- [ ] `src/index.ts`: Change `@modelcontextprotocol/sdk/server/mcp.js` → `@modelcontextprotocol/server`
- [ ] `src/index.ts`: Change `@modelcontextprotocol/sdk/server/stdio.js` → `@modelcontextprotocol/server/stdio`
- [ ] `src/tools/register.ts`: Update McpServer import

### Tool registration (grep: `TODO(v2)`)

- [ ] `src/tools/register.ts`: Switch from `server.tool()` to `server.registerTool()`
- [ ] `src/tools/register.ts`: Pass `title` to registerTool options
- [ ] `src/tools/register.ts`: Pass `outputSchema` to registerTool options
- [ ] `src/tools/register.ts`: Add `structuredContent: result` to return value
- [ ] `src/index.ts`: Add `instructions` to McpServer constructor options

### Verify

- [ ] `npm run build` passes
- [ ] `npm run typecheck` passes
- [ ] Manual test: connect via Claude Code / Claude Desktop
- [ ] All tools respond correctly with structured content
- [ ] Update `package.json` version (bump minor)
- [ ] Update README to reflect v2 SDK

## Breadcrumbs

All v2 migration points are marked with `TODO(v2)` comments. Find them:

```bash
grep -r "TODO(v2)" src/
```

## Timeline

v2 was expected stable Q1 2026. As of April 2026, it's at alpha.2.
Check releases: https://github.com/modelcontextprotocol/typescript-sdk/releases
