$INITIAL_LOCATION = Get-Location

$PROJECT_ROOT = (git rev-parse --show-toplevel)

Set-Location "$PROJECT_ROOT/terraform/infrastructure"

$REPO_URL = terraform output -raw repository_url
$CLUSTER_ENDPOINT = terraform output -raw eks_cluster_endpoint
$CLUSTER_NAME = terraform output -raw eks_cluster_name
$CERT_AUTH = terraform output -raw eks_certificate_authority
$INGRESS_HOST = terraform output -raw ingress_hostname

Set-Location $PROJECT_ROOT

$envContent = Get-Content .env
$JWT_KEY = ($envContent | Where-Object { $_ -match "^JWT_KEY=" -and $_ -notmatch "^#" }) -replace "JWT_KEY=", ""
$DATABASE_URL = ($envContent | Where-Object { $_ -match "^DATABASE_URL=" -and $_ -notmatch "^#" }) -replace "DATABASE_URL=", ""
$ENVIRONMENT = ($envContent | Where-Object { $_ -match "^ENVIRONMENT=" -and $_ -notmatch "^#" }) -replace "ENVIRONMENT=", ""
Set-Location "$PROJECT_ROOT/charts/apt-k8s-aws"

$valuesContent = @"
frontend:
  name: frontend
  replicaCount: 1
  image:
    repository: $REPO_URL
    tag: frontend-$ENVIRONMENT-latest
    pullPolicy: Always
  container:
    targetPort: 3000
  service:
    type: ClusterIP
    port: 3000
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
    repository: $REPO_URL
    tag: backend-$ENVIRONMENT-latest
    pullPolicy: Always
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
    repository: $REPO_URL
    tag: calc-module-$ENVIRONMENT-latest
    pullPolicy: Always
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
  host: $INGRESS_HOST

secrets:
  DATABASE_URL: $DATABASE_URL
  JWT_KEY: $JWT_KEY

eks:
  cluster:
    endpoint: $CLUSTER_ENDPOINT
    name: $CLUSTER_NAME
    certificateAuthority: $CERT_AUTH
"@

$valuesContent | Out-File -FilePath generated-values.yaml -Encoding UTF8

$maskedContent = $valuesContent
$maskedContent = $maskedContent -replace [regex]::Escape($JWT_KEY), "********"
$maskedContent = $maskedContent -replace [regex]::Escape($DATABASE_URL), "********"
$maskedContent = $maskedContent -replace [regex]::Escape($CERT_AUTH), "********"

Write-Host "Generated values.yaml content:"
Write-Host "----------------------------------------"
Write-Host $maskedContent
Write-Host "----------------------------------------"

Write-Host "`nUninstalling previous helm release..."
helm uninstall apt --ignore-not-found

Write-Host "`nExecuting: helm install apt '$PROJECT_ROOT/charts/apt-k8s-aws' -f generated-values.yaml"

helm install apt "$PROJECT_ROOT/charts/apt-k8s-aws" -f generated-values.yaml

Set-Location $INITIAL_LOCATION
