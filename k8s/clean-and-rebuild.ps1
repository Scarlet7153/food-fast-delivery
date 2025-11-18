# Clean and Rebuild Everything - Docker & Kubernetes
# This script will:
# 1. Stop and remove all Docker containers
# 2. Remove all Docker images
# 3. Delete Kubernetes namespace (removes all resources)
# 4. Build Docker images from scratch
# 5. Deploy to Kubernetes

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Clean and Rebuild Everything" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to project root
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

Write-Host "[1/6] Stopping all Docker containers..." -ForegroundColor Yellow
docker stop $(docker ps -aq) 2>$null
if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq 1) {
    Write-Host "  ✓ Containers stopped" -ForegroundColor Green
}

Write-Host "[2/6] Removing all Docker containers..." -ForegroundColor Yellow
docker rm $(docker ps -aq) 2>$null
if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq 1) {
    Write-Host "  ✓ Containers removed" -ForegroundColor Green
}

Write-Host "[3/6] Removing Docker images..." -ForegroundColor Yellow
$images = docker images --format "{{.ID}}" | Where-Object { $_ -ne "" }
if ($images) {
    docker rmi -f $images 2>$null
    Write-Host "  ✓ Images removed" -ForegroundColor Green
} else {
    Write-Host "  ℹ No images to remove" -ForegroundColor Gray
}

Write-Host "[4/6] Cleaning Docker system..." -ForegroundColor Yellow
docker system prune -af --volumes 2>$null
Write-Host "  ✓ Docker system cleaned" -ForegroundColor Green

Write-Host "[5/6] Deleting Kubernetes namespace (removes all resources)..." -ForegroundColor Yellow
kubectl delete namespace ffdd 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Namespace deleted, waiting for cleanup..." -ForegroundColor Green
    Start-Sleep -Seconds 5
} else {
    Write-Host "  ℹ Namespace may not exist" -ForegroundColor Gray
}

Write-Host "[6/6] Building Docker images from scratch..." -ForegroundColor Yellow
docker-compose build --no-cache
if ($LASTEXITCODE -NE 0) {
    Write-Host "  ✗ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Images built successfully" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Build Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run: .\k8s\deploy.bat" -ForegroundColor White
Write-Host "     OR" -ForegroundColor White
Write-Host "  2. Run: kubectl apply -f k8s\namespace.yaml" -ForegroundColor White
Write-Host "     Then deploy services manually" -ForegroundColor White
Write-Host ""

