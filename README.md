# Sidan CLI

A Terminal UI client for the [Sidan forum](https://chalmerslosers.com), built with [Melker](https://melker.sh/) — a framework for building terminal UIs.

## Developing

The app is a `.melker` file. To work on it, install [Melker](https://melker.sh/) and use the [Melker AI agent skill](https://melker.sh/) available for any LLM coding assistant to help with development.

## Quick Install

Install [Go](https://go.dev/dl/) and [Deno](https://deno.com), then:

**macOS/Linux**
```bash
go install github.com/sebastiw/sidan-backend/cmd/sidan-auth@latest
deno install -g -A jsr:@melker/melker
echo 'export PATH=$PATH:~/go/bin' >> ~/.bashrc
echo 'alias sidan="melker https://raw.githubusercontent.com/gabrielsson/sidan-cli/main/sidan.melker"' >> ~/.bashrc
source ~/.bashrc && sidan
```

**Windows (PowerShell)**
```powershell
go install github.com/sebastiw/sidan-backend/cmd/sidan-auth@latest
deno install -g -A jsr:@melker/melker
Add-Content $PROFILE "`n`$env:PATH += `";`$env:USERPROFILE\go\bin`""
Add-Content $PROFILE "`nfunction sidan { melker https://raw.githubusercontent.com/gabrielsson/sidan-cli/main/sidan.melker }"
. $PROFILE; sidan
```
