# Codebase Concerns

**Analysis Date:** 2026-04-30

## Tech Debt

**Broad Exception Handling with Silent Failures:**
- Issue: `akshare_util.py` contains 20+ functions that silently return `{}` or `[]` on any exception
- Files: `src/pytrading/utils/akshare_util.py`
- Impact: Errors are hidden, making debugging difficult. Empty collections returned can cause downstream issues in loops and conditionals
- Fix approach: Add proper error classification, log all failures, consider raising specific exceptions for recoverable vs non-recoverable errors

**Broad Exception Catching:**
- Issue: Over 100 `except Exception` handlers across codebase mask specific error types
- Files: `src/pytrading/**/*.py`
- Impact: Errors are swallowed without proper handling, making root cause analysis difficult
- Fix approach: Catch specific exceptions, add error re-raising with context after initial handling

**Global Mutable State in API:**
- Issue: `task_scheduler_running`, `task_scheduler_thread`, `_last_scheduled_date` are global module-level variables
- Files: `src/pytrading/api/main.py:49, 71, 126, 174, 204`
- Impact: Thread-unsafe state management, potential race conditions in task scheduler
- Fix approach: Encapsulate state in a class or use asyncio primitives instead of threading

**Unimplemented Async Task Execution:**
- Issue: TODO comment indicates async task execution is delegated to background scheduler but not implemented
- Files: `src/pytrading/api/main.py:1921`
- Impact: Task execution behavior is unclear, may cause confusion about actual async behavior
- Fix approach: Implement actual async task handling or remove TODO

**Print Statements Instead of Logging:**
- Issue: `print()` used instead of proper logging in several places
- Files:
  - `src/pytrading/run/run_strategy.py:378`
  - `src/pytrading/db/mysql.py:159`
  - `src/pytrading/db/log_repository.py:62`
  - `src/pytrading/model/back_test_saver_factory.py:20`
  - `src/pytrading/py_trading.py:309`
- Impact: Not captured in log aggregation, inconsistent logging
- Fix approach: Replace all print with logger calls

## Known Bugs

**None explicitly documented.**

No TODO/FIXME/BUG comments found in source code (except single TODO at main.py:1921).

## Security Considerations

**Environment Variable Security:**
- Risk: `.env` file present (contains secrets per standard conventions)
- Files: `.env`
- Current mitigation: `.env` is in `.gitignore`
- Recommendations: Never commit `.env`, use secrets management for production

**LLM Service API Key:**
- Risk: LLM API key stored in environment variable
- Files: `src/pytrading/service/llm_service.py:21`
- Current mitigation: Read from env var, not hardcoded
- Recommendations: Validate key presence at startup, add key rotation mechanism

**CORS Configuration:**
- Risk: CORS allows all origins in some contexts
- Files: `src/pytrading/api/main.py:94-100`
- Current mitigation: Restricts to localhost:3000 in dev
- Recommendations: Make origin configurable, use strict matching in production

## Performance Bottlenecks

**Blocking Synchronous Calls in Async Context:**
- Problem: `akshare` library calls are synchronous but called from async functions
- Files: `src/pytrading/service/data_collector.py`, `src/pytrading/utils/akshare_util.py`
- Cause: No `run_in_executor` wrapping for blocking I/O
- Improvement path: Wrap blocking calls with `asyncio.to_thread()` or use thread pool

**Large Synchronous Strategy Initialization:**
- Problem: `MacdStrategy` initialization loads large data synchronously
- Files: `src/pytrading/strategy/strategy_macd.py:1-145`
- Cause: Blocking database and API calls during strategy setup
- Improvement path: Defer data loading, use lazy initialization

**Sequential Data Collection:**
- Problem: Data collection tasks appear parallel but may have hidden sequential dependencies
- Files: `src/pytrading/service/analysis_engine.py:76-93`
- Cause: `asyncio.gather()` used but underlying data sources may rate-limit
- Improvement path: Add proper concurrency limits, implement backpressure

## Fragile Areas

**AkShareUtil Data Fetching:**
- Files: `src/pytrading/utils/akshare_util.py` (556 lines)
- Why fragile: Returns empty collections on any failure, upstream API failures cascade silently
- Safe modification: Add error context logging before returning, consider raising instead of silent return
- Test coverage: Basic mocking exists but edge cases not covered

**ThreadPool Implementation:**
- Files: `src/pytrading/utils/thread_pool.py`
- Why fragile: Custom thread pool implementation using semaphore and locks
- Safe modification: Use `concurrent.futures.ThreadPoolExecutor` instead
- Test coverage: Not detected

**Order Controller:**
- Files: `src/pytrading/controller/order_controller.py`
- Why fragile: Complex trading logic with position calculations, edge cases in volume handling
- Safe modification: Add validation layers, use decimal for currency calculations
- Test coverage: Unit tests present

**Backtest Task Scheduler:**
- Files: `src/pytrading/api/main.py:46-84`
- Why fragile: Global state with threading, daemon thread may not complete cleanly
- Safe modification: Use `asyncio.create_task()` with proper lifecycle management
- Test coverage: Not detected

## Scaling Limits

**Database Connection Pooling:**
- Current capacity: Not configured explicitly
- Limit: Default SQLAlchemy pool settings may exhaust under load
- Scaling path: Configure `pool_size`, `max_overflow`, `pool_recycle`

**AI Analysis Rate:**
- Current capacity: No rate limiting on LLM calls
- Limit: API rate limits, token quotas
- Scaling path: Add request queuing, implement retry with backoff

**In-Memory Task State:**
- Current capacity: Tasks stored in module-level global variables
- Limit: Single process memory, no horizontal scaling
- Scaling path: Move to Redis or database-backed task queue

## Dependencies at Risk

**AkShare:**
- Risk: External API dependency with no SLA guarantee
- Impact: Data collection failures if upstream changes API format
- Migration plan: Abstract data fetching behind interface, add alternative data sources

**GM Quant API:**
- Risk: Proprietary SDK with potential breaking changes
- Impact: Strategy execution failures
- Migration plan: Isolate SDK usage in dedicated adapter layer

**Talib:**
- Risk: C-extension dependency, may have installation issues
- Impact: Technical analysis calculations unavailable
- Migration plan: Use `ta-lib` Python wrapper with fallback to pure Python indicators

## Missing Critical Features

**Error Recovery:**
- Problem: No circuit breaker pattern for external API calls
- Blocks: Sustained failures cascade through system

**Health Checks:**
- Problem: No health endpoint for external monitoring
- Blocks: Container orchestration liveness/readiness probes

**Graceful Shutdown:**
- Problem: Daemon threads don't wait for task completion
- Blocks: Clean shutdown under load

## Test Coverage Gaps

**Untested: ThreadPool:**
- What's not tested: Thread pool behavior under load, error handling in worker threads
- Files: `src/pytrading/utils/thread_pool.py`
- Risk: Race conditions may not manifest in normal testing
- Priority: Medium

**Untested: Task Scheduler:**
- What's not tested: Concurrent task scheduling, task cancellation
- Files: `src/pytrading/api/main.py:46-84`
- Risk: Tasks may be lost on shutdown
- Priority: High

**Untested: AkShare Integration:**
- What's not tested: Real API failures, data format changes
- Files: `src/pytrading/utils/akshare_util.py`
- Risk: Silent data failures in production
- Priority: Medium

**Untested: Trading Order Logic:**
- What's not tested: Extreme price scenarios, volume edge cases
- Files: `src/pytrading/controller/order_controller.py`, `src/pytrading/strategy/strategy_macd.py`
- Risk: Incorrect orders in live trading
- Priority: High

---

*Concerns audit: 2026-04-30*
