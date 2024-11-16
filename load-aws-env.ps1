$envFile = ".env.aws"

if (-Not (Test-Path $envFile)) {
    Write-Error "Plik .env.aws nie został znaleziony w lokalizacji $($envFile)"
    exit 1
}

Get-Content $envFile | ForEach-Object {
    if ($_ -match '^export\s+(\w+)="(.+)"$') {
        $envVarName = $matches[1]
        $envVarValue = $matches[2]

        [System.Environment]::SetEnvironmentVariable($envVarName, $envVarValue, [System.EnvironmentVariableTarget]::Process)
        Write-Host "Ustawiono zmienną środowiskową: $envVarName"
    }
}

Write-Host "Zmiennie środowiskowe załadowane. Możesz uruchomić Terraform."
