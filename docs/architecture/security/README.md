# 安全架构设计

## 概述

xTrading系统采用多层次安全防护体系，从身份认证、权限控制、数据安全、网络安全等多个维度确保系统安全。

## 安全设计原则

### 1. 纵深防御
- 多层安全防护
- 冗余安全控制
- 安全边界清晰

### 2. 最小权限
- 最小权限原则
- 职责分离
- 权限最小化

### 3. 默认安全
- 安全默认配置
- 最小攻击面
- 安全开发生命周期

### 4. 数据保护
- 加密存储
- 传输加密
- 数据脱敏

## 身份认证与授权

### 1. JWT认证机制

#### 访问令牌和刷新令牌
```python
# JWT服务
class JWTService:
    def __init__(self, secret_key: str, algorithm: str = "HS256"):
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.access_token_expire_minutes = 30
        self.refresh_token_expire_days = 30

    def create_access_token(self, data: dict) -> str:
        """创建访问令牌"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        to_encode.update({"exp": expire, "type": "access"})
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)

    def create_refresh_token(self, user_id: str) -> str:
        """创建刷新令牌"""
        to_encode = {
            "sub": user_id,
            "type": "refresh",
            "exp": datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
        }
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)

    def verify_token(self, token: str) -> Optional[dict]:
        """验证令牌"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except JWTError:
            return None
```

#### FastAPI依赖注入
```python
# 认证依赖
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    jwt_service: JWTService = Depends(get_jwt_service)
) -> User:
    """获取当前用户"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = jwt_service.verify_token(token)
    if payload is None or payload.get("type") != "access":
        raise credentials_exception

    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = await UserRepository.get_by_id(user_id)
    if user is None:
        raise credentials_exception

    return user

# 使用示例
@app.get("/api/v1/strategies")
async def get_strategies(
    current_user: User = Depends(get_current_user),
    strategy_service: StrategyService = Depends()
):
    return await strategy_service.get_user_strategies(current_user.id)
```

### 2. RBAC权限控制

#### 权限定义
```python
from enum import Enum
from typing import Set, List

class Permission(Enum):
    # 用户管理
    USER_CREATE = "user:create"
    USER_READ = "user:read"
    USER_UPDATE = "user:update"
    USER_DELETE = "user:delete"

    # 策略管理
    STRATEGY_CREATE = "strategy:create"
    STRATEGY_READ = "strategy:read"
    STRATEGY_UPDATE = "strategy:update"
    STRATEGY_DELETE = "strategy:delete"
    STRATEGY_EXECUTE = "strategy:execute"

    # 回测管理
    BACKTEST_CREATE = "backtest:create"
    BACKTEST_READ = "backtest:read"
    BACKTEST_UPDATE = "backtest:update"
    BACKTEST_DELETE = "backtest:delete"
    BACKTEST_EXECUTE = "backtest:execute"

    # 交易操作
    TRADE_EXECUTE = "trade:execute"
    TRADE_READ = "trade:read"

class Role(Enum):
    ADMIN = "admin"
    QUANT_TRADER = "quant_trader"
    TRADER = "trader"
    VIEWER = "viewer"

# 角色权限映射
ROLE_PERMISSIONS = {
    Role.ADMIN: {
        *Permission.USER_CREATE,
        *Permission.USER_READ,
        *Permission.USER_UPDATE,
        *Permission.USER_DELETE,
        *Permission.STRATEGY_CREATE,
        *Permission.STRATEGY_READ,
        *Permission.STRATEGY_UPDATE,
        *Permission.STRATEGY_DELETE,
        *Permission.STRATEGY_EXECUTE,
        *Permission.BACKTEST_CREATE,
        *Permission.BACKTEST_READ,
        *Permission.BACKTEST_UPDATE,
        *Permission.BACKTEST_DELETE,
        *Permission.BACKTEST_EXECUTE,
        *Permission.TRADE_EXECUTE,
        *Permission.TRADE_READ,
    },
    Role.QUANT_TRADER: {
        Permission.STRATEGY_CREATE,
        Permission.STRATEGY_READ,
        Permission.STRATEGY_UPDATE,
        Permission.STRATEGY_DELETE,
        Permission.STRATEGY_EXECUTE,
        Permission.BACKTEST_CREATE,
        Permission.BACKTEST_READ,
        Permission.BACKTEST_UPDATE,
        Permission.BACKTEST_DELETE,
        Permission.BACKTEST_EXECUTE,
        Permission.TRADE_EXECUTE,
        Permission.TRADE_READ,
    },
    Role.TRADER: {
        Permission.STRATEGY_READ,
        Permission.STRATEGY_EXECUTE,
        Permission.BACKTEST_CREATE,
        Permission.BACKTEST_READ,
        Permission.BACKTEST_EXECUTE,
        Permission.TRADE_EXECUTE,
        Permission.TRADE_READ,
    },
    Role.VIEWER: {
        Permission.STRATEGY_READ,
        Permission.BACKTEST_READ,
        Permission.TRADE_READ,
    },
}
```

#### 权限检查装饰器
```python
# 权限检查器
def require_permission(permission: Permission):
    """权限检查装饰器"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 获取当前用户
            current_user = kwargs.get('current_user')
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )

            # 检查权限
            user_permissions = ROLE_PERMISSIONS.get(Role(current_user.role), set())

            if permission not in user_permissions:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission denied: {permission.value}"
                )

            return await func(*args, **kwargs)

        return wrapper
    return decorator

# 使用示例
@app.post("/api/v1/strategies")
@require_permission(Permission.STRATEGY_CREATE)
async def create_strategy(
    strategy_data: StrategyCreate,
    current_user: User = Depends(get_current_user),
    strategy_service: StrategyService = Depends()
):
    return await strategy_service.create_strategy(strategy_data, current_user.id)
```

### 3. API密钥管理

#### API密钥生成和验证
```python
# API密钥管理
class APIKeyService:
    def __init__(self):
        self.prefix = "xt"  # xTrading前缀
        self.key_length = 32  # 密钥长度

    def generate_api_key(self, user_id: str, permissions: List[Permission]) -> str:
        """生成API密钥"""
        # 生成随机密钥
        random_key = secrets.token_urlsafe(self.key_length)
        # 添加用户信息和权限
        payload = {
            "user_id": user_id,
            "permissions": [p.value for p in permissions],
            "created_at": datetime.utcnow().isoformat()
        }
        # 编码负载
        payload_bytes = json.dumps(payload).encode()
        payload_b64 = base64.b64encode(payload_bytes).decode()
        # 组合完整密钥
        api_key = f"{self.prefix}_{random_key}.{payload_b64}"
        # 计算校验和
        checksum = self._calculate_checksum(api_key)
        return f"{api_key}.{checksum}"

    def verify_api_key(self, api_key: str) -> Optional[dict]:
        """验证API密钥"""
        try:
            # 分离密钥和校验和
            parts = api_key.rsplit('.', 1)
            if len(parts) != 2:
                return None

            key_part, checksum = parts

            # 验证校验和
            if self._calculate_checksum(key_part) != checksum:
                return None

            # 解析负载
            key_part, payload_b64 = key_part.split('.', 1)
            payload_bytes = base64.b64decode(payload_b64.encode())
            payload = json.loads(payload_bytes.decode())

            # 检查密钥格式
            if not key_part.startswith(f"{self.prefix}_"):
                return None

            return payload

        except Exception:
            return None

    def _calculate_checksum(self, data: str) -> str:
        """计算校验和"""
        return hashlib.sha256(data.encode()).hexdigest()[:8]

# API密钥认证
async def get_current_api_user(
    api_key: str = Depends(get_api_key_from_header),
    api_key_service: APIKeyService = Depends(get_api_key_service)
) -> User:
    """获取API用户"""
    payload = api_key_service.verify_api_key(api_key)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )

    user_id = payload["user_id"]
    user = await UserRepository.get_by_id(user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    return user
```

## 数据安全

### 1. 数据加密

#### 静态数据加密
```python
# 加密服务
class EncryptionService:
    def __init__(self, key: bytes):
        self.cipher = Fernet(key)

    def encrypt(self, data: str) -> str:
        """加密数据"""
        if data is None:
            return None
        return self.cipher.encrypt(data.encode()).decode()

    def decrypt(self, encrypted_data: str) -> str:
        """解密数据"""
        if encrypted_data is None:
            return None
        return self.cipher.decrypt(encrypted_data.encode()).decode()

    def hash_password(self, password: str) -> str:
        """哈希密码"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode(), salt).decode()

    def verify_password(self, password: str, hashed: str) -> bool:
        """验证密码"""
        return bcrypt.checkpw(password.encode(), hashed.encode())

# SQLAlchemy加密字段
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.ext.mutable import Mutable

class EncryptedField(Mutable):
    """加密字段"""
    def __init__(self, encryption_service: EncryptionService):
        self.encryption_service = encryption_service

    def __get__(self, obj, objtype=None):
        if obj is None:
            return None
        value = obj._encrypted_data
        if value:
            return self.encryption_service.decrypt(value)
        return None

    def __set__(self, obj, value):
        if value:
            obj._encrypted_data = self.encryption_service.encrypt(value)
        else:
            obj._encrypted_data = None
        self.changed()

class User(Base):
    __tablename__ = 'users'

    id = Column(UUID, primary_key=True)
    _email = Column("email", String(255), unique=True)  # 加密存储
    email = EncryptedField(encryption_service)

    def __init__(self, email: str, **kwargs):
        self.email = email  # 使用加密属性
        super().__init__(**kwargs)
```

#### 传输数据加密
```python
# HTTPS强制
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

app.add_middleware(HTTPSRedirectMiddleware)

# TLS配置
import ssl
ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ssl_context.load_cert_chain('path/to/cert.pem', 'path/to/key.pem')

# WebSocket加密
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # 强制加密连接
    if websocket.headers.get("upgrade") != "websocket":
        await websocket.close(code=1008)
        return

    await websocket.accept()
    # 检查认证令牌
    token = websocket.headers.get("Authorization", "").replace("Bearer ", "")
    if not validate_token(token):
        await websocket.close(code=1008)
        return

    # 处理WebSocket消息
```

### 2. 敏感数据处理

#### 数据脱敏
```python
# 数据脱敏服务
class DataMaskingService:
    @staticmethod
    def mask_email(email: str) -> str:
        """邮箱脱敏"""
        if '@' not in email:
            return email
        local, domain = email.split('@', 1)
        if len(local) <= 2:
            return f"{local[0]}***@{domain}"
        return f"{local[:2]}***@{domain}"

    @staticmethod
    def mask_phone(phone: str) -> str:
        """手机号脱敏"""
        if len(phone) != 11:
            return phone
        return f"{phone[:3]}****{phone[7:]}"

    @staticmethod
    def mask_id_card(id_card: str) -> str:
        """身份证脱敏"""
        if len(id_card) != 18:
            return id_card
        return f"{id_card[:6]}********{id_card[-4:]}"

    @staticmethod
    def mask_bank_account(account: str) -> str:
        """银行卡号脱敏"""
        if len(account) < 8:
            return account
        return f"{account[:4]}****{account[-4:]}"

# 在API响应中使用脱敏
@app.get("/api/v1/users/profile")
async def get_user_profile(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "email": DataMaskingService.mask_email(current_user.email),
        "phone": DataMaskingService.mask_phone(current_user.phone),
        "name": current_user.name,
        # 敏感信息不返回
    }
```

#### 审计日志
```python
# 审计日志服务
class AuditLogger:
    def __init__(self, db_session):
        self.db = db_session

    def log_user_action(
        self,
        user_id: str,
        action: str,
        resource: str,
        resource_id: str = None,
        details: dict = None,
        ip_address: str = None,
        user_agent: str = None
    ):
        """记录用户操作"""
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            resource_id=resource_id,
            details=json.dumps(details) if details else None,
            ip_address=ip_address,
            user_agent=user_agent,
            timestamp=datetime.utcnow()
        )
        self.db.add(audit_log)
        self.db.commit()

    def log_security_event(
        self,
        event_type: str,
        severity: str,
        description: str,
        user_id: str = None,
        ip_address: str = None,
        details: dict = None
    ):
        """记录安全事件"""
        security_event = SecurityLog(
            event_type=event_type,
            severity=severity,
            description=description,
            user_id=user_id,
            ip_address=ip_address,
            details=json.dumps(details) if details else None,
            timestamp=datetime.utcnow()
        )
        self.db.add(security_event)
        self.db.commit()

# 审计日志中间件
@app.middleware("http")
async def audit_middleware(request: Request, call_next):
    start_time = time.time()

    # 记录请求
    response = await call_next(request)

    # 计算响应时间
    process_time = time.time() - start_time

    # 获取用户信息（如果已认证）
    user_id = getattr(request.state, 'user_id', None)
    ip_address = request.client.host
    user_agent = request.headers.get("user-agent")

    # 记录审计日志
    await audit_logger.log_user_action(
        user_id=user_id,
        action=f"{request.method} {request.url.path}",
        resource="api",
        details={
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "response_time": process_time,
            "query_params": dict(request.query_params),
        },
        ip_address=ip_address,
        user_agent=user_agent
    )

    return response

# 使用示例
@app.post("/api/v1/strategies")
async def create_strategy(
    strategy_data: StrategyCreate,
    current_user: User = Depends(get_current_user),
    strategy_service: StrategyService = Depends()
):
    try:
        # 创建策略
        strategy = await strategy_service.create_strategy(strategy_data, current_user.id)

        # 记录审计日志
        audit_logger.log_user_action(
            user_id=current_user.id,
            action="CREATE",
            resource="STRATEGY",
            resource_id=str(strategy.id),
            details={"strategy_name": strategy.name}
        )

        return strategy

    except Exception as e:
        # 记录安全事件
        audit_logger.log_security_event(
            event_type="STRATEGY_CREATE_FAILED",
            severity="WARNING",
            description=str(e),
            user_id=current_user.id,
            details={"strategy_name": strategy_data.name}
        )
        raise
```

## API安全

### 1. 请求限流

#### 限流配置
```python
# 限流服务
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# 创建限流器
limiter = Limiter(key_func=get_remote_address)

# 全局限流
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# 应用限流中间件
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 特定端点限流
@app.post("/api/v1/backtest")
@limiter.limit("10 per minute")  # 每分钟最多10次
@limiter.limit("100 per day")     # 每天最多100次
async def create_backtest(
    request: Request,
    config: BacktestConfig,
    current_user: User = Depends(get_current_user)
):
    return await backtest_service.create_backtest(config, current_user.id)

# 用户级限流
def get_user_id_key(request: Request):
    """基于用户ID限流"""
    return request.state.user_id if hasattr(request.state, 'user_id') else get_remote_address(request)

@app.get("/api/v1/strategies")
@limiter.limit("100 per hour", key_func=get_user_id_key)
async def get_strategies(request: Request):
    return await strategy_service.get_user_strategies(request.state.user_id)
```

#### 分布式限流
```python
# Redis限流
class DistributedRateLimiter:
    def __init__(self, redis_client: Redis):
        self.redis = redis_client

    async def check_rate_limit(
        self,
        key: str,
        limit: int,
        window: int  # 窗口大小（秒）
    ) -> bool:
        """
        检查限流
        Args:
            key: 限流键
            limit: 限制次数
            window: 时间窗口
        Returns:
            True表示通过，False表示被限制
        """
        pipe = self.redis.pipeline()
        now = time.time()
        window_start = now - window

        # 移除窗口外的记录
        pipe.zremrangebyscore(key, 0, window_start)
        # 获取当前窗口内的请求数
        pipe.zcard(key)
        # 添加当前请求
        pipe.zadd(key, {str(now): now})
        # 设置键过期时间
        pipe.expire(key, window)

        results = await pipe.execute()
        current_requests = results[1]

        return current_requests < limit

# 使用分布式限流
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # 获取限流键
    if hasattr(request.state, 'user_id'):
        key = f"rate_limit:user:{request.state.user_id}:{request.url.path}"
    else:
        key = f"rate_limit:ip:{get_remote_address(request)}:{request.url.path}"

    # 检查限流
    is_allowed = await rate_limiter.check_rate_limit(key, limit=100, window=3600)

    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded"
        )

    response = await call_next(request)
    return response
```

### 2. 输入验证

#### Pydantic验证模型
```python
# 验证模型
from pydantic import BaseModel, validator, Field
from typing import Optional
import re

class StrategyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="策略名称")
    display_name: str = Field(..., min_length=1, max_length=255, description="策略显示名称")
    description: Optional[str] = Field(None, max_length=1000, description="策略描述")
    strategy_type: str = Field(..., description="策略类型")
    source_code: str = Field(..., min_length=100, description="策略源代码")
    parameters: dict = Field(default_factory=dict, description="策略参数")

    @validator('name')
    def validate_name(cls, v):
        if not re.match(r'^[a-zA-Z0-9_\-\s]+$', v):
            raise ValueError('策略名称只能包含字母、数字、空格、下划线和连字符')
        return v

    @validator('source_code')
    def validate_source_code(cls, v):
        # 检查是否包含危险函数
        dangerous_patterns = [
            r'import\s+os',
            r'import\s+subprocess',
            r'eval\s*\(',
            r'exec\s*\(',
            r'__import__',
            r'open\s*\(',
        ]

        for pattern in dangerous_patterns:
            if re.search(pattern, v):
                raise ValueError('源代码包含危险操作')

        return v

    @validator('strategy_type')
    def validate_strategy_type(cls, v):
        allowed_types = ['trend', 'mean_reversion', 'momentum', 'arbitrage', 'custom']
        if v not in allowed_types:
            raise ValueError(f'策略类型必须是以下之一: {", ".join(allowed_types)}')
        return v

class BacktestConfig(BaseModel):
    strategy_id: str = Field(..., description="策略ID")
    symbols: List[str] = Field(..., min_items=1, max_items=1000, description="股票代码列表")
    start_time: datetime = Field(..., description="开始时间")
    end_time: datetime = Field(..., description="结束时间")
    initial_capital: float = Field(1000000, gt=0, description="初始资金")

    @validator('end_time')
    def validate_time_range(cls, end_time, values):
        start_time = values.get('start_time')
        if start_time and end_time <= start_time:
            raise ValueError('结束时间必须大于开始时间')

        # 限制回测时间范围不超过1年
        time_diff = end_time - start_time
        if time_diff.days > 365:
            raise ValueError('回测时间范围不能超过1年')

        return end_time

    @validator('symbols')
    def validate_symbols(cls, v):
        # 验证股票代码格式
        symbol_pattern = re.compile(r'^[A-Z]{2,4}\.\d{6}$')
        for symbol in v:
            if not symbol_pattern.match(symbol):
                raise ValueError(f'无效的股票代码格式: {symbol}')
        return v
```

#### SQL注入防护
```python
# 安全查询构建器
class SafeQueryBuilder:
    """安全的查询构建器"""
    def __init__(self):
        self.conditions = []
        self.params = []

    def add_condition(self, field: str, operator: str, value: Any):
        """添加查询条件"""
        # 验证字段名（防止SQL注入）
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', field):
            raise ValueError(f'Invalid field name: {field}')

        # 验证操作符
        allowed_operators = ['=', '!=', '>', '<', '>=', '<=', 'IN', 'LIKE', 'BETWEEN']
        if operator not in allowed_operators:
            raise ValueError(f'Invalid operator: {operator}')

        if operator == 'IN':
            if not isinstance(value, list) or len(value) == 0:
                raise ValueError('IN operator requires a non-empty list')

            placeholders = ','.join(['%s'] * len(value))
            self.conditions.append(f"{field} IN ({placeholders})")
            self.params.extend(value)
        elif operator == 'BETWEEN':
            if not isinstance(value, list) or len(value) != 2:
                raise ValueError('BETWEEN operator requires a list with exactly 2 values')

            self.conditions.append(f"{field} BETWEEN %s AND %s")
            self.params.extend(value)
        else:
            self.conditions.append(f"{field} {operator} %s")
            self.params.append(value)

    def build(self) -> tuple:
        """构建查询"""
        where_clause = " AND ".join(self.conditions) if self.conditions else "1=1"
        return where_clause, self.params

# ORM查询示例
async def get_filtered_strategies(filters: dict):
    """安全的策略查询"""
    builder = SafeQueryBuilder()

    if filters.get('user_id'):
        builder.add_condition('user_id', '=', filters['user_id'])

    if filters.get('strategy_type'):
        builder.add_condition('strategy_type', '=', filters['strategy_type'])

    if filters.get('is_active') is not None:
        builder.add_condition('is_active', '=', filters['is_active'])

    where_clause, params = builder.build()

    query = f"""
        SELECT * FROM strategies
        WHERE {where_clause}
        ORDER BY created_at DESC
        LIMIT %s OFFSET %s
    """

    params.extend([filters.get('limit', 20), filters.get('offset', 0)])

    return await db.fetch_all(query, params)
```

## 网络安全

### 1. CORS配置

```python
# CORS中间件
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://xtrading.com",
        "https://app.xtrading.com",
        "http://localhost:3000",  # 开发环境
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "X-Requested-With",
        "Accept",
        "Origin",
    ],
    expose_headers=["X-Total-Count", "X-Page-Size"],
    max_age=86400,  # 24小时
)
```

### 2. CSP内容安全策略

```python
# CSP中间件
@app.middleware("http")
async def csp_middleware(request: Request, call_next):
    response = await call_next(request)

    # 设置CSP头
    csp_policy = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https:; "
        "connect-src 'self' wss: https:; "
        "frame-ancestors 'none';"
    )

    response.headers["Content-Security-Policy"] = csp_policy

    # 其他安全头
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    return response
```

### 3. IP白名单

```python
# IP白名单中间件
class IPSecurityMiddleware:
    def __init__(self, allowed_ips: List[str]):
        self.allowed_ips = allowed_ips
        self.local_ip_prefixes = ['127.0.0.1', '192.168.', '10.', '172.']

    def is_allowed_ip(self, ip: str) -> bool:
        """检查IP是否在白名单中"""
        # 允许本地IP
        for prefix in self.local_ip_prefixes:
            if ip.startswith(prefix):
                return True

        return ip in self.allowed_ips

    async def __call__(self, request: Request, call_next):
        client_ip = request.client.host

        # 跳过健康检查端点
        if request.url.path in ["/health", "/metrics"]:
            return await call_next(request)

        if not self.is_allowed_ip(client_ip):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="IP address not allowed"
            )

        return await call_next(request)

# 使用IP白名单中间件
ip_security = IPSecurityMiddleware(
    allowed_ips=[
        "192.168.1.100",
        "10.0.0.50",
        # 添加其他允许的IP
    ]
)

app.middleware("http")(ip_security)
```

## 安全监控

### 1. 异常检测

```python
# 异常检测服务
class SecurityMonitor:
    def __init__(self, redis_client: Redis):
        self.redis = redis_client
        self.failed_attempts_key = "security:failed_attempts"
        self.blocked_ips_key = "security:blocked_ips"

    async def record_failed_attempt(self, ip: str, user_id: str = None):
        """记录失败尝试"""
        key = f"{self.failed_attempts_key}:{ip}"
        count = await self.redis.incr(key)
        await self.redis.expire(key, 3600)  # 1小时过期

        # 如果失败次数过多，记录安全事件
        if count >= 5:
            await self.log_security_event(
                event_type="MULTIPLE_FAILED_ATTEMPTS",
                severity="WARNING",
                description=f"Multiple failed attempts from IP: {ip}",
                ip_address=ip,
                details={"attempt_count": count, "user_id": user_id}
            )

    async def block_ip(self, ip: str, duration: int = 3600):
        """封禁IP"""
        await self.redis.setex(
            f"{self.blocked_ips_key}:{ip}",
            duration,
            "blocked"
        )

        await self.log_security_event(
            event_type="IP_BLOCKED",
            severity="WARNING",
            description=f"IP blocked: {ip}",
            ip_address=ip,
            details={"duration": duration}
        )

    async def is_ip_blocked(self, ip: str) -> bool:
        """检查IP是否被封禁"""
        result = await self.redis.get(f"{self.blocked_ips_key}:{ip}")
        return result is not None

    async def log_security_event(self, event_type: str, severity: str, description: str, **kwargs):
        """记录安全事件"""
        event_data = {
            "event_type": event_type,
            "severity": severity,
            "description": description,
            "timestamp": datetime.utcnow().isoformat(),
            **kwargs
        }

        # 发送到安全事件队列
        await self.redis.lpush("security:events", json.dumps(event_data))

        # 实时告警
        if severity in ["CRITICAL", "HIGH"]:
            await self.send_alert(event_data)

    async def send_alert(self, event_data: dict):
        """发送告警"""
        # 发送到告警系统
        await alert_service.send_alert(
            title=f"Security Alert: {event_data['event_type']}",
            message=event_data['description'],
            severity=event_data['severity'],
            metadata=event_data
        )

# 安全监控中间件
@app.middleware("http")
async def security_monitor_middleware(request: Request, call_next):
    client_ip = request.client.host

    # 检查IP是否被封禁
    if await security_monitor.is_ip_blocked(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="IP address temporarily blocked"
        )

    try:
        response = await call_next(request)

        # 监控异常响应
        if response.status_code >= 500:
            await security_monitor.log_security_event(
                event_type="SERVER_ERROR",
                severity="HIGH",
                description=f"Server error: {response.status_code}",
                ip_address=client_ip,
                details={
                    "status_code": response.status_code,
                    "path": request.url.path,
                    "method": request.method
                }
            )

        return response

    except Exception as e:
        # 记录异常
        await security_monitor.record_failed_attempt(client_ip)

        await security_monitor.log_security_event(
            event_type="INTERNAL_ERROR",
            severity="HIGH",
            description=f"Internal error: {str(e)}",
            ip_address=client_ip,
            details={
                "path": request.url.path,
                "method": request.method,
                "error": str(e)
            }
        )

        raise
```

### 2. 安全审计报告

```python
# 安全审计报告
class SecurityAuditReport:
    def __init__(self, db_session):
        self.db = db_session

    async def generate_daily_report(self, date: date) -> dict:
        """生成每日安全报告"""
        # 获取安全事件统计
        events_by_type = await self._get_events_by_type(date)
        events_by_severity = await self._get_events_by_severity(date)
        top_attack_sources = await self._get_top_attack_sources(date)
        blocked_ips = await self._get_blocked_ips(date)

        return {
            "date": date.isoformat(),
            "summary": {
                "total_events": sum(events_by_type.values()),
                "critical_events": events_by_severity.get("CRITICAL", 0),
                "high_events": events_by_severity.get("HIGH", 0),
                "blocked_ips": len(blocked_ips)
            },
            "events_by_type": events_by_type,
            "events_by_severity": events_by_severity,
            "top_attack_sources": top_attack_sources,
            "blocked_ips": blocked_ips,
        }

    async def _get_events_by_type(self, date: date) -> dict:
        """按类型统计事件"""
        query = """
            SELECT event_type, COUNT(*) as count
            FROM security_logs
            WHERE DATE(timestamp) = $1
            GROUP BY event_type
        """
        rows = await self.db.fetch_all(query, date)
        return {row['event_type']: row['count'] for row in rows}

    async def _get_events_by_severity(self, date: date) -> dict:
        """按严重程度统计事件"""
        query = """
            SELECT severity, COUNT(*) as count
            FROM security_logs
            WHERE DATE(timestamp) = $1
            GROUP BY severity
        """
        rows = await self.db.fetch_all(query, date)
        return {row['severity']: row['count'] for row in rows}

    async def _get_top_attack_sources(self, date: date) -> List[dict]:
        """获取攻击源TOP10"""
        query = """
            SELECT ip_address, COUNT(*) as attempt_count
            FROM security_logs
            WHERE DATE(timestamp) = $1 AND ip_address IS NOT NULL
            GROUP BY ip_address
            ORDER BY attempt_count DESC
            LIMIT 10
        """
        rows = await self.db.fetch_all(query, date)
        return [dict(row) for row in rows]

# 定时生成安全报告
async def generate_daily_security_reports():
    """每日定时生成安全报告"""
    yesterday = date.today() - timedelta(days=1)
    report = await security_audit_report.generate_daily_report(yesterday)

    # 保存报告
    await save_security_report(report)

    # 发送邮件给管理员
    await email_service.send_security_report(report)
```

## 总结

xTrading系统的安全架构采用多层次防护策略：

1. **身份认证**：JWT令牌 + API密钥双重认证
2. **权限控制**：RBAC细粒度权限管理
3. **数据安全**：加密存储 + 传输加密 + 数据脱敏
4. **API安全**：限流 + 输入验证 + SQL注入防护
5. **网络安全**：CORS + CSP + IP白名单
6. **安全监控**：异常检测 + 安全审计 + 实时告警

通过这些安全措施，确保了系统的安全性和可靠性。
