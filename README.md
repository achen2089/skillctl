# skillctl

A minimal CLI for installing skills and MCP servers across AI coding agents.

## Install

```bash
npm install -g skillctl
# or use directly
npx skillctl@latest
```

## Supported Agents

- **Claude Code** — `~/.claude/skills/`, SKILL.md format
- **OpenClaw** — `~/.openclaw/skills/`, SKILL.md format
- **Codex (OpenAI)** — `.codex/skills/`, markdown format
- **OpenCode** — `.opencode/skills/`, markdown format
- **Cursor** — `.cursor/skills/`, .mdc format

## Usage

### Initialize

Detect installed agents and set up skill directories:

```bash
skillctl init
```

### Install Skills

```bash
# From GitHub (shorthand)
skillctl install owner/repo

# From GitHub URL
skillctl install https://github.com/owner/repo

# From GitHub subfolder
skillctl install https://github.com/owner/repo/tree/main/skills/my-skill

# From local path
skillctl install ./my-local-skill

# Install globally
skillctl install owner/repo -g

# Install for specific agent only
skillctl install owner/repo --agent claude-code
```

### List Skills

```bash
skillctl list        # project skills
skillctl list -g     # global skills
```

### Remove Skills

```bash
skillctl remove my-skill
skillctl remove my-skill -g
```

### MCP Server Management

```bash
# Add a stdio MCP server
skillctl mcp add my-server --command node --args server.js --env PORT=3000

# Add an HTTP MCP server
skillctl mcp add my-server --url https://mcp.example.com

# Add globally
skillctl mcp add my-server --command npx --args some-mcp-server -g

# List MCP servers
skillctl mcp list
skillctl mcp list -g

# Remove
skillctl mcp remove my-server
skillctl mcp remove my-server -g
```

## Config Files

- **Project**: `.skillctl.json` — tracks project-level skills and detected agents
- **Global**: `~/.skillctl/config.json` — tracks globally installed skills

## License

MIT
