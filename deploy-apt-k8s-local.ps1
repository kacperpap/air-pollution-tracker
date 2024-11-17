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

function Check-NginxIngress {
  Log "Sprawdzanie instalacji nginx-ingress..."

  if (-not (helm repo list | Select-String "ingress-nginx")) {
      Warn "Repozytorium ingress-nginx nie jest dodane"
      return $false
  }

  $namespaceExists = kubectl get namespace ingress-nginx 2>$null
  if (-not $?) {
      Warn "Namespace ingress-nginx nie istnieje"
      return $false
  }

  $podsExist = kubectl get pods -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx 2>$null
  if (-not $?) {
      Warn "Pods ingress-nginx nie są uruchomione"
      return $false
  }

  Log "✅ nginx-ingress jest poprawnie zainstalowany"
  return $true
}


function Install-NginxIngress {
    $confirmation = Read-Host "Czy chcesz zainstalować nginx-ingress? (wpisz 'yes' aby kontynuować)"
    if ($confirmation -ne "yes") {
        Error "Instalacja nginx-ingress została przerwana przez użytkownika"
    }

    Log "Instalowanie nginx-ingress..."

    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    if ($LASTEXITCODE -ne 0) {
        Error "Nie udało się dodać repozytorium ingress-nginx"
    }

    helm repo update
    if ($LASTEXITCODE -ne 0) {
        Error "Nie udało się zaktualizować repozytoriów"
    }

    helm install ingress-nginx ingress-nginx/ingress-nginx --namespace ingress-nginx --create-namespace
    if ($LASTEXITCODE -ne 0) {
        Error "Nie udało się zainstalować nginx-ingress"
    }

    Log "✅ nginx-ingress został pomyślnie zainstalowany"
}

function Get-EnvVariables {
    Log "Pobieranie zmiennych środowiskowych z pliku .env..."
    
    $PROJECT_ROOT = (git rev-parse --show-toplevel)
    $envPath = Join-Path $PROJECT_ROOT ".env"
    
    if (-not (Test-Path $envPath)) {
        Error "Nie znaleziono pliku .env w katalogu głównym projektu"
    }
    
    $envContent = Get-Content $envPath
    $variables = @{
        $JWT_KEY = ($envContent | Where-Object { $_ -match "^JWT_KEY=" -and $_ -notmatch "^#" }) -replace "JWT_KEY=", ""
        $DATABASE_URL = ($envContent | Where-Object { $_ -match "^DATABASE_URL=" -and $_ -notmatch "^#" }) -replace "DATABASE_URL=", ""
        $ENVIRONMENT = ($envContent | Where-Object { $_ -match "^ENVIRONMENT=" -and $_ -notmatch "^#" }) -replace "ENVIRONMENT=", ""
    }
    
    if (-not $variables.JWT_KEY -or -not $variables.DATABASE_URL -or -not $variables.ENVIRONMENT) {
        Error "Nie wszystkie wymagane zmienne środowiskowe zostały znalezione w pliku .env"
    }
    
    return $variables
}

function Generate-ValuesFile {
    param ($variables)
    
    Log "Generowanie pliku values.yaml..."
    
    $PROJECT_ROOT = (git rev-parse --show-toplevel)
    $chartsPath = Join-Path $PROJECT_ROOT "charts/apt-k8s-dev"
    
    if (-not (Test-Path $chartsPath)) {
        Error "Nie znaleziono katalogu charts/apt-k8s-dev"
    }
    
    Set-Location $chartsPath
    
    $valuesContent = @"
frontend:
  name: frontend
  replicaCount: 1
  image:
    repository: air-pollution-tracker/$($variables.ENVIRONMENT)
    tag: latest
    pullPolicy: Never
  container:
    targetPort: 3000
  service:
    type: ClusterIP
    port: 3000
  environment:
    FAST_REFRESH: false
  resources:
    requests:
      memory: "512Mi"
      cpu: "500m"
    limits:
      memory: "1536Mi"
      cpu: "1000m"

backend:
  name: backend
  replicaCount: 1
  image:
    repository: air-pollution-tracker/$($variables.ENVIRONMENT)
    tag: latest
    pullPolicy: Never
  container:
    targetPort: 9000
  service:
    type: ClusterIP
    port: 9000
  environment:
    PRISMA_CLI_BINARY_TARGETS: linux-musl-openssl-3.0.x,rhel-openssl-3.0.x
    RABBITMQ_REQUEST_QUEUE: simulation_request_queue
  resources:
    requests:
      memory: "256Mi"
      cpu: "100m"
    limits:
      memory: "512Mi"
      cpu: "300m"

calc_module:
  name: calc-module
  replicaCount: 1
  image:
    name: calc_module
    repository: air-pollution-tracker/$($variables.ENVIRONMENT)
    tag: latest
    pullPolicy: Never
  container:
    targetPort: 5672
  service:
    type: ClusterIP
    port: 5672
  environment:
    RABBITMQ_REQUEST_QUEUE: simulation_request_queue
  resources:
    requests:
      memory: "128Mi"
      cpu: "200m"
    limits:
      memory: "512Mi"
      cpu: "400m"

rabbitmq:
  name: rabbitmq
  image:
    repository: rabbitmq
    tag: management
    pullPolicy: IfNotPresent
  service:
    type: ClusterIP
    ports:
      management: 15672
      amqp: 5672
  container:
    targetPorts:
      management: 15672
      amqp: 5672
  environment:
    RABBITMQ_REQUEST_QUEUE: simulation_request_queue
  config:
    RABBITMQ_DEFAULT_USER: guest
    RABBITMQ_DEFAULT_PASS: guest
  resources:
    requests:
      memory: "128Mi"
      cpu: "100m"
    limits:
      memory: "512Mi"
      cpu: "300m"

ingress:
  host: apt.local

secrets:
  DATABASE_URL: $($variables.DATABASE_URL)
  JWT_KEY: $($variables.JWT_KEY)
"@

    $valuesContent | Out-File -FilePath generated-values.yaml -Encoding UTF8
    
    $maskedContent = $valuesContent
    $maskedContent = $maskedContent -replace [regex]::Escape($variables.JWT_KEY), "********"
    $maskedContent = $maskedContent -replace [regex]::Escape($variables.DATABASE_URL), "********"
    
    Log "Generated values.yaml content:"
    Write-Host "----------------------------------------"
    Write-Host $maskedContent
    Write-Host "----------------------------------------"
    
    return $chartsPath
}

function Install-Application {
    param ($chartsPath)
    
    Log "Instalowanie aplikacji..."
    
    Log "Usuwanie starej instalacji Helm..."
    helm uninstall apt --ignore-not-found
    
    $installCommand = "helm install apt $chartsPath -f generated-values.yaml"
    Log "Wykonywanie komendy: $installCommand"
    
    Invoke-Expression $installCommand
    if ($LASTEXITCODE -ne 0) {
        Error "Nie udało się zainstalować aplikacji"
    }
    
    Log "✅ Aplikacja została pomyślnie zainstalowana"
}

$INITIAL_LOCATION = Get-Location

try {
    Check-Prerequisites
    
    if (-not (Check-NginxIngress)) {
        Warn "nginx-ingress nie jest zainstalowany. Rozpoczynam instalację..."
        Install-NginxIngress
    }
    
    $variables = Get-EnvVariables
    $chartsPath = Generate-ValuesFile $variables
    Install-Application $chartsPath
    
    Log "🎉 Instalacja zakończona pomyślnie!"
    Log "Aby sprawdzić status aplikacji, użyj:"
    Write-Host "  kubectl get pods"
    Write-Host "  kubectl get ingress"
    Log "Możesz teraz wejść na http://apt.local aby sprawdzić działanie aplikacji"
    Log "WAŻNE: Upewnij się, że dodałeś wpis do pliku hosts:"
    Log "Ścieżka pliku hosts na Windows: C:\Windows\System32\drivers\etc\hosts"
    Log "Dodaj linię: 127.0.0.1 apt.local"
} catch {
    Error "Wystąpił nieoczekiwany błąd: $_"
} finally {
    Set-Location $INITIAL_LOCATION
}