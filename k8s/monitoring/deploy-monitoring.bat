@echo off
echo ========================================
echo  Deploy Monitoring Stack (Prometheus + Grafana)
echo ========================================
echo.

REM Check if kubectl is available
kubectl version --client >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: kubectl is not installed or not in PATH
    exit /b 1
)

REM Get script directory and change to it
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"
echo Running from: %CD%
echo.

echo [1/5] Checking namespace...
kubectl get namespace ffdd >nul 2>&1
if %errorlevel% neq 0 (
    echo Namespace ffdd does not exist. Creating...
    kubectl create namespace ffdd
) else (
    echo Namespace ffdd already exists.
)
echo.

echo [2/5] Deploying Prometheus Config...
kubectl apply -f prometheus-config.yaml
if %errorlevel% neq 0 (
    echo Error: Failed to deploy Prometheus config
    exit /b 1
)
echo.

echo [3/5] Deploying Prometheus...
kubectl apply -f prometheus.yaml
if %errorlevel% neq 0 (
    echo Error: Failed to deploy Prometheus
    exit /b 1
)
echo.

echo [4/5] Deploying Grafana Dashboard...
kubectl apply -f grafana-dashboard.yaml
if %errorlevel% neq 0 (
    echo Error: Failed to deploy Grafana dashboard
    exit /b 1
)
echo.

echo [5/5] Deploying Grafana...
kubectl apply -f grafana.yaml
if %errorlevel% neq 0 (
    echo Error: Failed to deploy Grafana
    exit /b 1
)
echo.

echo ========================================
echo  Waiting for pods to be ready...
echo ========================================
echo.

echo Waiting for Prometheus...
kubectl wait --for=condition=ready pod -l app=prometheus -n ffdd --timeout=120s
if %errorlevel% neq 0 (
    echo Warning: Prometheus pod is not ready yet. Check status with: kubectl get pods -n ffdd
)

echo Waiting for Grafana...
kubectl wait --for=condition=ready pod -l app=grafana -n ffdd --timeout=120s
if %errorlevel% neq 0 (
    echo Warning: Grafana pod is not ready yet. Check status with: kubectl get pods -n ffdd
)
echo.

echo ========================================
echo  Deployment completed!
echo ========================================
echo.
echo Services:
echo   - Prometheus: http://localhost:30090
echo   - Grafana:    http://localhost:31000
echo.
echo Grafana Login:
echo   Username: admin
echo   Password: admin123
echo.
echo Check status:
echo   kubectl get pods -n ffdd -l 'app in (prometheus,grafana)'
echo   kubectl get svc -n ffdd -l 'app in (prometheus,grafana)'
echo.
echo View logs:
echo   kubectl logs -f -l app=prometheus -n ffdd
echo   kubectl logs -f -l app=grafana -n ffdd
echo.
echo ========================================

