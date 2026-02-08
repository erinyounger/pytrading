# 运维概览

## 概述

xTrading系统采用现代化的运维体系，支持容器化部署、自动扩缩容、监控告警和日志管理。本文档详细介绍系统的运维架构和最佳实践。

## 运维架构

### 基础设施层
- **容器编排**：Kubernetes
- **负载均衡**：Nginx + Kong
- **服务网格**：Istio（可选）
- **存储**：NFS、Ceph

### 监控层
- **指标监控**：Prometheus + Grafana
- **日志聚合**：ELK Stack (Elasticsearch + Logstash + Kibana)
- **链路追踪**：Jaeger
- **告警管理**：AlertManager

### 自动化层
- **CI/CD**：GitHub Actions + ArgoCD
- **配置管理**：Ansible + Consul
- **自动化部署**：Helm Charts
- **自愈机制**：Kubernetes Operators

### 安全层
- **身份认证**：OAuth 2.0 + OIDC
- **网络策略**：Kubernetes Network Policies
- **密钥管理**：HashiCorp Vault
- **镜像扫描**：Trivy + Clair

## 环境规划

### 开发环境 (Development)
- **用途**：开发调试、代码验证
- **资源**：2C4G × 2节点
- **数据存储**：本地存储
- **监控**：基础监控
- **备份**：每日备份

### 测试环境 (Staging)
- **用途**：功能测试、性能测试、用户验收测试
- **资源**：4C8G × 3节点
- **数据存储**：共享存储
- **监控**：完整监控
- **备份**：每日备份

### 生产环境 (Production)
- **用途**：生产运行
- **资源**：8C16G × 5节点（支持水平扩展）
- **数据存储**：分布式存储
- **监控**：完整监控 + 告警
- **备份**：实时备份 + 异地容灾

## 服务架构

### 前端服务
```
┌─────────────────┐
│   CDN (Cloudflare)   │
│  静态资源加速    │
└────────┬────────┘
         │
┌────────┴────────┐
│   Nginx Load Balancer  │
│   负载均衡 + SSL  │
└────────┬────────┘
         │
┌────────┴────────┐
│  React Web App   │
│  (Kubernetes)     │
└─────────────────┘
```

### 后端服务
```
┌─────────────────┐
│   Kong API Gateway  │
│   API网关 + 限流  │
└────────┬────────┘
         │
┌────────┴────────┐
│   Microservices     │
│  ┌─────────────┐  │
│  │User Service  │  │
│  └─────────────┘  │
│  ┌─────────────┐  │
│  │Strategy Svc │  │
│  └─────────────┘  │
│  ┌─────────────┐  │
│  │Backtest Svc │  │
│  └─────────────┘  │
└─────────────────┘
```

### 数据层
```
┌─────────────────┐
│  PostgreSQL      │
│  (主从复制)      │
└────────┬────────┘
         │
┌────────┴────────┐
│   Redis Cluster   │
│   (缓存层)      │
└────────┬────────┘
         │
┌────────┴────────┐
│   InfluxDB      │
│  (时序数据)     │
└─────────────────┘
```

## 部署流程

### 1. 持续集成 (CI)

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov

      - name: Run tests
        run: |
          pytest tests/ --cov=src --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker images
        run: |
          docker build -t pytrading/backend:${{ github.sha }} ./backend
          docker build -t pytrading/frontend:${{ github.sha }} ./frontend

      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push pytrading/backend:${{ github.sha }}
          docker push pytrading/frontend:${{ github.sha }}
```

### 2. 持续部署 (CD)

```yaml
# .github/workflows/cd.yml
name: CD Pipeline

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: |
          kubectl config use-context staging
          helm upgrade --install pytrading ./helm/pytrading \
            --namespace pytrading-staging \
            --set image.tag=${{ github.sha }} \
            --set replicaCount=2

  deploy-production:
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    needs: deploy-staging
    steps:
      - name: Deploy to production
        run: |
          kubectl config use-context production
          helm upgrade --install pytrading ./helm/pytrading \
            --namespace pytrading-prod \
            --set image.tag=${{ github.sha }} \
            --set replicaCount=5
```

### 3. 自动化部署脚本

```bash
#!/bin/bash
# deploy.sh

set -e

# 配置变量
NAMESPACE=${1:-pytrading}
RELEASE_NAME="pytrading"
CHART_PATH="./helm/pytrading"
IMAGE_TAG=${2:-latest}

echo "部署配置："
echo "命名空间: $NAMESPACE"
echo "发布名称: $RELEASE_NAME"
echo "镜像标签: $IMAGE_TAG"

# 检查依赖
echo "检查依赖..."
command -v helm >/dev/null 2>&1 || { echo "Helm未安装" >&2; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "kubectl未安装" >&2; exit 1; }

# 检查集群连接
echo "检查集群连接..."
kubectl cluster-info

# 准备命名空间
echo "准备命名空间..."
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# 安装或更新应用
echo "安装/更新应用..."
helm upgrade --install $RELEASE_NAME $CHART_PATH \
  --namespace $NAMESPACE \
  --set image.tag=$IMAGE_TAG \
  --set replicaCount=3 \
  --set resources.requests.cpu=500m \
  --set resources.requests.memory=1Gi \
  --set resources.limits.cpu=2 \
  --set resources.limits.memory=4Gi \
  --wait --timeout=600s

# 检查部署状态
echo "检查部署状态..."
kubectl rollout status deployment/pytrading-backend -n $NAMESPACE
kubectl rollout status deployment/pytrading-frontend -n $NAMESPACE

# 运行健康检查
echo "运行健康检查..."
kubectl exec -n $NAMESPACE deployment/pytrading-backend -- /app/health-check.sh

echo "部署完成！"
```

## 配置管理

### 1. Helm Chart配置

```yaml
# helm/pytrading/values.yaml
replicaCount: 3

image:
  repository: pytrading
  pullPolicy: IfNotPresent
  backendTag: "latest"
  frontendTag: "latest"

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: api.xtrading.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: pytrading-tls
      hosts:
        - api.xtrading.com

resources:
  limits:
    cpu: 2
    memory: 4Gi
  requests:
    cpu: 500m
    memory: 1Gi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

nodeSelector: {}
tolerations: []
affinity: {}

postgresql:
  enabled: true
  auth:
    postgresPassword: "your-password"
  primary:
    persistence:
      enabled: true
      size: 20Gi

redis:
  enabled: true
  auth:
    enabled: true
  master:
    persistence:
      enabled: true
      size: 10Gi
```

### 2. ConfigMap配置

```yaml
# kubernetes/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: pytrading-config
  namespace: pytrading
data:
  DATABASE_URL: "postgresql://user:pass@postgres:5432/pytrading"
  REDIS_URL: "redis://redis:6379/0"
  RABBITMQ_URL: "amqp://user:pass@rabbitmq:5672/"
  LOG_LEVEL: "INFO"
  MAX_WORKERS: "10"
  API_RATE_LIMIT: "1000"
---
apiVersion: v1
kind: Secret
metadata:
  name: pytrading-secrets
  namespace: pytrading
type: Opaque
stringData:
  SECRET_KEY: "your-secret-key"
  JWT_SECRET: "your-jwt-secret"
  DATABASE_PASSWORD: "your-db-password"
  REDIS_PASSWORD: "your-redis-password"
```

## 监控体系

### 1. 指标监控

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'pytrading-backend'
    static_configs:
      - targets: ['backend-service:8000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'pytrading-database'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'pytrading-redis'
    static_configs:
      - targets: ['redis-exporter:9121']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### 2. 告警规则

```yaml
# monitoring/alert_rules.yml
groups:
  - name: pytrading
    rules:
      - alert: HighCPUUsage
        expr: cpu_usage_percent > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "CPU使用率过高"
          description: "CPU使用率已达到 {{ $value }}%"

      - alert: HighMemoryUsage
        expr: memory_usage_percent > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "内存使用率过高"
          description: "内存使用率已达到 {{ $value }}%"

      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "服务不可用"
          description: "{{ $labels.job }} 服务已下线"

      - alert: DatabaseDown
        expr: postgres_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "数据库连接失败"
          description: "PostgreSQL 数据库无法连接"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "HTTP错误率过高"
          description: "5xx错误率已达到 {{ $value }}%"
```

### 3. Grafana仪表盘

```json
{
  "dashboard": {
    "title": "xTrading系统监控",
    "panels": [
      {
        "title": "API请求量",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "title": "API响应时间",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "活跃WebSocket连接",
        "type": "stat",
        "targets": [
          {
            "expr": "websocket_connections_active"
          }
        ]
      },
      {
        "title": "数据库连接数",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends"
          }
        ]
      }
    ]
  }
}
```

## 日志管理

### 1. Fluent Bit配置

```yaml
# logging/fluent-bit-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
  namespace: kube-system
data:
  fluent-bit.conf: |
    [SERVICE]
        Flush         1
        Log_Level     info
        Daemon        off
        Parsers_File  parsers.conf

    [INPUT]
        Name              tail
        Path              /var/log/containers/pytrading-backend*.log
        Parser           docker
        Tag              kube.*
        Refresh_Interval 5

    [FILTER]
        Name    kubernetes
        Match   kube.*
        Kube_URL    https://kubernetes.default.svc:443
        Kube_CA_File /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        Kube_Token  /var/run/secrets/kubernetes.io/serviceaccount/token

    [OUTPUT]
        Name  es
        Match *
        Host  elasticsearch.logging.svc.cluster.local
        Port  9200
        Index pytrading-logs
```

### 2. Elasticsearch索引管理

```python
# scripts/setup_elasticsearch.py
from elasticsearch import Elasticsearch
from datetime import datetime, timedelta

def setup_elasticsearch():
    es = Elasticsearch(['elasticsearch:9200'])

    # 创建索引模板
    index_template = {
        "index_patterns": ["pytrading-logs-*"],
        "settings": {
            "number_of_shards": 1,
            "number_of_replicas": 1,
            "index.lifecycle.name": "pytrading-policy",
            "index.lifecycle.rollover_alias": "pytrading-logs"
        },
        "mappings": {
            "properties": {
                "timestamp": {
                    "type": "date"
                },
                "level": {
                    "type": "keyword"
                },
                "service": {
                    "type": "keyword"
                },
                "message": {
                    "type": "text"
                }
            }
        }
    }

    es.indices.put_template(name="pytrading-logs", body=index_template)

    # 创建生命周期策略
    policy = {
        "policy": {
            "phases": {
                "hot": {
                    "actions": {
                        "rollover": {
                            "max_size": "5GB",
                            "max_age": "30d"
                        }
                    }
                },
                "warm": {
                    "min_age": "30d",
                    "actions": {
                        "allocate": {
                            "number_of_replicas": 0
                        }
                    }
                },
                "cold": {
                    "min_age": "90d",
                    "actions": {
                        "allocate": {
                            "number_of_replicas": 0
                        }
                    }
                },
                "delete": {
                    "min_age": "365d"
                }
            }
        }
    }

    es.ilm.put_lifecycle(name="pytrading-policy", body=policy)

if __name__ == "__main__":
    setup_elasticsearch()
```

## 备份与恢复

### 1. 数据库备份

```bash
#!/bin/bash
# backup_database.sh

BACKUP_DIR="/backup/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# PostgreSQL备份
echo "开始备份PostgreSQL..."
pg_dump -h postgres -U pytrading -d pytrading \
    --format=custom \
    --compress=9 \
    --verbose \
    --file="$BACKUP_DIR/postgresql.dump"

# 压缩备份文件
tar -czf "$BACKUP_DIR/postgresql.tar.gz" -C $BACKUP_DIR postgresql.dump

# 上传到对象存储
aws s3 cp "$BACKUP_DIR/postgresql.tar.gz" s3://pytrading-backups/postgresql/

# 清理本地备份
rm -rf $BACKUP_DIR

# 清理旧备份（保留30天）
find /backup -name "*.tar.gz" -mtime +30 -delete

echo "PostgreSQL备份完成"
```

### 2. 自动化备份脚本

```bash
#!/bin/bash
# daily_backup.sh

set -e

LOG_FILE="/var/log/backup.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

log "开始每日备份"

# 数据库备份
log "备份PostgreSQL数据库..."
pg_dump -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB \
    --format=custom --compress=9 --file="/backup/$(date +%Y%m%d)/postgresql.dump"

log "PostgreSQL备份完成"

# Redis备份
log "备份Redis数据..."
redis-cli --rdb /backup/$(date +%Y%m%d)/redis.rdb

log "Redis备份完成"

# 配置文件备份
log "备份配置文件..."
tar -czf /backup/$(date +%Y%m%d)/config.tar.gz /etc/pytrading/

log "配置文件备份完成"

# 上传到云存储
log "上传备份到云存储..."
aws s3 sync /backup/$(date +%Y%m%d)/ s3://pytrading-backups/$(date +%Y%m%d)/

log "备份上传完成"

# 清理本地备份
log "清理本地备份..."
find /backup -name "*" -mtime +7 -type f -delete

log "每日备份完成"
```

### 3. 恢复流程

```bash
#!/bin/bash
# restore_database.sh

BACKUP_DATE=$1

if [ -z "$BACKUP_DATE" ]; then
    echo "使用方法: $0 <备份日期 (YYYYMMDD)>"
    exit 1
fi

echo "开始恢复数据库 (备份日期: $BACKUP_DATE)"

# 下载备份文件
aws s3 sync s3://pytrading-backups/$BACKUP_DATE/ /tmp/restore/$BACKUP_DATE/

# 恢复PostgreSQL
echo "恢复PostgreSQL..."
pg_restore --host=$POSTGRES_HOST --username=$POSTGRES_USER \
    --dbname=$POSTGRES_DB --verbose \
    /tmp/restore/$BACKUP_DATE/postgresql.dump

echo "PostgreSQL恢复完成"

# 恢复Redis
echo "恢复Redis..."
redis-cli --rdb /tmp/restore/$BACKUP_DATE/redis.rdb

echo "Redis恢复完成"

echo "数据库恢复完成"
```

## 性能优化

### 1. 数据库优化

```sql
-- PostgreSQL配置优化
-- postgresql.conf
shared_buffers = 256MB                # 共享缓冲区
effective_cache_size = 1GB           # 有效缓存大小
maintenance_work_mem = 64MB          # 维护工作内存
checkpoint_completion_target = 0.9    # 检查点完成目标
wal_buffers = 16MB                   # WAL缓冲区
default_statistics_target = 100       # 默认统计目标
random_page_cost = 1.1               # 随机页面成本
effective_io_concurrency = 200        # 有效IO并发数
work_mem = 4MB                       # 工作内存
min_wal_size = 1GB                   # 最小WAL大小
max_wal_size = 4GB                   # 最大WAL大小
```

### 2. 应用优化

```yaml
# Kubernetes资源优化
resources:
  requests:
    cpu: "500m"
    memory: "1Gi"
  limits:
    cpu: "2"
    memory: "4Gi"

# 水平自动扩缩容
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

# 垂直自动扩缩容
verticalPodAutoscaler:
  enabled: true
  updateMode: "Auto"
```

## 安全加固

### 1. 网络策略

```yaml
# network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: pytrading-network-policy
  namespace: pytrading
spec:
  podSelector:
    matchLabels:
      app: pytrading
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: nginx-ingress
    ports:
    - protocol: TCP
      port: 8000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
```

### 2. RBAC配置

```yaml
# rbac.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: pytrading-sa
  namespace: pytrading
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: pytrading
  name: pytrading-role
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: pytrading-rolebinding
  namespace: pytrading
subjects:
- kind: ServiceAccount
  name: pytrading-sa
  namespace: pytrading
roleRef:
  kind: Role
  name: pytrading-role
  apiGroup: rbac.authorization.k8s.io
```

## 故障排查

### 1. 常用命令

```bash
# 查看Pod状态
kubectl get pods -n pytrading

# 查看Pod日志
kubectl logs -f deployment/pytrading-backend -n pytrading

# 进入Pod调试
kubectl exec -it deployment/pytrading-backend -n pytrading -- /bin/bash

# 查看资源使用
kubectl top pods -n pytrading

# 查看事件
kubectl get events -n pytrading --sort-by='.lastTimestamp'

# 查看节点状态
kubectl get nodes -o wide

# 查看服务状态
kubectl get svc -n pytrading
```

### 2. 故障排查清单

#### Pod无法启动
1. 检查镜像是否存在
2. 检查镜像拉取策略
3. 查看Pod事件：`kubectl describe pod <pod-name>`
4. 查看容器日志：`kubectl logs <pod-name>`

#### 服务无法访问
1. 检查Service配置
2. 检查端点：`kubectl get endpoints -n pytrading`
3. 检查网络策略
4. 检查防火墙规则

#### 数据库连接失败
1. 检查数据库Pod状态
2. 检查连接字符串
3. 检查网络连通性
4. 查看数据库日志

#### 内存不足
1. 查看资源限制
2. 检查内存使用：`kubectl top pods`
3. 分析内存泄漏
4. 调整资源配额

## 总结

xTrading系统的运维体系具备以下特点：

1. **自动化程度高**：CI/CD自动化部署、自动化监控告警
2. **可靠性强**：多副本部署、自动故障恢复、数据备份
3. **可扩展性好**：支持水平扩展、垂直扩展
4. **安全性高**：网络隔离、RBAC控制、加密传输
5. **运维友好**：完善的监控、日志、告警体系

通过规范的运维流程和自动化工具，确保了系统的高可用性和稳定性。
