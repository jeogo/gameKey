# GameKey Architecture Overview

## 1. Purpose & High-Level Concept
GameKey combines:
- A RESTful Express API (products, categories, orders, payments, notifications, users)
- A Telegram bot (product discovery, ordering, crypto payment initiation, digital content delivery)
- MongoDB as the persistent store

Primary business flow: User interacts via Telegram, selects a product, initiates crypto payment (NOWPayments), webhook confirms payment, system delivers digital content instantly (or marks order for later delivery if inventory insufficient).

## 2. Technology Stack
- Runtime: Node.js + TypeScript
- API: Express 5.x with swagger-ui-express for documentation
- Bot: grammy framework + @grammyjs/storage-mongodb for persistent sessions
- DB: MongoDB (collections: users, products, categories, orders, payment_transactions, notifications, sessions, payment_status_history)
- Validation: express-validator custom chains
- Security: rate limiting (express-rate-limit), request sanitization, webhook signature verification (NOWPayments HMAC SHA512), input validation
- Performance: custom performance monitor (timings, slow ops alerting), MongoDB indexed queries
- Testing: Jest + mongodb-memory-server (potential; current test is minimal)

## 3. Startup Sequence (`src/index.ts`)
1. Load environment variables.
2. Connect to MongoDB (`connectToDatabase`).
3. Run optimization & index creation (`initializeDatabase`).
4. Start Express server (`startServer`).
5. Start Telegram bot (`startBot`).
6. Register graceful shutdown handlers (SIGINT, SIGTERM, unhandled errors).

## 4. Data Model Layer (Interfaces Only)
Simple TypeScript interfaces (not Mongoose):
- User: telegramId, username, createdAt
- Category: name, description, createdAt
- Product: name, description, price, categoryId, isAvailable, digitalContent[]
- Order: userId, productId, quantity, unitPrice, totalAmount, status, deliveredContent?, createdAt
- PaymentTransaction: orderId, userId, amount, currency, paymentProvider, status, externalId, providerTransactionId?, crypto metadata, paymentUrl, createdAt
- Notification: title, message, audience, targetUserIds?, createdAt

Note: Some code references fields no longer in interfaces (e.g. updatedAt, completedAt) leading to potential ambiguity.

## 5. Repository Layer (Raw MongoDB)
Pattern:
- Ensure DB connected (connectToDatabase)
- Use `getDb().collection(name)`
- Helpers map `_id` ObjectId → string
- CRUD + query logic (pagination in Orders, statistics, payment history aggregation)

Highlights:
- ProductRepository sanitizes ID by trimming at underscore for compound IDs (backward compatibility).
- OrderRepository supports pagination + sales aggregation via aggregation pipeline.
- PaymentRepository includes status history recording and statistics computation.
- Index reliance for performance (created in optimization script).

Risks / Observations:
- No centralized transaction (MongoDB multi-document transactions absent). Payment/order updates rely on sequential operations; partial failure could desynchronize.
- Some repositories swallow errors silently (e.g., ProductRepository `console.error('Product lookup failed')` without propagating).

## 6. Controllers
Controllers wrap repositories adding business orchestration:
- UserController allows ID as Mongo or Telegram numeric ID, handles update translation.
- NotificationController sends broadcast via bot and stores DB record.
- PaymentController couples payment status changes to order status and user notification.
- OrderController (in codebase but not yet read here) expected to provide higher-order operations such as sync and stats. (Ensure any business invariants enforced there.)

Potential improvement: Introduce service layer abstraction to avoid controllers containing cross-resource logic.

## 7. Routing Layer (Express)
Routes apply validation & rate limiting segmentation:
- Users: manual pagination in memory (inefficient for large datasets) – should push pagination into query & use limit/skip.
- Products / Orders / Payments / Notifications: restful endpoints + specialized stats endpoints.
- Payments webhook endpoint (`/api/payments/webhook/nowpayments`) includes signature validation (prod only), rate limit, logging.

Swagger doc integration: endpoints annotated; root `server.ts` mounts swagger UI + JSON spec.

Duplication: Health route defined twice in `server.ts`.

## 8. Bot Architecture
- Single bot instance with middleware: session (MongoDB), errorHandler (timeouts), authMiddleware (admin bypass / automatic acceptance).
- Commands registration sets Telegram command menu.
- Handlers:
  - Callback handlers manage product browsing & crypto payment setup.
  - PaymentHandlers process webhooks and deliver content post-success.
  - Orders browsing paginated at bot level.
  - Profile shows computed stats by repository queries.

Session Data: Minimal; step gating username initial collection then approved.

Inventory Delivery Flow:
1. User selects product → Purchase confirmation.
2. Chooses crypto currency → Payment link created via NOWPaymentsService.
3. Transaction stored (pending).
4. Webhook arrives → status mapping → successful triggers `handleSuccessfulPayment`.
5. Digital content slice & deliver; update product inventory & order status.

Failure Conditions:
- Insufficient inventory: user notified; product flagged availability.
- Payment pending/failed leads to user messaging options for retry or support.

## 9. Payment Flow Deep Dive
Components:
- `NowPaymentsService.createPayment` selects best crypto variant, falls back if unavailable, constructing invoice or direct link.
- Transaction logged to `payment_transactions` with externalId & paymentUrl.
- Webhook consumed at route → `processPaymentWebhook` → repository update → order fulfillment.
- Status poll via callback queries triggers `getPaymentStatus` network call and updates transaction.

Observations:
- Race potential: webhook & user manual status check might both attempt status update simultaneously.
- Missing idempotency key usage for webhook; repeated webhook could trigger duplicate delivery if not guarded. (Currently relies on product inventory shrink—safe but not explicit.)
- No cryptographic verification of orderId vs transaction mapping beyond repository references.

## 10. Notification Flow
- Creation writes DB record and broadcasts via bot to either all users (retrieved via UserRepository) or subset of Telegram IDs.
- No persistence of delivery status per-user; failures logged to console only.
- Potential enhancement: store per-user delivery results for reliability metrics.

## 11. Database Optimization
`initializeDatabase` builds indexes across core collections for query performance. Coverage includes uniqueness & composite indexes for anticipated query patterns.
Potential gap: Some queries search by `createdAt` and status simultaneously— indexes present. Payment stats rely on full collection scan sometimes (could add index on `createdAt` alone). Notifications indexing references `userId`, `isRead` though Notification interface uses `audience` not per-user storage; mismatch indicates legacy schema.

## 12. Utilities Overview
- `apiValidation`: unified response helpers, validation chains, sanitization, simple in-memory rate limiter (per-IP-path) separate from express-rate-limit.
- `performance`: granular timing & reports, slow operation warnings.
- `logger`: colored structured logging with component segmentation.
- `webhookSecurity`: signature verification + IP & rate limit utilities.
- `cryptoUtils`: currency selection heuristics.
- `formatters`: display helpers.
- `adminUtils`: environment-driven admin ID parsing.

## 13. Error Handling Strategy
- API: dual handlers (`utils/apiValidation.globalErrorHandler` and `middleware/errorHandler.globalErrorHandler`) – duplication; risk of confusion. Streamline to single consistent handler.
- Bot: middleware catches and replies generic error; no classification.
- Repositories: mix of try/catch with console logging; some silent fail returns e.g. `null` or empty arrays.

Recommendation: Introduce domain-specific error classes (already started in middleware/errorHandler) and propagate upward.

## 14. Performance & Reliability
Strengths:
- Indexed queries reduce latency.
- Performance monitor collects metrics; route attaches timers.
- Retry logic in MongoDB connection with fallback URI.

Gaps:
- No circuit breaker usage around external payment calls (class exists but unused).
- Payment status check concurrency not debounced; could overwhelm provider for large user base.
- Manual pagination (users/products) done in memory in some routes.

## 15. Security Posture
Implemented:
- Rate limiting (general, api-specific, strict) per route class.
- Input sanitization removing scripts and event handlers.
- HMAC signature validation for NOWPayments (production only).
- Webhook rate limiting (custom in-memory map).

Missing / Improve:
- Authentication / Authorization for admin-only operations (e.g., create product/category, send notification). Currently open endpoints.
- CSRF not relevant (API likely consumed server-side / bot), but lack of API keys or JWT tokens leaves endpoints publicly modifiable.
- Encryption at rest / secret management not addressed (dotenv only).

## 16. Testing
Current test (`bot.test.ts`) is a placeholder asserting true; no functional or integration coverage.
Recommended test coverage:
- Repository unit tests with mongodb-memory-server.
- Payment flow integration (mock NOWPayments responses, webhook event simulation).
- Bot command + callback interaction tests (grammy test harness).
- Validation tests for endpoints.

## 17. Known Inconsistencies & Potential Issues
1. Duplicate health route & two global error handlers in `server.ts`.
2. Payment & order statuses mapping: OrderRepository update sets status 'delivered' directly on payment completion, skipping 'paid'. Business semantics unclear.
3. Unused/empty service files: `StartupNotificationService.ts`, `payments/BasePaymentProvider.ts`, `NOWPaymentsProvider.ts`, `PaymentManager.ts` clutter repository.
4. Some validation rules reference fields removed from simplified models (e.g., preorder fields, product additional info).
5. Inventory delivery logic does not wrap operations in a transaction (risk: product inventory update fails after content delivered).
6. Potential double responses in webhook route (`res.json` + `res.status(200).json` sequential).
7. Mixed approach to updating product: updateProduct may set fields not actually in interface (e.g., updatedAt) leading to implicit schema drift.
8. Logging may expose sensitive data in production (request bodies).
9. Webhook IP validation list is static & limited; may produce false negatives.
10. Missing idempotency guard on content delivery (deliverDigitalContent could run twice if race conditions occur before inventory update).

## 18. Suggested Improvements (Prioritized)
| Priority | Improvement | Benefit |
|----------|-------------|---------|
| High | Add authentication (JWT or API key) & role-based authorization for admin endpoints | Prevent unauthorized data modification |
| High | Implement idempotent payment fulfillment check (flag on order or transaction) before delivering | Avoid double delivery / fraud |
| High | Use MongoDB transactions for payment success: update order + product inventory atomically | Ensure consistency |
| High | Fix webhook route double response + unify single global error handler | Correctness & clarity |
| Medium | Move pagination into queries (users/products) & return meta (page, total) consistently | Performance & uniform API contract |
| Medium | Activate circuit breaker for external payment calls & exponential backoff on status polling | Resilience |
| Medium | Formalize service layer (PaymentService, OrderService) to reduce controller complexity | Maintainability |
| Medium | Expand tests (repositories, webhooks, bot flows) | Reliability & upgrade confidence |
| Medium | Add deliveredAt timestamp & status progression (pending → paid → delivered) | Analytics clarity |
| Low | Remove or implement empty files (PaymentManager, Providers) | Reduce clutter |
| Low | Add user notification delivery result persistence | Operational visibility |
| Low | Enhance logging with correlation IDs per request/transaction | Traceability |
| Low | Document currency fallback logic externally for transparency | UX clarity |

## 19. Data Flow Narratives
### 19.1 Product Purchase Flow
1. User selects product in bot → `product_<id>` callback.
2. Bot calls ProductRepository for details; shows purchase confirmation.
3. User selects crypto → invokes `handleCryptoPayment`.
4. Creates user if absent → creates order → calls NOWPayments invoice API → stores transaction.
5. User receives payment URL; can poll status.
6. Webhook arrives → processes status → if completed, deliver content (update product inventory + order status + send message).

### 19.2 Payment Status Polling
- User presses Check Payment → bot fetches transaction → NOWPaymentsService.getPaymentStatus → updates transaction → refreshes message.

### 19.3 Notification Broadcast
- Admin posts notification via API → NotificationController.createNotification → stores record → fetches all users (UserRepository) → loops sending bot messages (parallel Promise.all).

### 19.4 API Request Lifecycle
1. Incoming request hits rate limit & sanitization.
2. Logging middleware records request start.
3. Validator chains run; handleValidationErrors returns early on failure.
4. Controller executes repository operations; performance middleware timer ends on finish.
5. Response sent; logging middleware logs status & duration.
6. Errors propagate to error handler (two present—needs consolidation).

### 19.5 Database Optimization
- On startup `initializeDatabase` builds indexes.
- Performance gains realized in queries with filters (status + createdAt etc.).

## 20. Next Steps Checklist
1. Implement auth & roles.
2. Add idempotency & transaction for delivery.
3. Consolidate error handling.
4. Fix webhook double response.
5. Replace manual pagination with DB-level pagination (include total count endpoint logic).
6. Complete service layer abstraction.
7. Strengthen tests.
8. Clean unused files & sync validation rules with current models.
9. Add correlation IDs & structured context logging.
10. Expand payment provider abstraction (prepare PayPal/Stripe providers).

## 21. Glossary
- Transaction (Payment): Record of attempted payment through provider.
- Order: User intent to receive product; becomes delivered when content sent.
- Digital Content: Array of strings (codes or email:password combinations) consumed sequentially.
- Webhook: Provider callback updating payment status.

---
Generated: 2025-10-20
