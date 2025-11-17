@echo off
REM Fast Food Delivery Drone System - Kubernetes Deployment Script for Windows
REM For Docker Desktop Kubernetes

REM Change to project root directory (parent of k8s folder)
cd /d "%~dp0\.."

echo.
echo ========================================
echo Fast Food Delivery Drone System
echo Kubernetes Deployment
echo ========================================
echo.

REM Check if kubectl is installed
where kubectl >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] kubectl is not installed. Please install kubectl first.
    pause
    exit /b 1
)

REM Check if Kubernetes is running
kubectl cluster-info >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Kubernetes cluster is not running. Please enable Kubernetes in Docker Desktop.
    pause
    exit /b 1
)

REM Build Docker images first
echo [INFO] Building Docker images...
docker-compose build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

REM Tag images for Kubernetes
echo [INFO] Tagging images for Kubernetes...
docker tag food-fast-delivery-api-gateway:latest ffdd-api-gateway:latest 2>nul
docker tag food-fast-delivery-user-service:latest ffdd-user-service:latest 2>nul
docker tag food-fast-delivery-restaurant-service:latest ffdd-restaurant-service:latest 2>nul
docker tag food-fast-delivery-order-service:latest ffdd-order-service:latest 2>nul
docker tag food-fast-delivery-drone-service:latest ffdd-drone-service:latest 2>nul
docker tag food-fast-delivery-payment-service:latest ffdd-payment-service:latest 2>nul
docker tag food-fast-delivery-client:latest ffdd-client:latest 2>nul
echo [INFO] Images tagged for Kubernetes

REM Apply namespace
echo [INFO] Creating namespace...
kubectl apply -f k8s/namespace.yaml

REM Apply ConfigMap and Secrets
echo [INFO] Creating ConfigMap and Secrets...
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

REM Apply MongoDB
echo [INFO] Deploying MongoDB...
kubectl apply -f k8s/mongodb.yaml

REM Wait for MongoDB
echo [INFO] Waiting for MongoDB to be ready...
timeout /t 30 /nobreak >nul

REM Apply services
echo [INFO] Deploying microservices...
kubectl apply -f k8s/user-service.yaml
kubectl apply -f k8s/restaurant-service.yaml
kubectl apply -f k8s/order-service.yaml
kubectl apply -f k8s/drone-service.yaml
kubectl apply -f k8s/payment-service.yaml
kubectl apply -f k8s/api-gateway.yaml
kubectl apply -f k8s/client.yaml

REM Wait a bit for deployments
echo [INFO] Waiting for deployments to be ready...
timeout /t 30 /nobreak >nul

REM Show status
echo.
echo ========================================
echo Deployment completed!
echo ========================================
echo.
echo Service Status:
kubectl get pods -n ffdd
kubectl get services -n ffdd

echo.
echo Services are available at:
echo   API Gateway: http://localhost:30001
echo   Client: http://localhost:30173
echo.
echo Useful commands:
echo   kubectl get pods -n ffdd              # View pods
echo   kubectl get services -n ffdd          # View services
echo   kubectl logs -f ^<pod-name^> -n ffdd    # View logs
echo   kubectl delete namespace ffdd         # Delete everything
echo.
pause

