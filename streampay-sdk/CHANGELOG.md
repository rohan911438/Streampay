# Changelog

All notable changes to the StreamPay SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Webhook integration support (beta)
- Request retry mechanism with exponential backoff
- Enhanced error logging for debugging
- Batch operation support for payments and subscriptions

### Changed
- Improved TypeScript type definitions
- Enhanced documentation with more examples

### Fixed
- Edge case handling in payment status checks
- Memory leak in persistent connections

### Deprecated
- Direct HTTP client usage (use StreamPay class instead)

### Security
- Added request signing for enhanced security
- Improved API key validation

## [1.0.0] - 2024-01-10

### Added
- Initial release of StreamPay SDK
- Core payment creation and tracking
- Subscription management (create, pause, resume, cancel)
- Privacy-first payments via Cloak integration
- Execution optimization via MagicBlock
- Full TypeScript support with strict types
- Zero-dependency HTTP client using Fetch API
- Comprehensive error handling with APIError class
- Support for USDC, USDT, and SOL payments
- Batch payment operations
- Payment refund operations
- Subscription invoice retrieval
- Health check endpoint
- Complete documentation and examples
- MIT License

### Features

#### Payments Module
- `createPayment()` - Create single private payments
- `getStatus()` - Check payment status
- `list()` - List payments with filtering
- `createBatch()` - Create multiple payments in one call
- `refund()` - Refund completed payments

#### Subscriptions Module
- `create()` - Create recurring subscriptions
- `getStatus()` - Get subscription status
- `list()` - List subscriptions
- `updateAmount()` - Change subscription amount
- `pause()` - Pause subscription temporarily
- `resume()` - Resume paused subscription
- `cancel()` - Cancel subscription
- `getInvoices()` - List subscription invoices

#### Core Features
- Cloak privacy protection for all transactions
- MagicBlock execution optimization
- RPC Fast infrastructure for faster settlement
- Automatic error handling and retries
- Bearer token authentication
- Request/response validation
- TypeScript strict mode
- CommonJS and ES module support

### Documentation
- Comprehensive README with features and examples
- Publishing guide for npm distribution
- Contributing guidelines
- Changelog (this file)
- MIT License
- 400+ lines of example code

### TypeScript Types Defined
- `StreamPayConfig` - SDK configuration
- `CreatePaymentRequest` - Payment creation
- `PaymentResponse` - Payment data
- `CreateSubscriptionRequest` - Subscription creation
- `SubscriptionResponse` - Subscription data
- `APIError` - Error handling
- `PaymentStatus` enum
- `SubscriptionStatus` enum
- `PaymentInterval` type

### Build Configuration
- TypeScript compilation to ES2020
- CommonJS module format
- Declaration files (.d.ts) generation
- Source maps enabled
- Strict type checking

### Testing Infrastructure Ready
- Jest configuration
- Test utilities
- Mock HTTP client
- Integration test examples

### Development Tools
- TypeScript compiler
- ESLint configuration
- Prettier formatter
- npm build scripts

---

## Versioning Guide

### Major Version (X.0.0)
Breaking changes to API or significant restructuring.

Example: 1.0.0 → 2.0.0
- Changing method signatures
- Removing public APIs
- Changing response formats

### Minor Version (1.X.0)
New features and backwards-compatible changes.

Example: 1.0.0 → 1.1.0
- Adding new methods
- New optional parameters
- New subscription features

### Patch Version (1.0.X)
Bug fixes and improvements.

Example: 1.0.0 → 1.0.1
- Error handling fixes
- Documentation updates
- Performance improvements

---

## Future Roadmap

### Q1 2024
- [ ] Webhook support
- [ ] Advanced retry logic
- [ ] Performance optimizations

### Q2 2024
- [ ] Multi-chain support (Ethereum, Polygon)
- [ ] Advanced analytics
- [ ] Rate limiting controls

### Q3 2024
- [ ] Batch verification
- [ ] Advanced fraud detection
- [ ] Enhanced compliance features

### Q4 2024
- [ ] AI-powered payment recommendations
- [ ] Advanced reporting
- [ ] Enterprise features

---

## Support

For issues or questions about a specific version:
- 📧 Email: [support@streampay.io](mailto:support@streampay.io)
- 💬 Discord: [StreamPay Community](https://discord.gg/streampay)
- 📖 Docs: [docs.streampay.io](https://docs.streampay.io)

---

**Last Updated**: 2024-01-10
**Maintained By**: StreamPay Team
**License**: MIT
