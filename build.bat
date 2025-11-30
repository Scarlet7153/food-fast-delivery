@echo off

kubectl delete all --all -n ffdd 2>nul
kubectl delete configmap --all -n ffdd 2>nul
kubectl delete secret --all -n ffdd 2>nul
kubectl delete pvc --all -n ffdd 2>nul
kubectl delete namespace ffdd 2>nul

kubectl delete all --all -n monitoring 2>nul
kubectl delete configmap --all -n monitoring 2>nul
kubectl delete secret --all -n monitoring 2>nul
kubectl delete pvc --all -n monitoring 2>nul
kubectl delete namespace monitoring 2>nul
timeout /t 5 /nobreak >nul

for /f "tokens=*" %%i in ('docker images --format "{{.Repository}}:{{.Tag}}" ^| findstr /i "ffdd- food-fast-delivery-"') do docker rmi %%i -f 2>nul
docker image prune -f
docker container prune -f

rem use the script directory as project root
pushd "%~dp0" >nul
docker-compose build --no-cache

docker tag food-fast-delivery-api-gateway:latest ffdd-api-gateway:latest 2>nul
docker tag food-fast-delivery-user-service:latest ffdd-user-service:latest 2>nul
docker tag food-fast-delivery-restaurant-service:latest ffdd-restaurant-service:latest 2>nul
docker tag food-fast-delivery-order-service:latest ffdd-order-service:latest 2>nul
docker tag food-fast-delivery-payment-service:latest ffdd-payment-service:latest 2>nul
docker tag food-fast-delivery-drone-service:latest ffdd-drone-service:latest 2>nul
docker tag food-fast-delivery-client:latest ffdd-client:latest 2>nul

kubectl create namespace ffdd
kubectl apply -f k8s\configmap.yaml
kubectl apply -f k8s\secrets.yaml
kubectl apply -f k8s\mongodb.yaml
kubectl wait --for=condition=ready pod -l app=mongodb -n ffdd --timeout=120s
kubectl apply -f k8s\user-service.yaml
kubectl apply -f k8s\restaurant-service.yaml
kubectl apply -f k8s\order-service.yaml
kubectl apply -f k8s\payment-service.yaml
kubectl apply -f k8s\drone-service.yaml
kubectl apply -f k8s\api-gateway.yaml
kubectl apply -f k8s\client.yaml
kubectl apply -f k8s\monitoring\prometheus-config.yaml
kubectl apply -f k8s\monitoring\prometheus.yaml
kubectl apply -f k8s\monitoring\prometheus-pushgateway.yaml
kubectl apply -f k8s\monitoring\grafana-dashboard.yaml
kubectl apply -f k8s\monitoring\grafana-test-dashboard.yaml
kubectl apply -f k8s\monitoring\grafana.yaml

timeout /t 15 /nobreak >nul

kubectl get pods -n ffdd
kubectl get svc -n ffdd

REM Ensure monitoring namespace exists and apply monitoring manifests there
echo [INFO] Ensuring monitoring namespace exists...
kubectl create namespace monitoring 2>nul || echo Namespace monitoring already exists
echo [INFO] Applying monitoring manifests into namespace 'monitoring'...
kubectl apply -f k8s\monitoring\prometheus-config.yaml
kubectl apply -f k8s\monitoring\prometheus.yaml
kubectl apply -f k8s\monitoring\prometheus-pushgateway.yaml
kubectl apply -f k8s\monitoring\grafana-dashboard.yaml
kubectl apply -f k8s\monitoring\grafana-test-dashboard.yaml
kubectl apply -f k8s\monitoring\grafana.yaml

popd >nul

pause
