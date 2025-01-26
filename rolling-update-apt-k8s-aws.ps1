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
    $INITIAL_LOCATION = Get-Location
    exit 1
}

$PROJECT_ROOT = (git rev-parse --show-toplevel)

$envContent = Get-Content .env
$ENVIRONMENT = (($envContent | Where-Object { $_ -match "^ENVIRONMENT=" -and $_ -notmatch "^#" }) -replace "ENVIRONMENT=", "").Trim()

$NAMESPACE = if ($ENVIRONMENT -eq "prod") { "production" } else { "staging" }
$HELM_RELEASE_NAME = "apt"


function Get-CurrentImages {
    param ([string]$namespace)

    $pods = kubectl get pods -n $namespace -l "apt.kubernetes.io/tier" -o json | ConvertFrom-Json
    $currentImages = @{}

    foreach ($pod in $pods.items) {
        foreach ($container in $pod.status.containerStatuses) {
            if ($container.name -eq "rabbitmq") { continue }
            $componentName = $pod.metadata.labels.'apt.kubernetes.io/tier' -replace "air-pollution-tracker-", ""
            $currentImages[$componentName] = @{
                FullImage = $container.image
                Sha = ($container.imageID -split "@")[1]
            }
        }
    }
    return $currentImages
}

function Get-AvailableImages {
    param ([string]$repository, [string]$environment)

    $ecrImages = aws ecr describe-images --repository-name $repository | ConvertFrom-Json
    $availableImages = @{}

    foreach ($image in $ecrImages.imageDetails) {
        foreach ($tag in $image.imageTags) {
            if ($tag -like "*-$environment*") {
                $componentName = switch -Wildcard ($tag) {
                    "frontend-*" { "frontend" }
                    "backend-*" { "backend" }
                    "calc-module-*" { "calc-module" }
                    default { continue }
                }
                
                $availableImages[$componentName] = @{
                    Tag = $tag
                    Sha = $image.imageDigest
                }
            }
        }
    }

    return $availableImages
}

function Verify-RequiredValues {
    param (
        [string]$releaseName,
        [string]$chartPath,
        [string]$namespace
    )
    
    Log "Verifying Helm chart values..."
    
    $currentValues = helm get values $releaseName -n $namespace -a -o json | ConvertFrom-Json
    
    if (-not $currentValues.secrets -or 
        -not $currentValues.secrets.DATABASE_URL -or 
        -not $currentValues.secrets.JWT_KEY) {
        throw "Missing required secrets (DATABASE_URL and/or JWT_KEY). Please ensure secrets are configured."
    }
}

function Verify-Deployment {
    param ([string]$namespace)

    Log "Fetching all events during rolling update..."
    kubectl get events -n $namespace --sort-by='.metadata.creationTimestamp'

    Log "Fetching state of all pods in namespace $namespace..."
    kubectl get pods -n $namespace -o wide

    Log "Verifying deployed images in pod definitions..."
    $pods = kubectl get pods -n $namespace -o json | ConvertFrom-Json

    foreach ($pod in $pods.items) {
        foreach ($container in $pod.spec.containers) {
            Log "Pod: $($pod.metadata.name), Container: $($container.name), Image: $($container.image)"
        }
    }
}


Log "Checking for existing deployment of $HELM_RELEASE_NAME..."
$helmStatus = helm status $HELM_RELEASE_NAME --namespace $NAMESPACE 2>$null

if (-not $helmStatus) {
    Error "Helm release $HELM_RELEASE_NAME not found in namespace $NAMESPACE. Exiting."
}

$currentImages = Get-CurrentImages -namespace $NAMESPACE
Log "Currently deployed images:"
$currentImages.GetEnumerator() | ForEach-Object {
    Log "$($_.Key): Tag=$($_.Value.FullImage.Split(':')[-1]), SHA=$($_.Value.Sha)"
}

Log "Fetching available images from ECR for $ENVIRONMENT..."
$availableImages = Get-AvailableImages -repository "air-pollution-tracker" -environment $ENVIRONMENT
Log "Available images in ECR:"
$availableImages.GetEnumerator() | ForEach-Object {
    Log "$($_.Key): Tag=$($_.Value.Tag), SHA=$($_.Value.Sha)"
}

Log "Comparing current and available images..."
$imagesToUpdate = @{}

foreach ($key in $currentImages.Keys) {
    $currentSha = $currentImages[$key].Sha
    $availableSha = $availableImages[$key].Sha

    if ($currentSha -ne $availableSha) {
        $imagesToUpdate[$key] = $availableImages[$key]
    }
}

if ($imagesToUpdate.Count -eq 0) {
    Warn "No images require an update."
    exit
}

Log "Images to update:"
$imagesToUpdate.GetEnumerator() | ForEach-Object {
    Log "$($_.Key): New Tag=$($_.Value.Tag), New SHA=$($_.Value.Sha)"
}


Warn "Do you want to proceed with the update? (Y/N)"
$confirmation = Read-Host
if ($confirmation -ne "Y") {
    Error "Update cancelled."
    exit
}

try {

    Log "Starting Helm upgrade for $HELM_RELEASE_NAME..."
    Verify-RequiredValues -releaseName $HELM_RELEASE_NAME -namespace $NAMESPACE -chartPath "$PROJECT_ROOT/charts/apt-k8s-aws"

    $upgradeArgs = @(
        $HELM_RELEASE_NAME,
        "$PROJECT_ROOT/charts/apt-k8s-aws",
        "--namespace", $NAMESPACE,
        "--atomic",
        "--timeout", "5m",
        "--wait",
        "--reuse-values"
    )

    foreach ($component in $imagesToUpdate.Keys) {
        $upgradeArgs += "--set", "$component.image.tag=$($imagesToUpdate[$component].Tag)"
    
        if ($component -eq "calc-module") {
            $upgradeArgs += "--force"
        }
    }
    
    $helmCommand = "helm upgrade " + ($upgradeArgs -join " ")
    Log "Helm command to be executed: $helmCommand"

    helm upgrade @upgradeArgs 2>&1 | Tee-Object -Variable helmOutput

    if ($LASTEXITCODE -ne 0) {
        throw "Helm upgrade failed."
    }

    Log "Helm upgrade output:"
    Write-Host $helmOutput

    Log "Deployment completed successfully!"
    Verify-Deployment -namespace $NAMESPACE
} catch {
    Warn "Deployment failed: $_"
    Warn "Rolling back to the previous release..."
    helm rollback $HELM_RELEASE_NAME 0
    Verify-Deployment -namespace $NAMESPACE
    Error "Rollback completed. Exiting."
}