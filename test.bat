@echo off

REM Expect prometheus-pushgateway to be deployed in namespace 'monitoring'
kubectl get svc prometheus-pushgateway -n monitoring >nul 2>&1
if %errorlevel% EQU 0 (
    echo [INFO] Found prometheus-pushgateway in namespace monitoring
    start "Pushgateway Port Forward" cmd /c "kubectl port-forward svc/prometheus-pushgateway 9091:9091 -n monitoring"
) else (
    echo [ERROR] prometheus-pushgateway not found in namespace 'monitoring'
    pause
    exit /b 1
)
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
