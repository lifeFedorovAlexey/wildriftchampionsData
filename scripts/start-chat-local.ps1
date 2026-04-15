param(
  [switch]$SkipSetup
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$wrApi = Join-Path $root "wr-api"
$wrChat = Join-Path $root "wr-chat"
$ui = Join-Path $root "ui"
$pwsh = "C:\Program Files\PowerShell\7\pwsh.exe"

function Start-CodexWindow($title, $workdir, $command) {
  Start-Process -FilePath $pwsh -WorkingDirectory $workdir -ArgumentList @(
    "-NoExit",
    "-Command",
    "`$host.UI.RawUI.WindowTitle = '$title'; $command"
  ) | Out-Null
}

if (-not $SkipSetup) {
  & $pwsh -Command "Set-Location '$wrApi'; npm run setup:chat"
}

Start-CodexWindow `
  -title "wr-api public :3202" `
  -workdir $wrApi `
  -command '$env:PORT="3202"; npm run start:public'

Start-CodexWindow `
  -title "wr-api auth :3203" `
  -workdir $wrApi `
  -command '$env:PORT="3203"; $env:USER_SESSION_SECRET="local-user-secret"; $env:WR_CHAT_SHARED_SECRET="local-chat-secret"; npm run start:auth'

Start-CodexWindow `
  -title "wr-api gateway :3201" `
  -workdir $wrApi `
  -command '$env:PORT="3201"; $env:PUBLIC_UPSTREAM_PORT="3202"; $env:AUTH_UPSTREAM_PORT="3203"; npm run start:gateway'

Start-CodexWindow `
  -title "wr-chat :3210" `
  -workdir $wrChat `
  -command '$env:PORT="3210"; $env:HOST="127.0.0.1"; $env:WR_API_ORIGIN="http://127.0.0.1:3201"; $env:WR_CHAT_PUBLIC_ORIGIN="http://127.0.0.1:3210"; $env:WR_CHAT_SHARED_SECRET="local-chat-secret"; $env:WR_CHAT_ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"; npm run dev'

Start-CodexWindow `
  -title "ui :3000" `
  -workdir $ui `
  -command '$env:API_PROXY_TARGET="http://127.0.0.1:3201"; $env:STATS_API_ORIGIN="http://127.0.0.1:3201"; $env:WR_CHAT_ORIGIN="http://127.0.0.1:3210"; $env:USER_AUTH_ENABLED="true"; $env:USER_SESSION_SECRET="local-user-secret"; $env:NEXT_PUBLIC_SITE_URL="http://localhost:3000"; npm run dev'
