# Planning Context: AI Stock Analysis Feature for Watchlist

## Source Evidence

- `exploration-data-sources.json` - 14 AkShare functions identified across 4 categories (sentiment, event, news, sector). Data gaps: individual stock capital flow, dragon tiger list data, news sentiment scores. Integration points: akshare_util.py extension, api/main.py imports.
- `exploration-analysis-engine.json` - Architecture components: AnalysisEngine, TechnicalAnalyzer, SentimentCollector, EventProcessor, NewsImpactAnalyzer, RecommendationScorer. Scoring: technical(35%) + sentiment(25%) + event(25%) + news(15%). Integration points: watchlist_service.py:154, mysql.py:74, watch_type.py:25.
- `exploration-frontend-integration.json` - New components: AIAnalysisPanel, RecommendationCard, MarketSentimentBadge, AIFactorsList, AIRecommendationModal. API endpoints needed: 5 endpoints. State management pattern: chartModalVisible useState pattern.

## Understanding

- **Current State**: Watchlist feature exists with basic stock tracking. No AI analysis capability. Backend has AkShare integration, MySQL database, FastAPI endpoints. Frontend has React components with modal patterns.
- **Problem**: Users need AI-assisted investment recommendations that combine quantitative (technical indicators) and qualitative (sentiment, events, news) signals with LLM-powered insights.
- **Approach**: Build modular analysis engine with weighted scoring algorithm. Integrate LLM for enhanced insights. Persist results to database. Build frontend UI for analysis display.

## Key Decisions

- Decision: Use AkShare for all data collection | Rationale: 14+ functions available covering all required data types at no cost | Evidence: exploration-data-sources.json
- Decision: OpenAI-compatible LLM API endpoint | Rationale: Flexibility to use any LLM provider while maintaining standard interface | Evidence: user selection "自定义端点 - 兼容OpenAI格式"
- Decision: Weighted scoring with weights [0.35, 0.25, 0.25, 0.15] | Rationale: Balances quantitative and qualitative signals, technical indicators weighted highest | Evidence: exploration-analysis-engine.json
- Decision: Async batch analysis with status polling | Rationale: Meets 200ms p95 latency for single analysis; batch operations can take longer | Evidence: exploration-analysis-engine.json, performance constraints

## Dependencies

- Depends on: None (greenfield feature)
- Provides for: TASK-002 (needs API endpoints), TASK-003 (needs DB models and LLM service), TASK-004 (needs API endpoints)

## Task Grouping Rationale

Grouped into 4 tasks to minimize agent context while maintaining logical dependencies:
1. **TASK-001** (Backend Infrastructure): Foundation - all other tasks depend on this
2. **TASK-002** (Data Collection): Depends on TASK-001 DB schema; can proceed once API endpoints exist
3. **TASK-003** (Analysis Engine): Depends on both TASK-001 (DB, LLM) and TASK-002 (data); uses merge_fork strategy
4. **TASK-004** (Frontend UI): Depends on TASK-001 API endpoints; can proceed in parallel with TASK-002/TASK-003

## Known Limitations

- Data gaps: individual stock capital flow and dragon tiger list not available via AkShare
- LLM API latency may impact 200ms p95 requirement (mitigation: caching, async fallback)
- Weight tuning may be needed for optimal recommendations (mitigation: configurable weights)