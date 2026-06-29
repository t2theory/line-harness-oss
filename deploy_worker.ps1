$ErrorActionPreference = "Stop"

$rootDir = (Resolve-Path ".").Path
$binPath = Join-Path $rootDir "node_modules\.bin"
$env:Path = "$binPath;$env:Path"
Write-Host "Added path: $binPath"

$workerEnvPath = "apps/worker/.env"
if (Test-Path $workerEnvPath) {
    Get-Content $workerEnvPath | ForEach-Object {
        if ($_ -match "^(CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID)=") {
            $parts = $_.Split("=", 2)
            $name = $parts[0].Trim()
            $val = $parts[1].Trim()
            Set-Item -Path "env:\$name" -Value $val
            Write-Host "Loaded $name"
        }
    }
}
$env:CI = "true"

Write-Host "Building and deploying worker via pnpm workspace..."
corepack pnpm --filter worker run deploy
