$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path $PSScriptRoot -Parent)
if (-not (Test-Path -LiteralPath '.env')) {
    $secretBytes = New-Object byte[] 32
    $mentorBytes = New-Object byte[] 18
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($secretBytes)
    $rng.GetBytes($mentorBytes)
    $rng.Dispose()
    $secret = [Convert]::ToBase64String($secretBytes)
    $mentor = [Convert]::ToBase64String($mentorBytes)
    Set-Content -LiteralPath '.env' -Encoding utf8 -Value "SECRET_KEY=$secret`nMENTOR_PASSWORD=$mentor`nLAB_TTL_SECONDS=3600`nLAB_MAX_ACTIVE=10`nLAB_MAX_PER_USER=2"
    Write-Host 'Credenciais geradas no arquivo .env. Conta: mentor@cti.local'
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Instale o Docker Desktop, abra em modo Linux e execute este script novamente.'
}
$dockerOs = docker info --format '{{.OSType}}'
if ($LASTEXITCODE -ne 0) { throw 'Docker Engine indisponível.' }
if ($dockerOs -ne 'linux') { throw 'Ative containers Linux no Docker Desktop.' }
docker compose --profile images build
if ($LASTEXITCODE -ne 0) { throw 'Falha na construção das imagens.' }
docker compose up -d platform
if ($LASTEXITCODE -ne 0) { throw 'Falha ao iniciar a plataforma.' }
Write-Host 'Plataforma: http://localhost:5000 | Senha do mentor: consulte MENTOR_PASSWORD em .env'
