#!/bin/bash
# xTrading目录结构设置脚本
# 使用方法: bash scripts/setup-directory-structure.sh

echo "🚀 开始设置xTrading项目目录结构..."

# 创建基础目录
echo "📁 创建基础目录结构..."
mkdir -p services/{api-gateway,user-service,strategy-service,backtest-service,trading-service,data-service,notification-service}

# 为每个服务创建标准结构
for service in api-gateway user-service strategy-service backtest-service trading-service data-service notification-service; do
    echo "🔧 创建服务: $service"
    mkdir -p services/$service/src/{api,models,schemas,services,repositories}
    mkdir -p services/$service/tests
    mkdir -p services/$service/strategies/{base,trend,mean-reversion,momentum,custom}
done

# 创建前端目录
echo "🎨 创建前端目录结构..."
mkdir -p frontend/{web-app,desktop-app,mobile-app}

# Web应用结构
mkdir -p frontend/web-app/src/{components/{ui,charts,forms,layout},pages/{dashboard,backtest,strategy,trading,portfolio,reports},hooks,store,services,utils,types,constants,styles}
mkdir -p frontend/web-app/{public,tests}
mkdir -p frontend/web-app/src/components/{ui,charts,forms,layout}

# 桌面应用结构
mkdir -p frontend/desktop-app/{src/{components,pages},src-tauri/src/{commands,services,utils},static}
mkdir -p frontend/desktop-app/src/{components,pages}

# 移动应用结构
mkdir -p frontend/mobile-app/src/{components,screens,navigation,services,store,utils}

# 创建共享代码目录
echo "🔗 创建共享代码目录..."
mkdir -p shared/{types/{api,models,events},utils/{validation,formatting,calculation,constants},middlewares,validators}

# 创建基础设施目录
echo "🏗️ 创建基础设施目录..."
mkdir -p infrastructure/{docker/{development,testing,production,scripts},kubernetes/{base,services,ingress,monitoring,helm/pytrading},terraform/{modules/{database,compute,network,storage},environments/{development,staging,production}},monitoring/{prometheus/{rules,targets},grafana/{dashboards,datasources},alertmanager}}

# 创建测试目录
echo "🧪 创建测试目录..."
mkdir -p tests/{unit,integration,e2e,performance,fixtures/{sample-data,mock-data}}

# 为每个服务创建测试目录
for service in api-gateway user-service strategy-service backtest-service trading-service data-service notification-service; do
    mkdir -p tests/unit/$service
done

# 创建脚本目录
echo "📜 创建脚本目录..."
mkdir -p scripts/{setup,deployment,maintenance,testing,utilities}

# 创建文档目录
echo "📚 创建文档目录..."
mkdir -p docs/{architecture,api/endpoints,development,user-guide,dev-setup}

# 创建配置目录
echo "⚙️ 创建配置目录..."
mkdir -p config/{development,staging,production,templates}

# 创建数据目录
echo "💾 创建数据目录..."
mkdir -p data/{samples/{market-data,strategy-configs,user-data},migrations/{database,seed-data},exports/{reports,backups}}

# 创建开发工具目录
echo "🛠️ 创建开发工具目录..."
mkdir -p tools/{generators/{service-template,api-client,types},linters,formatters}

# 创建必要的文件
echo "📝 创建基础配置文件..."

# Python项目配置
cat > pyproject.toml << 'EOF'
[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "pytrading"
version = "2.0.0"
description = "xTrading量化交易系统"
authors = [{name = "xTrading Team", email = "team@xtrading.com"}]
readme = "README.md"
requires-python = ">=3.9"
classifiers = [
    "Development Status :: 4 - Beta",
    "Intended Audience :: Financial and Insurance Industry",
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
]
dependencies = [
    "fastapi>=0.104.0",
    "uvicorn[standard]>=0.24.0",
    "sqlalchemy>=2.0.0",
    "alembic>=1.13.0",
    "pydantic>=2.0.0",
    "redis>=5.0.0",
    "celery>=5.3.0",
    "python-multipart>=0.0.6",
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",
    "pytest>=7.4.0",
    "pytest-asyncio>=0.21.0",
    "httpx>=0.25.0",
]

[project.optional-dependencies]
dev = [
    "black>=23.0.0",
    "isort>=5.12.0",
    "flake8>=6.0.0",
    "mypy>=1.7.0",
    "pre-commit>=3.5.0",
    "pytest-cov>=4.1.0",
    "factory-boy>=3.3.0",
]
docs = [
    "mkdocs>=1.5.0",
    "mkdocs-material>=9.0.0",
    "mkdocs-mermaid2-plugin>=1.1.0",
]

[tool.black]
line-length = 88
target-version = ['py39']
include = '\.pyi?$'
extend-exclude = '''
/(
  # directories
  \.eggs
  | \.git
  | \.hg
  | \.mypy_cache
  | \.tox
  | \.venv
  | build
  | dist
)/
'''

[tool.isort]
profile = "black"
multi_line_output = 3
line_length = 88
known_first_party = ["pytrading"]

[tool.mypy]
python_version = "3.9"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
disallow_incomplete_defs = true
check_untyped_defs = true
disallow_untyped_decorators = true
no_implicit_optional = true
warn_redundant_casts = true
warn_unused_ignores = true
warn_no_return = true
warn_unreachable = true
strict_equality = true

[tool.pytest.ini_options]
minversion = "6.0"
addopts = "-ra -q --strict-markers --strict-config"
testpaths = [
    "tests",
]
markers = [
    "slow: marks tests as slow (deselect with '-m \"not slow\"')",
    "integration: marks tests as integration tests",
    "unit: marks tests as unit tests",
]
filterwarnings = [
    "error",
    "ignore::UserWarning",
    "ignore::DeprecationWarning",
]

[tool.coverage.run]
source = ["src"]
omit = [
    "*/tests/*",
    "*/venv/*",
    "*/.venv/*",
    "*/migrations/*",
]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "if self.debug:",
    "if settings.DEBUG",
    "raise AssertionError",
    "raise NotImplementedError",
    "if 0:",
    "if __name__ == .__main__.:",
    "class .*\\bProtocol\\):",
    "@(abc\\.)?abstractmethod",
]
EOF

# 创建requirements.txt
cat > requirements.txt << 'EOF'
# Core dependencies
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
sqlalchemy>=2.0.0
alembic>=1.13.0
pydantic>=2.0.0
pydantic-settings>=2.0.0

# Database
psycopg2-binary>=2.9.0  # PostgreSQL
pymysql>=1.1.0         # MySQL

# Cache & Queue
redis>=5.0.0
celery>=5.3.0
kombu>=5.3.0

# Authentication & Security
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-multipart>=0.0.6

# Data Processing
pandas>=2.1.0
numpy>=1.24.0
scipy>=1.11.0
scikit-learn>=1.3.0

# Technical Analysis
TA-Lib>=0.4.25
pandas-ta>=0.3.14b

# HTTP Client
httpx>=0.25.0
aiohttp>=3.9.0
websockets>=12.0

# Logging & Monitoring
structlog>=23.0.0
prometheus-client>=0.19.0

# Utilities
python-dotenv>=1.0.0
typer>=0.9.0
rich>=13.0.0
click>=8.1.0

# Date & Time
arrow>=1.3.0
dateutils>=0.6.12

# Development dependencies
pytest>=7.4.0
pytest-asyncio>=0.21.0
pytest-cov>=4.1.0
pytest-mock>=3.11.0
factory-boy>=3.3.0
black>=23.0.0
isort>=5.12.0
flake8>=6.0.0
mypy>=1.7.0
pre-commit>=3.5.0
EOF

# 创建Makefile
cat > Makefile << 'EOF'
.PHONY: help install-dev install test test-unit test-integration test-e2e lint format clean build docker-build docker-run

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	pip install -r requirements.txt
	pre-commit install

install-dev: ## Install development dependencies
	pip install -r requirements.txt
	pip install -e ".[dev]"
	pre-commit install

test: ## Run all tests
	pytest

test-unit: ## Run unit tests
	pytest tests/unit -v

test-integration: ## Run integration tests
	pytest tests/integration -v

test-e2e: ## Run end-to-end tests
	pytest tests/e2e -v

test-coverage: ## Run tests with coverage
	pytest --cov=src --cov-report=html --cov-report=term

lint: ## Run linting
	flake8 .
	mypy src
	black --check .
	isort --check-only .

format: ## Format code
	black .
	isort .
	autoflake --remove-all-unused-imports --recursive --in-place .

clean: ## Clean up
	rm -rf build/
	rm -rf dist/
	rm -rf *.egg-info/
	rm -rf .pytest_cache/
	rm -rf .coverage
	rm -rf htmlcov/
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

build: clean ## Build package
	python -m build

docker-build: ## Build Docker images
	docker-compose build

docker-run: ## Run with Docker Compose
	docker-compose up -d

docker-stop: ## Stop Docker containers
	docker-compose down

db-migrate: ## Run database migrations
	alembic upgrade head

db-reset: ## Reset database
	alembic downgrade base
	alembic upgrade head

# Service-specific commands
service-strategy: ## Start strategy service
	cd services/strategy-service && uvicorn src.api.main:app --reload --port 8001

service-backtest: ## Start backtest service
	cd services/backtest-service && uvicorn src.api.main:app --reload --port 8002

service-trading: ## Start trading service
	cd services/trading-service && uvicorn src.api.main:app --reload --port 8003

all-services: ## Start all services
	cd services/api-gateway && uvicorn src.main:app --reload --port 8000 &
	cd services/user-service && uvicorn src.main:app --reload --port 8001 &
	cd services/strategy-service && uvicorn src.main:app --reload --port 8002 &
	cd services/backtest-service && uvicorn src.main:app --reload --port 8003 &
	cd services/trading-service && uvicorn src.main:app --reload --port 8004 &

frontend-dev: ## Start frontend development server
	cd frontend/web-app && npm run dev

desktop-dev: ## Start desktop app in development mode
	cd frontend/desktop-app && npm run tauri dev

# Deployment
deploy-staging: ## Deploy to staging
	./scripts/deployment/deploy-staging.sh

deploy-production: ## Deploy to production
	./scripts/deployment/deploy-production.sh

# Monitoring
logs: ## View application logs
	docker-compose logs -f

status: ## Check service status
	docker-compose ps

health: ## Check service health
	curl -f http://localhost:8000/health || echo "Service unhealthy"
EOF

# 创建基础Docker配置
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Database
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: pytrading
      POSTGRES_USER: pytrading
      POSTGRES_PASSWORD: pytrading
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pytrading"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # RabbitMQ
  rabbitmq:
    image: rabbitmq:3-management-alpine
    environment:
      RABBITMQ_DEFAULT_USER: pytrading
      RABBITMQ_DEFAULT_PASS: pytrading
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

  # API Gateway
  api-gateway:
    build:
      context: ./services/api-gateway
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      - DATABASE_URL=postgresql://pytrading:pytrading@postgres:5432/pytrading
      - REDIS_URL=redis://redis:6379/0
    volumes:
      - ./logs:/app/logs

  # Strategy Service
  strategy-service:
    build:
      context: ./services/strategy-service
      dockerfile: Dockerfile
    ports:
      - "8001:8001"
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      - DATABASE_URL=postgresql://pytrading:pytrading@postgres:5432/pytrading
    volumes:
      - ./logs:/app/logs

  # Backtest Service
  backtest-service:
    build:
      context: ./services/backtest-service
      dockerfile: Dockerfile
    ports:
      - "8002:8002"
    depends_on:
      postgres:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    environment:
      - DATABASE_URL=postgresql://pytrading:pytrading@postgres:5432/pytrading
      - RABBITMQ_URL=amqp://pytrading:pytrading@rabbitmq:5672/
    volumes:
      - ./logs:/app/logs

  # Web Frontend
  web-app:
    build:
      context: ./frontend/web-app
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    depends_on:
      - api-gateway

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
EOF

echo "✅ 目录结构设置完成！"
echo ""
echo "📋 接下来的步骤："
echo "1. 运行 'make install-dev' 安装开发依赖"
echo "2. 运行 'make docker-run' 启动开发环境"
echo "3. 查看 'docs/dev-setup/' 目录了解详细配置"
echo ""
echo "🎉 享受开发吧！"
