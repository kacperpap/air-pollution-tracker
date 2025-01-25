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

$INITIAL_LOCATION = Get-Location

function Error {
    param ([string]$message)
    Write-Host "${red}[ERROR]${reset} $message"
    Set-Location $INITIAL_LOCATION
    exit 1
}

try {
    Log "Pobieranie ścieżki do katalogu projektu..."
    $PROJECT_ROOT = (git rev-parse --show-toplevel)
} catch {
    Error "Nie można znaleźć głównego katalogu projektu. Upewnij się, że uruchamiasz skrypt w repozytorium Git."
}

Set-Location "$PROJECT_ROOT/terraform/infrastructure"

Log "Pobieranie wartości z Terraform..."
$REPO_URL = terraform output -raw repository_url
$CLUSTER_ENDPOINT = terraform output -raw eks_cluster_endpoint
$CLUSTER_NAME = terraform output -raw eks_cluster_name
$CERT_AUTH = terraform output -raw eks_certificate_authority
$INGRESS_HOST = terraform output -raw ingress_hostname

Set-Location $PROJECT_ROOT

Log "Pobieranie zmiennych środowiskowych z pliku .env..."
$envContent = Get-Content .env
$JWT_KEY = (($envContent | Where-Object { $_ -match "^JWT_KEY=" -and $_ -notmatch "^#" }) -replace "JWT_KEY=", "").Trim()
$DATABASE_URL = (($envContent | Where-Object { $_ -match "^DATABASE_URL=" -and $_ -notmatch "^#" }) -replace "DATABASE_URL=", "").Trim()
$ENVIRONMENT = (($envContent | Where-Object { $_ -match "^ENVIRONMENT=" -and $_ -notmatch "^#" }) -replace "ENVIRONMENT=", "").Trim()
$SECURE = (($envContent | Where-Object { $_ -match "^SECURE=" -and $_ -notmatch "^#" }) -replace "SECURE=", "").Trim() -eq "true"
$RABBITMQ_REQUEST_QUEUE = (($envContent | Where-Object { $_ -match "^RABBITMQ_REQUEST_QUEUE=" -and $_ -notmatch "^#" }) -replace "RABBITMQ_REQUEST_QUEUE=", "").Trim()
$RABBITMQ_URL = (($envContent | Where-Object { $_ -match "^RABBITMQ_URL=" -and $_ -notmatch "^#" }) -replace "RABBITMQ_URL=", "").Trim()


if ($ENVIRONMENT -eq "prod") {
    $NAMESPACE = "production"
} else {
    $NAMESPACE = "staging"
}

$HELM_RELEASE_NAME = "apt"
$NODE = "apt"
$APT_FULL_NAME = "air-pollution-tracker"

Log "Sprawdzanie, czy Helm release '$HELM_RELEASE_NAME' istnieje w namespace '$NAMESPACE'..."
$releaseExists = helm list -n $NAMESPACE -q | Where-Object { $_ -eq $HELM_RELEASE_NAME }

if ($releaseExists) {
    Error "Helm release '$HELM_RELEASE_NAME' już istnieje w namespace '$NAMESPACE'. Przerwano instalację."
}

Log "Sprawdzanie, czy ingress działa w namespace 'ingress-nginx'..."
$ingressRunning = kubectl get pods -n ingress-nginx | Select-String "ingress-nginx-controller"

if (-not $ingressRunning) {
    Error "Ingress nie działa w namespace 'ingress-nginx'. Przerwano instalację."
}

Set-Location "$PROJECT_ROOT/charts/apt-k8s-aws"

$valuesContent = @"
frontend:
  name: frontend
  namespace: $NAMESPACE
  replicaCount: 1
  image:
    repository: $REPO_URL
    tag: frontend-$ENVIRONMENT-latest
    pullPolicy: Always
  container:
    targetPort: 3000
  service:
    type: ClusterIP
    fqdn: $APT_FULL_NAME-frontend.$NAMESPACE.svc.cluster.local
    port: 3000
  resources:
    requests:
      memory: "128Mi"
      cpu: "200m"
    limits:
      memory: "256Mi"
      cpu: "500m"

backend:
  name: backend
  namespace: $NAMESPACE
  replicaCount: 1
  image:
    repository: $REPO_URL
    tag: backend-$ENVIRONMENT-latest
    pullPolicy: Always
  container:
    targetPort: 9000
  service:
    type: ClusterIP
    fqdn: $APT_FULL_NAME-backend.$NAMESPACE.svc.cluster.local
    port: 9000
  environment:
    PRISMA_CLI_BINARY_TARGETS: linux-musl-openssl-3.0.x,rhel-openssl-3.0.x
    RABBITMQ_REQUEST_QUEUE: $RABBITMQ_REQUEST_QUEUE
    RABBITMQ_URL: $RABBITMQ_URL
    SECURE: $SECURE
  resources:
    requests:
      memory: "256Mi"
      cpu: "100m"
    limits:
      memory: "512Mi"
      cpu: "300m"

calc_module:
  name: calc-module
  namespace: $NAMESPACE
  replicaCount: 1
  image:
    name: calc_module
    repository: $REPO_URL
    tag: calc-module-$ENVIRONMENT-latest
    pullPolicy: Always
  container:
    targetPort: 5672
  service:
    type: ClusterIP
    fqdn: $APT_FULL_NAME-calc-module.$NAMESPACE.svc.cluster.local
    port: 5672
  environment:
    RABBITMQ_REQUEST_QUEUE: $RABBITMQ_REQUEST_QUEUE
    RABBITMQ_URL: $RABBITMQ_URL
  resources:
    requests:
      memory: "128Mi"
      cpu: "400m"
    limits:
      memory: "512Mi"
      cpu: "600m"

rabbitmq:
  name: rabbitmq
  namespace: $NAMESPACE
  image:
    repository: rabbitmq
    tag: management
    pullPolicy: IfNotPresent
  service:
    type: ClusterIP
    fqdn: $APT_FULL_NAME-rabbitmq.$NAMESPACE.svc.cluster.local
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
      memory: "512Mi"
      cpu: "250m"
    limits:
      memory: "1024Mi"
      cpu: "600m"

ingress:
  name: ingress
  host:  $INGRESS_HOST
  ssl:
    enabled: false

secrets:
  DATABASE_URL: $DATABASE_URL
  JWT_KEY: $JWT_KEY

eks:
  cluster:
    endpoint: $CLUSTER_ENDPOINT
    name: $CLUSTER_NAME
    certificateAuthority: $CERT_AUTH
    nodeGroup: $NODE
"@


$valuesContent | Out-File -FilePath generated-values.yaml -Encoding UTF8

$maskedContent = $valuesContent
$maskedContent = $maskedContent -replace [regex]::Escape($JWT_KEY), "********"
$maskedContent = $maskedContent -replace [regex]::Escape($DATABASE_URL), "********"
$maskedContent = $maskedContent -replace [regex]::Escape($CERT_AUTH), "********"

Log "Wygenerowano plik values.yaml."
Write-Host "----------------------------------------"
Write-Host $maskedContent
Write-Host "----------------------------------------"

Log "Instalowanie Helm release '$HELM_RELEASE_NAME' w namespace '$NAMESPACE'..."
helm install $HELM_RELEASE_NAME "$PROJECT_ROOT/charts/apt-k8s-aws" -f generated-values.yaml -n $NAMESPACE

if ($LASTEXITCODE -ne 0) {
    Error "Wystąpił błąd podczas instalacji Helm release."
} else {
    Log "Pomyślnie zainstalowano Helm release '$HELM_RELEASE_NAME'."
}

Set-Location $INITIAL_LOCATION
