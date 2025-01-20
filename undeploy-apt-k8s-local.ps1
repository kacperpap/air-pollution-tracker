$green = "`e[32m"
$yellow = "`e[33m"
$red = "`e[31m"
$reset = "`e[0m"

function Log {
    param ([string]$message)
    Write-Host "${green}[INFO]${reset} $message"
}

function Warn {
    param ([string]$message)
    Write-Host "${yellow}[WARN]${reset} $message"
}

function Error {
    param ([string]$message)
    Write-Host "${red}[ERROR]${reset} $message"
    exit 1
}

function Check-Prerequisites {
    Log "Sprawdzanie wymaganych narzędzi..."
    if (-not (Get-Command helm -ErrorAction SilentlyContinue)) {
        Error "Helm nie jest zainstalowany. Zainstaluj helm przed kontynuowaniem."
    }

    if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
        Error "kubectl nie jest zainstalowany. Zainstaluj kubectl przed kontynuowaniem."
    }

    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Error "Git nie jest zainstalowany. Zainstaluj git przed kontynuowaniem."
    }

    Log "✅ Wszystkie wymagane narzędzia są zainstalowane"
}

function Undeploy-Application {
    Log "Rozpoczynam usuwanie aplikacji 'apt'..."
    helm uninstall apt --ignore-not-found
    if ($LASTEXITCODE -ne 0) {
        Error "Nie udało się odinstalować aplikacji 'apt'."
    } else {
        Log "✅ Aplikacja 'apt' została odinstalowana."
    }

    Log "Sprawdzanie i usuwanie sekretu TLS 'apt-tls-secret'..."
    kubectl delete secret apt-tls-secret --namespace default --ignore-not-found
    if ($LASTEXITCODE -ne 0) {
        Warn "Nie udało się usunąć sekretu TLS 'apt-tls-secret'. Możliwe, że już nie istnieje."
    } else {
        Log "✅ Sekret TLS 'apt-tls-secret' został usunięty."
    }
}

function Undeploy-IngressNginx {
    Log "Rozpoczynam usuwanie nginx-ingress..."
    $namespace = "ingress-nginx"
    
    $resources = kubectl get all -n $namespace --ignore-not-found
    if (-not $?) {
        Warn "Namespace '$namespace' już nie istnieje. Pomijam usuwanie."
        return
    }

    Log "Usuwanie wszystkich zasobów w namespace '$namespace'..."
    kubectl delete all --all -n $namespace
    if ($LASTEXITCODE -ne 0) {
        Warn "Nie udało się usunąć niektórych zasobów w namespace '$namespace'."
    }

    Log "Usuwanie namespace '$namespace'..."
    kubectl delete namespace $namespace --ignore-not-found
    if ($LASTEXITCODE -ne 0) {
        Warn "Nie udało się usunąć namespace '$namespace'."
    } else {
        Log "✅ Namespace '$namespace' został usunięty."
    }
}

function Remove-Certificate {
    param ([string]$domain, [bool]$secure)
    if (-not $secure) {
        Log "Flaga 'SECURE' jest ustawiona na 'false'. Pomijam usuwanie certyfikatu SSL."
        return
    }

    Log "Usuwanie certyfikatu SSL dla domeny '$domain'..."
    $PROJECT_ROOT = (git rev-parse --show-toplevel)
    $certPath = Join-Path $PROJECT_ROOT "certs/$domain.pem"
    $certPathPrivate = Join-Path $PROJECT_ROOT "certs/$domain-key.pem"

    if (Test-Path $certPath) {
        Remove-Item $certPath -Force
        Log "✅ Certyfikat '$domain.pem' został usunięty."
    } else {
        Warn "Certyfikat '$domain.pem' nie istnieje. Pomijam usuwanie."
    }

    if (Test-Path $certPathPrivate) {
        Remove-Item $certPathPrivate -Force
        Log "✅ Certyfikat '$domain-key.pem' został usunięty."
    } else {
        Warn "Certyfikat '$domain-key.pem' nie istnieje. Pomijam usuwanie."
    }
}

function Main {
    Check-Prerequisites

    $PROJECT_ROOT = (git rev-parse --show-toplevel)
    $envPath = Join-Path $PROJECT_ROOT ".env"
    if (-not (Test-Path $envPath)) {
        Error "Nie znaleziono pliku .env w katalogu głównym projektu."
    }

    $envContent = Get-Content $envPath
    $variables = @{
        DOMAIN = (($envContent | Where-Object { $_ -match "^DOMAIN=" -and $_ -notmatch "^#" }) -replace "DOMAIN=", "").Trim()
        SECURE = (($envContent | Where-Object { $_ -match "^SECURE=" -and $_ -notmatch "^#" }) -replace "SECURE=", "").Trim() -eq "true"
    }

    Undeploy-Application

    Undeploy-IngressNginx

    Remove-Certificate -domain $variables.DOMAIN -secure $variables.SECURE

    Log "🎉 Proces usuwania zakończony pomyślnie!"
}

Main
