Use this overlay to deploy the FFDD application into the `ffdd2` namespace.

Deploy:

```bash
kubectl apply -k k8s/overlays/ffdd2
```

Notes:
- This overlay reuses the base manifests and sets `namespace: ffdd2`.
- Monitoring is separate; if you want monitoring for ffdd2, add ffdd2 to Prometheus scrape (already done) and provision Grafana dashboards.
