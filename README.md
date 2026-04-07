# Quick Install

Install [Go](https://go.dev/dl/) and [Deno](https://deno.com), then:

**macOS/Linux**
```bash
go install github.com/sebastiw/sidan-backend/cmd/sidan-auth@latest
deno install -g -A jsr:@melker/melker
echo 'export PATH=$PATH:~/go/bin' >> ~/.bashrc
echo 'alias sidan="melker https://gist.githubusercontent.com/gabrielsson/b62b710b3f3bb952118c8f0e0b80b955/raw/sidan.melker"' >> ~/.bashrc
source ~/.bashrc && sidan
```

**Windows (PowerShell)**
```powershell
go install github.com/sebastiw/sidan-backend/cmd/sidan-auth@latest
deno install -g -A jsr:@melker/melker
Add-Content $PROFILE "`n`$env:PATH += `";`$env:USERPROFILE\go\bin`""
Add-Content $PROFILE "`nfunction sidan { melker https://gist.githubusercontent.com/gabrielsson/b62b710b3f3bb952118c8f0e0b80b955/raw/sidan.melker }"
. $PROFILE; sidan
```
