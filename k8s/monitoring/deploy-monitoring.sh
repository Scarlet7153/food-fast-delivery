#!/bin/bash

echo "========================================"
echo " Deploy Monitoring Stack (Prometheus + Grafana)"
echo "========================================"
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "Error: kubectl is not installed or not in PATH"
    exit 1
fi

# Get script directory and change to it
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"
echo "Running from: $(pwd)"
echo ""

echo "[1/5] Checking namespace..."
if ! kubectl get namespace monitoring &> /dev/null; then
    echo "Namespace monitoring does not exist. Creating..."
    kubectl create namespace monitoring
else
    echo "Namespace monitoring already exists."
fi
echo ""

echo "[2/5] Deploying Prometheus Config..."
kubectl apply -f prometheus-config.yaml
if [ $? -ne 0 ]; then
    echo "Error: Failed to deploy Prometheus config"
    exit 1
fi
echo ""

echo "[3/5] Deploying Prometheus..."
kubectl apply -f prometheus.yaml
if [ $? -ne 0 ]; then
    echo "Error: Failed to deploy Prometheus"
    exit 1
fi
echo ""

echo "[4/5] Deploying Grafana Dashboard..."
kubectl apply -f grafana-dashboard.yaml
if [ $? -ne 0 ]; then
    echo "Error: Failed to deploy Grafana dashboard"
    exit 1
fi
echo ""

echo "[5/5] Deploying Grafana..."
kubectl apply -f grafana.yaml
if [ $? -ne 0 ]; then
    echo "Error: Failed to deploy Grafana"
    exit 1
fi
echo ""

echo "========================================"
echo " Waiting for pods to be ready..."
echo "========================================"
echo ""

echo "Waiting for Prometheus..."
kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=120s
if [ $? -ne 0 ]; then
    echo "Warning: Prometheus pod is not ready yet. Check status with: kubectl get pods -n monitoring"
fi

echo "Waiting for Grafana..."
kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=120s
if [ $? -ne 0 ]; then
    echo "Warning: Grafana pod is not ready yet. Check status with: kubectl get pods -n monitoring"
fi
echo ""

echo "========================================"
echo " Deployment completed!"
echo "========================================"
echo ""
echo "Services:"
echo "  - Prometheus: http://localhost:30090"
echo "  - Grafana:    http://localhost:31000"
echo ""
echo "Grafana Login:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "Check status:"
echo "  kubectl get pods -n monitoring -l 'app in (prometheus,grafana)'"
echo "  kubectl get svc -n monitoring -l 'app in (prometheus,grafana)'"
echo ""
echo "View logs:"
echo "  kubectl logs -f -l app=prometheus -n monitoring"
echo "  kubectl logs -f -l app=grafana -n monitoring"
echo ""
echo "========================================"

