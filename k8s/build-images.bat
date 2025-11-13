@echo off
REM Build and tag Docker images for Kubernetes (Windows)

echo.
echo ========================================
echo Building Docker Images for Kubernetes
echo ========================================
echo.

REM Build using docker-compose
echo [INFO] Building Docker images...
docker-compose build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

REM Tag images for Kubernetes
echo [INFO] Tagging images for Kubernetes...
docker tag food-fast-delivery-api-gateway:latest ffdd-api-gateway:latest 2>nul && echo [OK] Tagged api-gateway || echo [WARN] api-gateway image not found
docker tag food-fast-delivery-user-service:latest ffdd-user-service:latest 2>nul && echo [OK] Tagged user-service || echo [WARN] user-service image not found
docker tag food-fast-delivery-restaurant-service:latest ffdd-restaurant-service:latest 2>nul && echo [OK] Tagged restaurant-service || echo [WARN] restaurant-service image not found
docker tag food-fast-delivery-order-service:latest ffdd-order-service:latest 2>nul && echo [OK] Tagged order-service || echo [WARN] order-service image not found
docker tag food-fast-delivery-drone-service:latest ffdd-drone-service:latest 2>nul && echo [OK] Tagged drone-service || echo [WARN] drone-service image not found
docker tag food-fast-delivery-payment-service:latest ffdd-payment-service:latest 2>nul && echo [OK] Tagged payment-service || echo [WARN] payment-service image not found
docker tag food-fast-delivery-client:latest ffdd-client:latest 2>nul && echo [OK] Tagged client || echo [WARN] client image not found

echo.
echo ========================================
echo Build completed!
echo ========================================
echo.
echo All images are ready for Kubernetes.
echo Docker Desktop automatically makes local images available to Kubernetes.
echo.
pause

