

# skillctl

Una CLI minimalista para instalar habilidades y servidores MCP en agentes de programación con IA.

## Instalación

```bash
npm install -g skillctl
# o usar directamente
npx skillctl@latest
```

## Agentes compatibles

- **Claude Code** — `~/.claude/skills/`, formato SKILL.md
- **OpenClaw** — `~/.openclaw/skills/`, formato SKILL.md
- **Codex (OpenAI)** — `.codex/skills/`, formato markdown
- **OpenCode** — `.opencode/skills/`, formato markdown
- **Cursor** — `.cursor/skills/`, formato .mdc

## Uso

### Inicializar

Detecta los agentes instalados y configura los directorios de habilidades:

```bash
skillctl init
```

### Instalar habilidades

```bash
# Desde GitHub (abreviado)
skillctl install owner/repo

# Desde URL de GitHub
skillctl install https://github.com/owner/repo

# Desde subcarpeta de GitHub
skillctl install https://github.com/owner/repo/tree/main/skills/my-skill

# Desde ruta local
skillctl install ./my-local-skill

# Instalar globalmente
skillctl install owner/repo -g

# Instalar solo para un agente específico
skillctl install owner/repo --agent claude-code
```

### Listar habilidades

```bash
skillctl list        # habilidades del proyecto
skillctl list -g     # habilidades globales
```

### Eliminar habilidades

```bash
skillctl remove my-skill
skillctl remove my-skill -g
```

### Gestión de servidores MCP

```bash
# Agregar un servidor MCP stdio
skillctl mcp add my-server --command node --args server.js --env PORT=3000

# Agregar un servidor MCP HTTP
skillctl mcp add my-server --url https://mcp.example.com

# Agregar globalmente
skillctl mcp add my-server --command npx --args some-mcp-server -g

# Listar servidores MCP
skillctl mcp list
skillctl mcp list -g

# Eliminar
skillctl mcp remove my-server
skillctl mcp remove my-server -g
```

## Archivos de configuración

- **Proyecto**: `.skillctl.json` — registra las habilidades a nivel de proyecto y los agentes detectados
- **Global**: `~/.skillctl/config.json` — registra las habilidades instaladas globalmente

## Licencia

MIT
