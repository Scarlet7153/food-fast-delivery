@echo off

REM Build and deploy the FFDD application into namespace ffdd2 using kustomize overlay

rem Use project root
cd /d "%~dp0"

REM Check kubectl
where kubectl >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] kubectl is not installed. Please install kubectl first.
    pause
    exit /b 1
)

REM Cleanup any existing ffdd2 namespace resources (run before build)
echo [INFO] Deleting existing ffdd2 resources (if any)...
kubectl delete all --all -n ffdd2 2>nul
kubectl delete configmap --all -n ffdd2 2>nul
kubectl delete secret --all -n ffdd2 2>nul
kubectl delete pvc --all -n ffdd2 2>nul
kubectl delete namespace ffdd2 2>nul


REM Build Docker images
echo [INFO] Building Docker images...
docker-compose build --no-cache

REM Tag images
docker tag food-fast-delivery-api-gateway:latest ffdd-api-gateway:latest 2>nul
docker tag food-fast-delivery-user-service:latest ffdd-user-service:latest 2>nul
docker tag food-fast-delivery-restaurant-service:latest ffdd-restaurant-service:latest 2>nul
docker tag food-fast-delivery-order-service:latest ffdd-order-service:latest 2>nul
docker tag food-fast-delivery-payment-service:latest ffdd-payment-service:latest 2>nul
rem skip tagging drone image for ffdd2 (we won't deploy drone-service in project 2)
echo [INFO] Skipping drone-service image tag for ffdd2
docker tag food-fast-delivery-client:latest ffdd-client:latest 2>nul

REM Generate manifests from base k8s, replace namespace ffdd -> ffdd2, and apply
echo [INFO] Generating manifests from k8s base and adapting namespace to ffdd2...
set TEMP_MANIFEST=%TEMP%\ffdd2-manifest.yaml
if exist "%TEMP_MANIFEST%" del /f /q "%TEMP_MANIFEST%"

kubectl kustomize k8s > "%TEMP_MANIFEST%"

REM --- ĐÃ SỬA DÒNG DƯỚI ĐÂY (thay -> thành to) ---
echo [INFO] Rewriting namespace entries from ffdd to ffdd2 in generated manifest...
powershell -Command "(Get-Content -Raw '%TEMP_MANIFEST%') -replace 'namespace: ffdd','namespace: ffdd2' | Set-Content '%TEMP_MANIFEST%'"

echo [INFO] Removing explicit nodePort entries to avoid collisions on host
powershell -Command "(Get-Content -Raw '%TEMP_MANIFEST%') -replace '\r?\n\s*nodePort:\s*[0-9]+' , '' | Set-Content '%TEMP_MANIFEST%'"

echo [INFO] Removing drone-service documents from generated manifest (ffdd2)
powershell -NoProfile -Command " $text = Get-Content -Raw '%TEMP_MANIFEST%'; $docs = [regex]::Split($text,'(?m)^\s*---\s*$'); $filtered = $docs | Where-Object {$_ -notmatch 'name:\s*drone-service'}; ($filtered -join \"`n---`n\") | Set-Content -LiteralPath '%TEMP_MANIFEST%'; "

echo [INFO] Applying generated manifest to cluster...
REM Ensure ffdd2 namespace exists (create if missing)
kubectl get namespace ffdd2 >nul 2>nul || kubectl create namespace ffdd2

kubectl apply -f "%TEMP_MANIFEST%"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] kubectl apply failed
    type "%TEMP_MANIFEST%"
    pause
    exit /b 1
)

REM Clean up temp manifest
del /f /q "%TEMP_MANIFEST%" 2>nul

echo [INFO] Waiting for pods to be ready in ffdd2 (short wait)...
timeout /t 15 /nobreak >nul
kubectl get pods -n ffdd2
kubectl get svc -n ffdd2

echo [INFO] Done.
pause