# Zapisz początkowy katalog
$INITIAL_LOCATION = Get-Location

# Pobierz ścieżkę do głównego katalogu projektu
$PROJECT_ROOT = (git rev-parse --show-toplevel)

# Przejdź do katalogu z terraformem
Set-Location "$PROJECT_ROOT/terraform/infrastructure"

# Pobierz dane z terraforma
$REPO_URL = terraform output -raw repository_url
$CLUSTER_ENDPOINT = terraform output -raw eks_cluster_endpoint
$CLUSTER_NAME = terraform output -raw eks_cluster_name
$CERT_AUTH = terraform output -raw eks_certificate_authority
$INGRESS_HOST = terraform output -raw ingress_hostname

# Wróć do głównego katalogu projektu
Set-Location $PROJECT_ROOT

# Pobierz zmienne z pliku .env
$envContent = Get-Content .env
$JWT_KEY = ($envContent | Where-Object { $_ -match "JWT_KEY=" }) -replace "JWT_KEY=", ""
$DATABASE_URL = ($envContent | Where-Object { $_ -match "DATABASE_URL=" }) -replace "DATABASE_URL=", ""

# Przejdź do katalogu z chartami i utwórz plik values
Set-Location "$PROJECT_ROOT/charts/apt-k8s-aws"

$valuesContent = @"
frontend:
  name: frontend
  replicaCount: 2
  image:
    repository: $REPO_URL
    tag: frontend-dev-latest
    pullPolicy: Always
  container:
    targetPort: 3000
  service:
    type: ClusterIP
    port: 3000

backend:
  name: backend
  replicaCount: 1
  image:
    repository: $REPO_URL
    tag: backend-dev-latest
    pullPolicy: Always
  container:
    targetPort: 9000
  service:
    type: ClusterIP
    port: 9000
  environment:
    PRISMA_CLI_BINARY_TARGETS: linux-musl-openssl-3.0.x,rhel-openssl-3.0.x
    RABBITMQ_REQUEST_QUEUE: simulation_request_queue

calc_module:
  name: calc-module
  replicaCount: 1
  image:
    name: calc_module
    repository: $REPO_URL
    tag: calc-module-dev-latest
    pullPolicy: Always
  container:
    targetPort: 5672
  service:
    type: ClusterIP
    port: 5672
  environment:
    RABBITMQ_REQUEST_QUEUE: simulation_request_queue

ingress:
  host: $INGRESS_HOST

secrets:
  DATABASE_URL: ${DATABASE_URL}
  JWT_KEY: ${JWT_KEY}

eks:
  cluster:
    endpoint: $CLUSTER_ENDPOINT
    name: $CLUSTER_NAME
    certificateAuthority: $CERT_AUTH
"@

# Zapisz zawartość do pliku
$valuesContent | Out-File -FilePath generated-values.yaml -Encoding UTF8

# Wyświetl zawartość pliku z zamaskowanymi danymi wrażliwymi
$maskedContent = $valuesContent -replace $JWT_KEY, "********" `
                               -replace $DATABASE_URL, "********"

Write-Host "Generated values.yaml content:"
Write-Host "----------------------------------------"
Write-Host $maskedContent
Write-Host "----------------------------------------"

Write-Host "`nUninstalling previous helm release..."
helm uninstall apt --ignore-not-found

Write-Host "`nExecuting: helm install apt '$PROJECT_ROOT/charts/apt-k8s-aws' -f generated-values.yaml"

# Zainstaluj chart za pomocą Helm
helm install apt "$PROJECT_ROOT/charts/apt-k8s-aws" -f generated-values.yaml

# Wróć do początkowego katalogu
Set-Location $INITIAL_LOCATION
