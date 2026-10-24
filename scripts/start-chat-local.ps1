param([switch]$SkipSetup)
$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $projectRoot
try {
  if (-not $SkipSetup) {
    & node scripts/dev.mjs setup
    if ($LASTEXITCODE -ne 0) { throw "Dev database setup failed." }
  }
  & node scripts/dev.mjs up
  if ($LASTEXITCODE -ne 0) { throw "Local startup failed. See .runtime/dev/logs." }
} finally { Pop-Location }
