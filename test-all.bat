@echo off
echo ========================================
echo Testing all services...
echo ========================================

echo.
echo [1/6] Testing User Service...
cd services\user-service
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)
call npm test
if errorlevel 1 (
    echo User Service tests failed!
    cd ..\..
    exit /b 1
)
cd ..\..

echo.
echo [2/6] Testing API Gateway...
cd services\api-gateway
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)
call npm test
if errorlevel 1 (
    echo API Gateway tests failed!
    cd ..\..
    exit /b 1
)
cd ..\..

echo.
echo [3/6] Testing Order Service...
cd services\order-service
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)
call npm test
if errorlevel 1 (
    echo Order Service tests failed!
    cd ..\..
    exit /b 1
)
cd ..\..

echo.
echo [4/6] Testing Restaurant Service...
cd services\restaurant-service
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)
call npm test
if errorlevel 1 (
    echo Restaurant Service tests failed!
    cd ..\..
    exit /b 1
)
cd ..\..

echo.
echo [5/6] Testing Drone Service...
cd services\drone-service
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)
call npm test
if errorlevel 1 (
    echo Drone Service tests failed!
    cd ..\..
    exit /b 1
)
cd ..\..

echo.
echo [6/6] Testing Payment Service...
cd services\payment-service
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)
call npm test
if errorlevel 1 (
    echo Payment Service tests failed!
    cd ..\..
    exit /b 1
)
cd ..\..

echo.
echo ========================================
echo ✅ All tests completed successfully!
echo ========================================

