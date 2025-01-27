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

    if (-not (Get-Command mkcert -ErrorAction SilentlyContinue)) {
        Error "mkcert nie jest zainstalowany. Zainstaluj mkcert przed kontynuowaniem."
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

function Wait-ForIngressReady {
    param (
        [int]$timeoutInSeconds = 180,
        [int]$checkIntervalInSeconds = 15
    )
    
    Log "Czekanie na gotowość kontrolera Ingress..."
    
    Start-Sleep -Seconds 120

    $startTime = Get-Date

    while ($true) {
        $currentTime = Get-Date
        $elapsedTime = ($currentTime - $startTime).TotalSeconds

        $podStatus = kubectl get pods -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx -o jsonpath='{.items[0].status.phase}'

        if ($podStatus -eq "Running") {
            Log "✅ Kontroler Ingress jest gotowy i w stanie Running."
            return
        }

        if ($elapsedTime -ge $timeoutInSeconds) {
            Error "Czas oczekiwania na gotowość kontrolera Ingress upłynął"
        }

        Start-Sleep -Seconds $checkIntervalInSeconds
    }
}


function Get-EnvVariables {
    Log "Pobieranie zmiennych środowiskowych z pliku .env..."
    
    $PROJECT_ROOT = (git rev-parse --show-toplevel)
    $envPath = Join-Path $PROJECT_ROOT ".env"
    
    if (-not (Test-Path $envPath)) {
        Error "Nie znaleziono pliku .env w katalogu głównym projektu"
    }

    $envContent = Get-Content $envPath
    
    $variables = @{}

    foreach ($line in $envContent) {
        if ([string]::IsNullOrWhiteSpace($line) -or $line.TrimStart().StartsWith("#")) {
            continue
        }

        $keyValue = $line -split '=', 2
        if ($keyValue.Count -ge 2) {
            $key = $keyValue[0].Trim()
            $value = $keyValue[1] -split '#', 2 | Select-Object -First 1
            $variables[$key] = $value.Trim()
        }
    }

    $requiredVariables = @("JWT_KEY", "DATABASE_URL", "ENVIRONMENT", "RABBITMQ_REQUEST_QUEUE", "RABBITMQ_URL", "DOMAIN", "SECURE")
    foreach ($var in $requiredVariables) {
        if (-not $variables.ContainsKey($var)) {
            Error "Brak wymaganej zmiennej środowiskowej: $var"
        }
    }

    $variables["SECURE"] = $variables["SECURE"].ToLower() -eq "true"

    return $variables
}


function Install-Certificate {
  param (
        [string]$Domain,
        [bool]$Secure
  )

  if (-not $Secure) {
      Log "Flaga SECURE jest ustawiona na 'false'. Pomijam generowanie certyfikatu SSL i tworzenie sekretu TLS."
      return
  }

  if (-not $Domain) {
      Error "Brak wartości dla parametru 'Domain'."
  }

  Log "Generowanie lokalnego certyfikatu SSL dla domeny '$Domain'..."
  
  $PROJECT_ROOT = (git rev-parse --show-toplevel)
  $certsPath = Join-Path $PROJECT_ROOT "local-certs/domain"
  
  if (-not (Test-Path $certsPath)) {
      New-Item -ItemType Directory -Path $certsPath
  }

  Set-Location $certsPath

  $keyFile = "$Domain-key.pem"
  $certFile = "$Domain.pem"
  
  if (-not (Test-Path $keyFile) -or -not (Test-Path $certFile)) {
    mkcert $Domain
    if ($LASTEXITCODE -ne 0) {
      Error "Błąd podczas generowania certyfikatu dla domeny '$Domain'."
    }
  } else {
    Log "Certyfikaty dla '$Domain' już istnieją, pomijam generowanie."
  }

  Log "Sprawdzanie, czy sekret TLS już istnieje..."
  $secretExists = kubectl get secret apt-tls-secret --namespace default 2>$null
  if ($?) {
      Warn "Sekret TLS 'apt-tls-secret' już istnieje. Usuwanie starego sekretu..."
      kubectl delete secret apt-tls-secret --namespace default
      if ($LASTEXITCODE -ne 0) {
        Error "Nie udało się usunąć istniejącego sekretu TLS 'apt-tls-secret'."
      }
  }

  Log "Tworzenie nowego sekretu TLS dla '$Domain'..."
  kubectl create secret tls apt-tls-secret `
      --key $keyFile `
      --cert $certFile `
      --namespace default

  if ($LASTEXITCODE -ne 0) {
    Error "Nie udało się utworzyć nowego sekretu TLS 'apt-tls-secret'."
  }

  Warn "Aby wygenerowany certyfikat był automatycznie zaufany przez system operacyjny i/lub przeglądarki wykonaj polecenie mkcert -install w terminalu z uprawnieniami administratora. Zainstaluje ono lokalny Certificate Authority (CA) w systemowym magazynie certyfikatów zaufania (brak tego kroku może powodować błędy zaufania certyfikatu)"
  Log "Certyfikat i sekret TLS zostały pomyślnie utworzone."
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
application:
  environment: $($variables.ENVIRONMENT)
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
      memory: "128Mi"
      cpu: "200m"
    limits:
      memory: "256Mi"
      cpu: "500m"

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
    RABBITMQ_REQUEST_QUEUE: $($variables.RABBITMQ_REQUEST_QUEUE)
    RABBITMQ_URL: $($variables.RABBITMQ_URL)
    SECURE: $($variables.SECURE)

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
    RABBITMQ_REQUEST_QUEUE: $($variables.RABBITMQ_REQUEST_QUEUE)
    RABBITMQ_URL: $($variables.RABBITMQ_URL)
  resources:
    requests:
      memory: "128Mi"
      cpu: "400m"
    limits:
      memory: "512Mi"
      cpu: "600m"

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
  config:
    RABBITMQ_DEFAULT_USER: guest
    RABBITMQ_DEFAULT_PASS: guest
  resources:
    requests:
      memory: "512Mi"
      cpu: "250m"
    limits:
      memory: "1Gi"
      cpu: "600m"

ingress:
  host: $($variables.DOMAIN)

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
        Wait-ForIngressReady
    }

    
    $variables = Get-EnvVariables

    Install-Certificate -Domain $variables.DOMAIN -Secure $variables.SECURE

    $chartsPath = Generate-ValuesFile $variables

    Install-Application $chartsPath

    if ($variables.SECURE -eq $true) {
        $protocol = "https"
    } else {
        $protocol = "http"
    }

    Log "🎉 Instalacja zakończona pomyślnie!"
    Log "Aby sprawdzić status aplikacji, użyj:"
    Write-Host "  kubectl get pods"
    Write-Host "  kubectl get ingress"
    Log "Możesz teraz wejść na ${protocol}://$($variables.DOMAIN) aby sprawdzić działanie aplikacji"
    Log "WAŻNE: Upewnij się, że dodałeś wpis do pliku hosts:"
    Log "Ścieżka pliku hosts na Windows: C:\Windows\System32\drivers\etc\hosts"
    Log "Dodaj linię: 127.0.0.1 $($variables.DOMAIN)"
} catch {
    Error "Wystąpił nieoczekiwany błąd: $_"
} finally {
    Set-Location $INITIAL_LOCATION
}