@echo off

kubectl get svc prometheus-pushgateway -n ffdd >nul 2>&1
if %errorlevel% neq 0 (
    pause
    exit /b 1
)

start "Pushgateway Port Forward" cmd /c "kubectl port-forward svc/prometheus-pushgateway 9091:9091 -n ffdd"
timeout /t 5 /nobreak >nul

curl -s http://localhost:9091/metrics >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 3 /nobreak >nul
)

set PROMETHEUS_PUSHGATEWAY_URL=http://localhost:9091
rem use the script directory as project root
pushd "%~dp0" >nul

cd services\user-service
call npm test
cd ..\..

cd services\restaurant-service
call npm test
cd ..\..

cd services\payment-service
call npm test
cd ..\..

cd services\order-service
call npm test
cd ..\..

cd services\drone-service
call npm test
cd ..\..

cd services\api-gateway
call npm test
cd ..\..

popd >nul
pause
