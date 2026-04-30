# Contributing to StreamPay SDK

Thank you for your interest in contributing to the StreamPay SDK! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and constructive in all interactions. We're committed to providing a welcoming environment for all contributors.

## Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
git clone https://github.com/YOUR_USERNAME/streampay-sdk-js.git
cd streampay-sdk-js
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Use descriptive branch names:
- `feature/add-payment-webhooks`
- `fix/address-validation-bug`
- `docs/improve-readme`
- `test/add-integration-tests`

## Development Workflow

### Building

```bash
# Compile TypeScript
npm run build

# Watch mode (auto-compile on changes)
npm run build:watch

# Type check only
npm run typecheck
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Code Quality

```bash
# Format code
npm run format

# Lint
npm run lint

# Fix lint issues automatically
npm run lint:fix
```

### Before Committing

```bash
# Ensure everything passes
npm run build
npm run typecheck
npm run lint
npm test
```

## Making Changes

### File Structure

```
src/
  ├── index.ts           # Main SDK export
  ├── client.ts          # HTTP client
  ├── types.ts           # TypeScript interfaces
  ├── utils.ts           # Utility functions
  ├── payments.ts        # Payments module
  ├── subscriptions.ts   # Subscriptions module
  └── ...
tests/
  ├── client.test.ts
  ├── payments.test.ts
  └── ...
```

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Use Prettier (auto-formatted)
- **Naming**: 
  - Classes: PascalCase (`StreamPay`)
  - Functions: camelCase (`getPayment()`)
  - Constants: UPPER_SNAKE_CASE (`API_TIMEOUT`)
  - Files: kebab-case (`payment-service.ts`)

### TypeScript Guidelines

```typescript
// ✓ Good: Explicit types
export function createPayment(
  amount: number,
  currency: "USDC" | "USDT" | "SOL"
): Promise<PaymentResponse> {
  // ...
}

// ✗ Avoid: Implicit any
export function createPayment(amount, currency) {
  // ...
}

// ✓ Good: Use interfaces
interface PaymentRequest {
  amount: number;
  currency: string;
}

// ✗ Avoid: Generic object types
interface PaymentRequest {
  [key: string]: any;
}
```

### Error Handling

```typescript
// ✓ Good: Custom error class
class APIError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

// ✗ Avoid: Generic errors
throw new Error("Something went wrong");

// ✓ Good: Provide context
throw new APIError(
  "INVALID_AMOUNT",
  "Amount must be greater than 0"
);
```

## Adding Features

### Step 1: Create Feature Branch

```bash
git checkout -b feature/add-webhooks
```

### Step 2: Implement with Tests

Write tests first (TDD):

```typescript
// tests/webhooks.test.ts
describe("Webhooks", () => {
  it("should verify webhook signature", () => {
    const signature = generateSignature(payload, secret);
    expect(verifySignature(payload, signature, secret)).toBe(true);
  });
});
```

Then implement:

```typescript
// src/webhooks.ts
export function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const computed = hmac(payload, secret);
  return computed === signature;
}
```

### Step 3: Add Documentation

Update README.md with usage example:

```markdown
### Webhook Verification

```typescript
import { verifySignature } from "streampay-sdk";

const isValid = verifySignature(payload, signature, secret);
```
```

### Step 4: Commit and Push

```bash
git add src/webhooks.ts tests/webhooks.test.ts README.md
git commit -m "feat: add webhook signature verification"
git push origin feature/add-webhooks
```

### Step 5: Create Pull Request

On GitHub:
1. Click "Compare & pull request"
2. Fill in PR template
3. Reference any related issues
4. Request review from maintainers

## Fixing Bugs

### Step 1: Create Issue (if not exists)

Describe:
- What's broken
- How to reproduce
- Expected behavior
- Actual behavior

### Step 2: Create Fix Branch

```bash
git checkout -b fix/payment-status-bug
```

### Step 3: Write Test

Create test that reproduces the bug:

```typescript
it("should handle null payment status", () => {
  const payment = { status: null };
  expect(() => getPaymentStatus(payment)).not.toThrow();
});
```

### Step 4: Fix Code

Make payment status handling null-safe:

```typescript
export function getPaymentStatus(payment: Payment): string {
  return payment.status ?? "unknown";
}
```

### Step 5: Verify and Commit

```bash
npm test  # All tests pass
npm run lint  # No linting errors
npm run build  # Compiles successfully

git add src/payments.ts tests/payments.test.ts
git commit -m "fix: handle null payment status gracefully"
git push origin fix/payment-status-bug
```

## Documentation

### Code Comments

Document complex logic:

```typescript
/**
 * Creates a payment with Cloak privacy protection
 * 
 * @param request - Payment creation parameters
 * @returns Promise resolving to the created payment
 * @throws APIError if validation fails
 * 
 * @example
 * const payment = await sdk.payments.create({
 *   amount: 1000,
 *   currency: "USDC",
 *   recipient_id: "wallet",
 *   privacy_mode: "cloak",
 *   source_chain: "solana"
 * });
 */
export async function create(
  request: CreatePaymentRequest
): Promise<PaymentResponse> {
  // ...
}
```

### README Updates

When adding features, update README.md:

```markdown
## New Feature: Webhooks

Configure webhook endpoints to receive payment notifications:

\`\`\`typescript
sdk.webhooks.configure({
  url: "https://example.com/webhooks",
  events: ["payment.completed", "payment.failed"]
});
\`\`\`
```

### CHANGELOG

Document all changes:

```markdown
## [1.1.0] - 2024-01-15

### Added
- Webhook signature verification
- Batch payment retry logic
- Request timeout configuration

### Fixed
- Payment status null handling
- Type definitions for subscriptions

### Changed
- HTTPClient now validates API keys before sending
```

## Testing

### Unit Tests

```typescript
describe("Payments", () => {
  let sdk: StreamPay;

  beforeEach(() => {
    sdk = new StreamPay("test_key");
  });

  it("should create a payment", async () => {
    const payment = await sdk.payments.create({
      amount: 1000,
      currency: "USDC",
      recipient_id: "wallet",
      privacy_mode: "cloak",
      source_chain: "solana"
    });

    expect(payment.id).toBeDefined();
    expect(payment.status).toBe("pending");
  });
});
```

### Integration Tests

```typescript
describe("Integration", () => {
  it("should create and verify payment", async () => {
    // Create payment
    const payment = await sdk.payments.create({...});

    // Poll for completion
    let completed = false;
    for (let i = 0; i < 10; i++) {
      const status = await sdk.payments.getStatus({
        payment_id: payment.id
      });
      if (status.status === "completed") {
        completed = true;
        break;
      }
      await sleep(1000);
    }

    expect(completed).toBe(true);
  });
});
```

### Test Coverage

Aim for >80% coverage:

```bash
npm run test:coverage
# Output: Functions: 85%, Lines: 88%, Branches: 82%
```

## Commit Messages

Use conventional commits:

```
feat: add webhook verification
fix: handle null payment status
docs: update API reference
test: add integration tests
refactor: simplify error handling
perf: optimize request batching
chore: update dependencies
```

Format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

Example:
```
feat(payments): add retry logic for failed payments

When a payment fails due to network issues, automatically
retry with exponential backoff. Max 3 retries with 1s-8s delay.

Closes #123
```

## Pull Request Process

1. **Create PR** with:
   - Clear title and description
   - Reference to related issues
   - Checklist of changes

2. **PR Template**:
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] New feature
   - [ ] Bug fix
   - [ ] Documentation
   - [ ] Breaking change

   ## Testing
   Describe how to test

   ## Checklist
   - [ ] Tests pass
   - [ ] No linting errors
   - [ ] Documentation updated
   - [ ] No breaking changes (or documented)
   ```

3. **Review Process**:
   - At least 1 maintainer review required
   - All CI checks must pass
   - Coverage must not decrease
   - No merge conflicts

4. **Merge**:
   - Squash commits before merging
   - Use semantic commit message
   - Delete branch after merge

## Getting Help

- **Questions?** Open an issue with `[QUESTION]` tag
- **Bug Report?** Use issue template
- **Feature Request?** Use issue template
- **Chat?** Join [Discord Community](https://discord.gg/streampay)

## Recognition

We appreciate all contributions! Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Featured on our website

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for making StreamPay better! 🙏**
