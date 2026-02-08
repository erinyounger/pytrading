# 微服务架构设计

## 概述

本文档详细介绍了xTrading系统的微服务架构设计，包括服务拆分、通信机制、数据管理和治理策略。

## 微服务划分

### 1. 用户管理服务 (User Service)

**职责**：用户认证、授权、权限管理

**核心功能**：
- 用户登录/登出
- JWT令牌管理
- 角色权限控制
- 用户信息管理

**技术栈**：
- FastAPI + SQLAlchemy
- PostgreSQL
- Redis (缓存)
- JWT认证

**API接口**：
```
POST /api/v1/auth/login          # 用户登录
POST /api/v1/auth/logout         # 用户登出
POST /api/v1/auth/refresh        # 刷新令牌
GET  /api/v1/users/profile        # 获取用户信息
PUT  /api/v1/users/profile        # 更新用户信息
GET  /api/v1/users/permissions    # 获取用户权限
```

### 2. 策略管理服务 (Strategy Service)

**职责**：策略生命周期管理

**核心功能**：
- 策略CRUD操作
- 策略参数配置
- 策略代码管理
- 策略性能统计

**技术栈**：
- FastAPI + SQLAlchemy
- PostgreSQL
- Git版本控制
- 沙箱执行环境

**API接口**：
```
GET    /api/v1/strategies         # 获取策略列表
POST   /api/v1/strategies         # 创建策略
GET    /api/v1/strategies/{id}    # 获取策略详情
PUT    /api/v1/strategies/{id}    # 更新策略
DELETE /api/v1/strategies/{id}    # 删除策略
POST   /api/v1/strategies/{id}/test # 测试策略
```

### 3. 回测服务 (Backtest Service)

**职责**：回测任务执行和管理

**核心功能**：
- 回测任务调度
- 批量回测支持
- 进度实时追踪
- 结果存储和查询

**技术栈**：
- FastAPI + Celery
- PostgreSQL
- Redis (任务队列)
- RabbitMQ (消息队列)

**API接口**：
```
POST   /api/v1/backtests          # 创建回测任务
GET    /api/v1/backtests/{id}     # 获取回测状态
GET    /api/v1/backtests          # 获取回测列表
DELETE /api/v1/backtests/{id}     # 取消回测任务
GET    /api/v1/backtests/{id}/results # 获取回测结果
```

### 4. 交易服务 (Trading Service)

**职责**：模拟/实盘交易执行

**核心功能**：
- 交易信号处理
- 订单生成和管理
- 持仓管理
- 交易记录

**技术栈**：
- FastAPI
- PostgreSQL
- Redis (实时数据)
- WebSocket (实时推送)

**API接口**：
```
GET  /api/v1/trading/signals       # 获取交易信号
POST /api/v1/trading/orders        # 创建订单
GET  /api/v1/trading/orders       # 获取订单列表
GET  /api/v1/trading/positions     # 获取持仓信息
GET  /api/v1/trading/performance  # 获取交易绩效
```

### 5. 数据服务 (Data Service)

**职责**：数据采集、存储、分发

**核心功能**：
- 行情数据采集
- 历史数据存储
- 实时数据推送
- 数据质量监控

**技术栈**：
- FastAPI
- InfluxDB (时序数据)
- PostgreSQL (元数据)
- Kafka (数据流)

**API接口**：
```
GET  /api/v1/data/market/{symbol}    # 获取市场数据
GET  /api/v1/data/history/{symbol}   # 获取历史数据
GET  /api/v1/data/real-time/{symbol} # 获取实时数据
POST /api/v1/data/batch-import       # 批量导入数据
```

### 6. 通知服务 (Notification Service)

**职责**：消息推送和通知

**核心功能**：
- WebSocket推送
- 邮件/短信通知
- 系统消息管理
- 通知模板配置

**技术栈**：
- FastAPI + WebSocket
- Redis (订阅发布)
- SMTP (邮件)
- 短信网关

**API接口**：
```
GET  /api/v1/notifications          # 获取通知列表
POST /api/v1/notifications/mark-read # 标记已读
POST /api/v1/notifications/send     # 发送通知
WebSocket /api/v1/notifications/ws  # WebSocket连接
```

## 服务间通信

### 1. 同步通信

**HTTP/REST API**

```python
# 示例：用户服务调用策略服务
from httpx import AsyncClient

async def get_user_strategies(user_id: str):
    async with AsyncClient() as client:
        response = await client.get(
            f"http://strategy-service:8001/api/v1/strategies",
            headers={"X-User-ID": user_id}
        )
        return response.json()
```

**gRPC (可选)**

```protobuf
// strategy_service.proto
service StrategyService {
  rpc GetUserStrategies (GetUserStrategiesRequest) returns (StrategyList);
  rpc CreateStrategy (CreateStrategyRequest) returns (Strategy);
}

message GetUserStrategiesRequest {
  string user_id = 1;
  int32 page = 2;
  int32 size = 3;
}
```

### 2. 异步通信

**RabbitMQ消息队列**

```python
# 发布事件
import aio_pika

async def publish_backtest_completed(task_id: str, result: dict):
    connection = await aio_pika.connect_robust("amqp://guest:guest@rabbitmq/")
    channel = await connection.channel()

    await channel.default_exchange.publish(
        aio_pika.Message(
            json.dumps(result),
            headers={"task_id": task_id, "event_type": "backtest.completed"}
        ),
        routing_key="backtest.events"
    )

# 订阅事件
async def consume_backtest_events():
    connection = await aio_pika.connect_robust("amqp://guest:guest@rabbitmq/")
    channel = await connection.channel()

    queue = await channel.declare_queue("notification.service", durable=True)

    async with queue.iterator() as queue_iter:
        async for message in queue_iter:
            async with message.process():
                event_data = json.loads(message.body)
                await handle_backtest_completed(event_data)
```

**Redis Pub/Sub**

```python
# 发布实时数据
import redis.asyncio as redis

async def publish_market_update(symbol: str, data: dict):
    redis_client = redis.from_url("redis://redis:6379")
    await redis_client.publish(
        f"market:{symbol}",
        json.dumps(data)
    )

# 订阅实时数据
async def subscribe_market_updates(symbol: str):
    redis_client = redis.from_url("redis://redis:6379")
    pubsub = redis_client.pubsub()
    await pubsub.subscribe(f"market:{symbol}")

    async for message in pubsub.listen():
        if message['type'] == 'message':
            data = json.loads(message['data'])
            yield data
```

### 3. 事件驱动架构

**事件定义**

```python
from enum import Enum
from dataclasses import dataclass
from typing import Any, Dict
from datetime import datetime

class EventType(Enum):
    BACKTEST_STARTED = "backtest.started"
    BACKTEST_COMPLETED = "backtest.completed"
    BACKTEST_FAILED = "backtest.failed"
    TRADE_EXECUTED = "trade.executed"
    STRATEGY_CREATED = "strategy.created"

@dataclass
class DomainEvent:
    event_type: EventType
    aggregate_id: str
    event_data: Dict[str, Any]
    timestamp: datetime
    version: int = 1
```

**事件总线**

```python
class EventBus:
    def __init__(self):
        self._handlers: Dict[EventType, List[Callable]] = {}

    def subscribe(self, event_type: EventType, handler: Callable):
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)

    async def publish(self, event: DomainEvent):
        if event.event_type in self._handlers:
            for handler in self._handlers[event.event_type]:
                await handler(event)

# 使用示例
event_bus = EventBus()

# 订阅事件
@event_bus.subscribe(EventType.BACKTEST_COMPLETED)
async def handle_backtest_completed(event: DomainEvent):
    # 发送通知
    await notification_service.send_backtest_completed(
        event.aggregate_id,
        event.event_data
    )

    # 更新用户统计
    await user_service.update_user_statistics(
        event.event_data['user_id']
    )

    # 生成报告
    await report_service.generate_performance_report(
        event.aggregate_id
    )

# 发布事件
await event_bus.publish(DomainEvent(
    event_type=EventType.BACKTEST_COMPLETED,
    aggregate_id=task_id,
    event_data=result_data,
    timestamp=datetime.utcnow()
))
```

## 数据管理

### 1. 数据库设计

**每个服务拥有独立数据库**

```sql
-- 用户服务数据库
CREATE DATABASE user_service;
USE user_service;

CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 策略服务数据库
CREATE DATABASE strategy_service;
USE strategy_service;

CREATE TABLE strategies (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    code TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. 数据一致性

**Saga模式处理分布式事务**

```python
class BacktestSaga:
    def __init__(self, task_id: str):
        self.task_id = task_id
        self.steps = [
            self.create_task_record,
            self.allocate_resources,
            self.execute_backtest,
            self.store_results,
            self.send_notification
        ]
        self.compensation_steps = [
            self.cleanup_resources,
            self.delete_task_record,
            self.send_failure_notification
        ]

    async def execute(self):
        try:
            for step in self.steps:
                await step()
        except Exception as e:
            await self.compensate()
            raise e

    async def create_task_record(self):
        # 创建回测任务记录
        await backtest_repo.create(self.task_id, self.config)

    async def allocate_resources(self):
        # 分配计算资源
        await resource_manager.allocate(self.task_id)

    async def execute_backtest(self):
        # 执行回测
        result = await backtest_engine.run(self.task_id)
        self.result = result

    async def store_results(self):
        # 存储结果
        await result_repo.save(self.task_id, self.result)

    async def send_notification(self):
        # 发送通知
        await notification_service.send_completed(self.task_id)

    async def compensate(self):
        # 补偿操作
        for step in reversed(self.compensation_steps):
            await step()
```

### 3. 数据同步

**事件溯源**

```python
class EventStore:
    def __init__(self, connection):
        self.connection = connection

    async def save_events(self, aggregate_id: str, events: List[DomainEvent]):
        for event in events:
            await self.connection.execute(
                """
                INSERT INTO events (aggregate_id, event_type, event_data, version)
                VALUES ($1, $2, $3, $4)
                """,
                aggregate_id,
                event.event_type.value,
                json.dumps(event.event_data),
                event.version
            )

    async def get_events(self, aggregate_id: str, from_version: int = 0):
        rows = await self.connection.fetch(
            """
            SELECT aggregate_id, event_type, event_data, version, timestamp
            FROM events
            WHERE aggregate_id = $1 AND version > $2
            ORDER BY version
            """,
            aggregate_id,
            from_version
        )
        return [self._row_to_event(row) for row in rows]
```

## 服务治理

### 1. 服务发现

**Consul + Docker Compose**

```yaml
# docker-compose.yml
version: '3.8'
services:
  consul:
    image: consul:1.15
    ports:
      - "8500:8500"
    command: consul agent -dev -client=0.0.0.0

  strategy-service:
    image: strategy-service:latest
    ports:
      - "8001:8001"
    environment:
      - CONSUL_ADDR=consul:8500
    depends_on:
      - consul
    labels:
      - "consul.service=strategy-service"
      - "consul.port=8001"
```

### 2. 配置管理

**Spring Cloud Config (替代方案：Consul KV)**

```python
# config_service.py
import consul

class ConfigService:
    def __init__(self, consul_host: str = "consul", consul_port: int = 8500):
        self.consul = consul.Consul(host=consul_host, port=consul_port)

    def get_config(self, service_name: str, key: str = None):
        if key:
            index, data = self.consul.kv.get(f"config/{service_name}/{key}")
        else:
            index, data = self.consul.kv.get(f"config/{service_name}")
        return data['Value'] if data else None

# 使用示例
config_service = ConfigService()
strategy_config = config_service.get_config("strategy-service", "database")
```

### 3. 熔断器

**Resilience4j (Python实现)**

```python
from functools import wraps
import asyncio
import time

class CircuitBreaker:
    def __init__(self, failure_threshold=5, recovery_timeout=60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = 'CLOSED'  # CLOSED, OPEN, HALF_OPEN

    def __call__(self, func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if self.state == 'OPEN':
                if time.time() - self.last_failure_time >= self.recovery_timeout:
                    self.state = 'HALF_OPEN'
                else:
                    raise CircuitBreakerOpenException("Circuit breaker is OPEN")

            try:
                result = await func(*args, **kwargs)
                if self.state == 'HALF_OPEN':
                    self.state = 'CLOSED'
                    self.failure_count = 0
                return result
            except Exception as e:
                self.failure_count += 1
                self.last_failure_time = time.time()

                if self.failure_count >= self.failure_threshold:
                    self.state = 'OPEN'

                raise e

        return wrapper

# 使用示例
circuit_breaker = CircuitBreaker()

@circuit_breaker
async def call_external_service():
    # 可能失败的服务调用
    pass
```

### 4. 负载均衡

**Nginx + Kong**

```yaml
# kong.yml
_format_version: "1.1"

services:
  - name: strategy-service
    url: http://strategy-service:8001
    routes:
      - name: strategy-route
        paths:
          - /api/v1/strategies
    plugins:
      - name: rate-limiting
        config:
          minute: 100
      - name: jwt
        config:
          secret_is_base64: false

consumers:
  - username: demo
    jwt_secrets:
      - key: demo-key
        secret: demo-secret
```

## 服务监控

### 1. 健康检查

```python
# health_check.py
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class HealthStatus(BaseModel):
    status: str
    timestamp: datetime
    services: Dict[str, str]

@app.get("/health")
async def health_check():
    services_status = {}

    # 检查数据库
    try:
        await db.execute("SELECT 1")
        services_status["database"] = "healthy"
    except Exception:
        services_status["database"] = "unhealthy"

    # 检查Redis
    try:
        await redis.ping()
        services_status["redis"] = "healthy"
    except Exception:
        services_status["redis"] = "unhealthy"

    # 检查外部服务
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://external-service:8000/health")
            services_status["external-service"] = "healthy" if response.status_code == 200 else "unhealthy"
    except Exception:
        services_status["external-service"] = "unhealthy"

    overall_status = "healthy" if all(status == "healthy" for status in services_status.values()) else "unhealthy"

    return HealthStatus(
        status=overall_status,
        timestamp=datetime.utcnow(),
        services=services_status
    )
```

### 2. 指标收集

```python
# metrics.py
from prometheus_client import Counter, Histogram, Gauge, start_http_server

# 定义指标
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration'
)

ACTIVE_CONNECTIONS = Gauge(
    'websocket_connections_active',
    'Active WebSocket connections'
)

# 启动指标服务器
start_http_server(8000)

# 中间件记录指标
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()

    response = await call_next(request)

    duration = time.time() - start_time

    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()

    REQUEST_DURATION.observe(duration)

    return response
```

### 3. 分布式追踪

```python
# tracing.py
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

# 配置追踪
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

jaeger_exporter = JaegerExporter(
    agent_host_name="jaeger",
    agent_port=6831,
)

span_processor = BatchSpanProcessor(jaeger_exporter)
trace.get_tracer_provider().add_span_processor(span_processor)

# 在函数中使用追踪
async def execute_backtest(task_id: str):
    with tracer.start_as_current_span("execute_backtest") as span:
        span.set_attribute("task_id", task_id)

        with tracer.start_as_current_span("prepare_data"):
            await prepare_data(task_id)

        with tracer.start_as_current_span("run_strategy"):
            result = await run_strategy(task_id)

        span.set_attribute("result_count", len(result))
        return result
```

## 总结

微服务架构为xTrading系统带来了以下优势：

1. **独立部署**：每个服务可以独立部署和扩展
2. **技术多样性**：不同服务可以使用不同技术栈
3. **故障隔离**：一个服务故障不影响其他服务
4. **团队协作**：不同团队可以独立开发不同服务
5. **渐进式重构**：可以逐步重构遗留系统

同时，也需要注意以下挑战：

1. **复杂性增加**：需要管理多个服务和依赖
2. **网络延迟**：服务间调用增加网络开销
3. **数据一致性**：分布式事务处理复杂
4. **调试困难**：跨服务调试难度增加
5. **运维成本**：需要更完善的监控和运维体系

通过合理的设计和最佳实践，可以最大化微服务架构的优势，最小化其带来的挑战。
