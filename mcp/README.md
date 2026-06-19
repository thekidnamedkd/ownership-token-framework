# OTF MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) server that exposes
the **Ownership Token Framework (OTF)** public read API as agent tools. Point
Claude Desktop, Claude Code, or Cursor at it and query the framework data —
which crypto protocols are genuinely tokenholder-owned, on evidence, against a
fixed rubric — directly from your assistant.

It is a thin, read-only wrapper over the OTF JSON API (`/api/v1/*`, no auth).
Every tool result includes a provenance citation line carrying
`provenance.snapshot_id` and `commit_ref` so answers are reproducible.

## Tools

| Tool | Input | Returns |
|---|---|---|
| `list_tokens` | `network?`, `minScorePercentage?`, `criterion?`, `status?` | Slim index rows. Filters are applied client-side over `/api/v1/tokens`. `criterion`+`status` keeps tokens whose `criteriaStatuses[criterion] === status`. |
| `get_token` | `id` (lowercase, e.g. `ldo`) | The full token report: `metrics[].criteria[]` with `status`, `notes`, `evidence[]`, plus `score` and counts. |
| `get_framework` | — | The rubric: metric/criterion `name` + `about` definitions. |
| `search_tokens` | `query` | Case-insensitive match over token `name`/`symbol`/`id` from the index. |
| `get_faq` | — | Methodology / framework Q&A. |

`status` is one of the OTF status vocabulary: `positive`, `warning`, `at_risk`,
`unevaluated`, `reference`.

A request for a token id that does not exist returns a clean tool error
(`isError: true`), not a thrown exception.

## Configuration

| Env var | Default | Notes |
|---|---|---|
| `OTF_API_BASE` | `https://ownership-token-framework.vercel.app` | Base URL of the OTF API. **The default is a placeholder** — see `TODO(prod-domain)` in `src/client.ts`. Set this to the real production (or your local dev) origin. |

For a local app dev server this is typically `http://localhost:3000`.

## Run locally

Requires Node.js >= 18.

```bash
cd mcp
npm install        # standalone; creates its own package-lock.json
npm run build      # compiles src/ -> dist/
npm start          # runs dist/index.js over stdio (or: node dist/index.js)
```

Type-check only: `npm run typecheck`.

The server speaks MCP over **stdio**; it is meant to be launched by an MCP
client, not used interactively. stdout is reserved for the protocol — all logs
go to stderr.

## Client configuration

After `npm run build`, use the **absolute path** to `dist/index.js`.

### Claude Desktop

Edit `claude_desktop_config.json`
(macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "otf": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/ownership-token-framework/mcp/dist/index.js"],
      "env": {
        "OTF_API_BASE": "https://ownership-token-framework.vercel.app"
      }
    }
  }
}
```

### Cursor

Edit `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project):

```json
{
  "mcpServers": {
    "otf": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/ownership-token-framework/mcp/dist/index.js"],
      "env": {
        "OTF_API_BASE": "https://ownership-token-framework.vercel.app"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add otf --env OTF_API_BASE=https://ownership-token-framework.vercel.app -- node /ABSOLUTE/PATH/TO/ownership-token-framework/mcp/dist/index.js
```

### Via npx (after publishing)

Once this package is published to npm, clients can run it without a local
checkout by replacing the `command`/`args` with:

```json
{ "command": "npx", "args": ["-y", "otf-mcp-server"] }
```

## Notes

- **Standalone package.** This directory has its own `package.json` and
  `package-lock.json` and is installed with `npm` independently of the parent
  app's pnpm workspace. The root `pnpm-workspace.yaml` declares no `packages`,
  so `mcp/` is not part of the pnpm workspace and the app build is unaffected.
- **Pinned dependencies.** `@modelcontextprotocol/sdk` and `zod` are
  exact-pinned (no `^`/`latest`) to versions published over 7 days ago.
- **Lifecycle scripts off** via `.npmrc` (`ignore-scripts=true`).
- **Production domain TODO.** The default `OTF_API_BASE` is a placeholder; the
  current Vercel deployment did not serve `/api/v1/*` at verification time, so
  set `OTF_API_BASE` to a live origin.
