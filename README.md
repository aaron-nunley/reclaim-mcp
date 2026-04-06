# reclaim-mcp

> **Unofficial** MCP server for [Reclaim.ai](https://reclaim.ai) — manage tasks, habits, calendar events, focus time, and analytics from any MCP-compatible client.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> [!IMPORTANT]
> This project is **not affiliated with, endorsed by, or supported by Reclaim.ai**. It uses Reclaim's public API. Use at your own risk and comply with [Reclaim's Terms of Service](https://reclaim.ai/terms).

## Quick Start

### 1. Get your API key

Go to [Reclaim.ai Settings → Integrations → API](https://app.reclaim.ai/settings/integrations) and create an API key.

### 2. Add to your MCP client

<details>
<summary><strong>Claude Code</strong></summary>

Add to your project's `.mcp.json` or `~/.claude/.mcp.json`:

```json
{
  "mcpServers": {
    "reclaim": {
      "command": "npx",
      "args": ["reclaim-mcp"],
      "env": {
        "RECLAIM_API_KEY": "your_api_key_here"
      }
    }
  }
}
```
</details>

<details>
<summary><strong>Claude Desktop</strong></summary>

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS, `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "reclaim": {
      "command": "npx",
      "args": ["reclaim-mcp"],
      "env": {
        "RECLAIM_API_KEY": "your_api_key_here"
      }
    }
  }
}
```
</details>

<details>
<summary><strong>Cursor</strong></summary>

Add to your project's `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "reclaim": {
      "command": "npx",
      "args": ["reclaim-mcp"],
      "env": {
        "RECLAIM_API_KEY": "your_api_key_here"
      }
    }
  }
}
```
</details>

<details>
<summary><strong>Windsurf</strong></summary>

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "reclaim": {
      "command": "npx",
      "args": ["reclaim-mcp"],
      "env": {
        "RECLAIM_API_KEY": "your_api_key_here"
      }
    }
  }
}
```
</details>

<details>
<summary><strong>Codex CLI / other MCP clients</strong></summary>

Any MCP client that supports stdio transport can use this server. Configure the server command as:

```
npx reclaim-mcp
```

With the environment variable `RECLAIM_API_KEY` set to your API key.
</details>

### 3. Use it

Once configured, your MCP client can manage your Reclaim.ai account through natural language:

- *"Show me my tasks"*
- *"Create a P2 task to review the quarterly report, 2 hours, due Friday"*
- *"Start the timer on my code review task"*
- *"What are my habits?"*
- *"Show my calendar for tomorrow"*

## Tools

### Tasks (12 tools)

| Tool | Description |
|------|-------------|
| `list_tasks` | List active tasks (excludes completed by default) |
| `get_task` | Get full details of a specific task |
| `create_task` | Create a new task for auto-scheduling |
| `update_task` | Update task properties |
| `delete_task` | Permanently delete a task |
| `mark_task_complete` | Mark a task as done |
| `mark_task_incomplete` | Reopen a completed task |
| `start_task` | Start the task timer |
| `stop_task` | Stop the task timer |
| `add_time_to_task` | Add more scheduled time to a task |
| `log_work` | Record time spent without using the timer |
| `prioritize_task` | Bump task to top of planner queue |

### Habits (5 tools)

| Tool | Description |
|------|-------------|
| `list_habits` | List all smart habits |
| `get_habit` | Get full details of a specific habit |
| `create_habit` | Create a new auto-scheduled habit |
| `update_habit` | Update habit properties |
| `delete_habit` | Delete a habit |

### Calendar Events (3 tools)

| Tool | Description |
|------|-------------|
| `list_events` | List calendar events (defaults to today) |
| `list_personal_events` | List Reclaim-managed events only (tasks, habits, focus) |
| `get_event` | Get full details of a specific event |

### Focus Time (2 tools)

| Tool | Description |
|------|-------------|
| `get_focus_settings` | Get current focus time configuration |
| `update_focus_settings` | Update focus time settings |

### Analytics (1 tool)

| Tool | Description |
|------|-------------|
| `get_analytics` | Get productivity analytics |

> **Note:** Focus and analytics endpoints may return 403 depending on your Reclaim plan tier or API key scope.

## Design

### Context-aware responses

List endpoints return **slim responses** — only the fields an LLM needs (title, times, status, etc.). This keeps token usage low and avoids blowing out context windows. The `get_*` endpoints return full unfiltered API responses for when you need the details.

| Endpoint | Raw API | Slim response | Reduction |
|----------|---------|---------------|-----------|
| Events (1 day) | ~67 KB | ~7 KB | 89% |
| Habits (7 items) | ~8.7 KB | ~1.5 KB | 83% |
| Tasks | Similar ratio | | |

### Smart defaults

- `list_events` defaults to **today** if no date range is specified
- `list_tasks` excludes completed/archived tasks by default
- Event descriptions are truncated to 200 chars in list view (full text via `get_event`)
- Error responses include the Reclaim API's error detail, not just the status code

## Task Time Model

Reclaim uses **15-minute chunks** for time tracking:

- `timeChunksRequired=4` means 1 hour of total time needed
- `minChunkSize=2` means minimum 30-minute scheduling blocks
- `maxChunkSize=8` means maximum 2-hour scheduling blocks

When using `add_time_to_task`, specify minutes — they're automatically rounded up to the nearest chunk.

## Task Priority

| Priority | Meaning |
|----------|---------|
| `P1` | Critical — scheduled first |
| `P2` | High — scheduled after P1 |
| `P3` | Medium (default) |
| `P4` | Low — scheduled last |

## Development

```bash
# Clone and install
git clone https://github.com/aaron-nunley/reclaim-mcp.git
cd reclaim-mcp
npm install

# Build
npm run build

# Run locally
RECLAIM_API_KEY=your_key npm start

# Type check
npm run typecheck

# Watch mode for development
npm run dev
```

### Testing with MCP Inspector

```bash
RECLAIM_API_KEY=your_key npx @modelcontextprotocol/inspector node dist/index.js
```

## Architecture

```
src/
  index.ts              # Entry point — server setup and transport
  client.ts             # Reclaim API HTTP client
  tools/
    register.ts         # Tool registration bridge (v1 → v2 ready)
    tasks.ts            # Task CRUD + planner tools
    habits.ts           # Habit management tools
    events.ts           # Calendar event tools
    focus.ts            # Focus time settings tools
    analytics.ts        # Productivity analytics tools
  types/
    reclaim.ts          # TypeScript interfaces for API responses
    schemas.ts          # Zod schemas for input/output validation
```

The `tools/register.ts` module acts as a bridge between the current MCP SDK v1 and the upcoming v2. All tools define both input and output schemas — output schemas will be wired to `structuredContent` when v2 goes stable. See [V2_MIGRATION.md](./V2_MIGRATION.md) for details.

## SDK Version

Built on `@modelcontextprotocol/sdk` v1.x (stable). The codebase includes breadcrumbs (`TODO(v2)` comments) and a migration checklist for when the v2 SDK reaches stable release. The migration is expected to be minimal — primarily import path changes and wiring output schemas.

## Contributing

Contributions welcome! Please:

1. Fork the repo
2. Create a feature branch
3. Add/update types in `types/` if touching API shapes
4. Add tools through the `registerTool` wrapper (not directly via `server.tool()`)
5. Open a PR

## Disclaimer

This is an **unofficial, community-maintained** project. It is **not affiliated with, endorsed by, or supported by Reclaim.ai** or its team. The author(s) are not responsible for any consequences of using this software, including but not limited to data loss, account issues, or API rate limiting.

This project interacts with Reclaim.ai's public API. The API may change without notice, which could break functionality. Use at your own risk.

## License

[MIT](./LICENSE) — Copyright (c) 2026 Aaron Nunley
