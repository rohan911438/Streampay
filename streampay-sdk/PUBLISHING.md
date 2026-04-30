# Publishing Guide - StreamPay SDK

This guide walks you through publishing the StreamPay SDK to the npm registry.

## Prerequisites

- ✅ Node.js 16+ installed
- ✅ npm account created at [npmjs.com](https://www.npmjs.com)
- ✅ Verified email on npm account
- ✅ 2FA (Two-Factor Authentication) enabled for security
- ✅ SDK code ready in `streampay-sdk/` directory
- ✅ `package.json` and `tsconfig.json` configured

## Step 1: Pre-Publish Verification

### 1.1 Clean Build

Remove any previous build artifacts and rebuild:

```bash
cd streampay-sdk
rm -rf dist node_modules package-lock.json
npm install
npm run build
```

**Expected output:**
- No TypeScript errors
- `dist/` directory created with compiled JavaScript
- `dist/index.d.ts` generated (type definitions)
- `dist/index.js` and other modules present

### 1.2 Verify Build Artifacts

```bash
# Check dist directory structure
ls -la dist/
# Output should include:
# - index.js
# - index.d.ts
# - types.js
# - types.d.ts
# - client.js
# - client.d.ts
# - payments.js
# - payments.d.ts
# - subscriptions.js
# - subscriptions.d.ts
# - utils.js
# - utils.d.ts
```

### 1.3 Test TypeScript Compilation

```bash
npm run typecheck
```

Should complete without errors.

### 1.4 Verify package.json

Ensure your `package.json` includes:

```json
{
  "name": "streampay-sdk",
  "version": "1.0.0",
  "description": "Privacy-first payment SDK for Solana",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "module": "dist/index.js",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsc",
    "prepare": "npm run build"
  }
}
```

Key points:
- `main` points to compiled JavaScript
- `types` points to TypeScript definitions
- `files` array includes `dist/`, `README.md`, `LICENSE`
- `prepare` script runs before `npm publish`

## Step 2: npm Registry Setup

### 2.1 Login to npm

First time setup:

```bash
npm login
```

You'll be prompted for:
- Username
- Password
- Email address (must be verified)
- OTP (One-Time Password) if 2FA enabled

**Expected output:**
```
npm notice Logged in as @yourusername on https://registry.npmjs.org/.
```

### 2.2 Verify Login

```bash
npm whoami
# Output: yourusername
```

### 2.3 Check npm Account Settings

Visit: https://www.npmjs.com/settings/~yourusername/

Verify:
- Email is verified ✓
- 2FA is enabled ✓
- Profile information is complete ✓

## Step 3: Version Management

### 3.1 Current Version

Check your current version:

```bash
npm list -g npm-check-updates
npx npm-check-updates
```

### 3.2 Update Version

Use semantic versioning:

```bash
# For bug fixes (1.0.0 → 1.0.1)
npm version patch

# For new features (1.0.0 → 1.1.0)
npm version minor

# For breaking changes (1.0.0 → 2.0.0)
npm version major
```

This automatically:
- Updates `package.json` version
- Creates a git commit (if in git repo)
- Creates a git tag

**Example:**
```bash
npm version minor
# Updated from 1.0.0 to 1.1.0
```

### 3.3 Manual Version Update

Alternatively, edit `package.json` directly:

```json
{
  "version": "1.0.1"
}
```

## Step 4: Review Before Publishing

### 4.1 Dry Run (Recommended)

Test the publish without uploading:

```bash
npm publish --dry-run
```

**Expected output shows:**
```
npm notice
npm notice 📦  streampay-sdk@1.0.1
npm notice === Tarball Contents ===
npm notice 88B   package.json
npm notice 2.3kB  README.md
npm notice 1.1kB  LICENSE
npm notice 23kB   dist/index.js
npm notice 8.2kB  dist/index.d.ts
npm notice ...
npm notice === Tarball Details ===
npm notice name:          streampay-sdk
npm notice version:       1.0.1
npm notice filename:      streampay-sdk-1.0.1.tgz
npm notice ...
npm notice Tarball size:  35.6kB
npm notice Tarball SHA512: abc...
npm notice Tarball SHA1:  def...
```

### 4.2 Verify Package Contents

```bash
npm pack
tar -tzf streampay-sdk-1.0.1.tgz | head -20
```

Should show:
- ✓ `package.json`
- ✓ `README.md`
- ✓ `LICENSE`
- ✓ `dist/` files
- ✓ `.npmrc` (if public access set)

### 4.3 Check for Sensitive Files

Ensure these are NOT included:
- ✗ `.env` files
- ✗ `.git/` directory
- ✗ `node_modules/` directory
- ✗ Private keys
- ✗ Test files with secrets

Use `.npmignore` to exclude files:

```
.git
.gitignore
node_modules
.env
.env.local
*.test.ts
src/
tsconfig.json
examples.ts
.npmrc
```

## Step 5: Publish to npm

### 5.1 Public Publish

```bash
npm publish --access public
```

**What happens:**
1. Runs `npm run prepare` (builds TypeScript)
2. Creates tarball with `dist/`, `package.json`, `README.md`, `LICENSE`
3. Uploads to npm registry
4. Package becomes available publicly

**Expected output:**
```
npm notice
npm notice 📦  streampay-sdk@1.0.1
npm notice === Tarball Contents ===
...
npm notice Tarball published to https://registry.npmjs.org/streampay-sdk/-/streampay-sdk-1.0.1.tgz
npm notice
```

### 5.2 Verify Publication

```bash
npm view streampay-sdk
```

Should show your published version with:
- Latest version number
- Description
- Maintainers
- npm registry URL

### 5.3 Install from npm

Test installation in another directory:

```bash
cd /tmp
mkdir test-streampay
cd test-streampay
npm init -y
npm install streampay-sdk
```

Then test import:

```bash
node -e "const sdk = require('streampay-sdk'); console.log(typeof sdk.StreamPay);"
# Output: function
```

## Step 6: Post-Publish Tasks

### 6.1 Update GitHub (Optional)

Push tags and commits:

```bash
git push origin main
git push origin --tags
```

### 6.2 Publish Release Notes

On GitHub, create a release:

```markdown
## StreamPay SDK v1.0.1

### Features
- Privacy-first payments via Cloak
- MagicBlock execution optimization
- Full TypeScript support

### Fixes
- Bug fix in error handling
- Improved type definitions

### Installation
```bash
npm install streampay-sdk
```

### What's Changed
- Full changelog: https://github.com/streampay/streampay-sdk-js/compare/v1.0.0...v1.0.1
```

### 6.3 Update Package Metadata

On npm, update package details:

1. Visit: https://www.npmjs.com/package/streampay-sdk/settings
2. Update:
   - Package description
   - Keywords (payments, solana, web3, privacy, cloak)
   - Repository URL
   - Homepage
   - Issues URL

### 6.4 Announce Release

- 📢 Tweet/Social media
- 📧 Email to users
- 💬 Post in Discord community
- 📝 Blog post (optional)

## Step 7: Subsequent Releases

For future versions:

```bash
# 1. Make changes to source code (src/*.ts)
cd streampay-sdk

# 2. Run tests/verify
npm test  # if you add tests later

# 3. Bump version
npm version minor  # or patch/major

# 4. Dry run
npm publish --dry-run

# 5. Publish
npm publish --access public

# 6. Verify
npm view streampay-sdk@latest
```

## Troubleshooting

### Issue: "403 Forbidden - need admin review"

**Solution:** Your package name is already taken or reserved
- Choose a different name: `@your-org/streampay-sdk`
- Register as scoped package with `@` prefix

Update `package.json`:
```json
{
  "name": "@yourorg/streampay-sdk"
}
```

Then publish:
```bash
npm publish --access public
```

### Issue: "401 Unauthorized"

**Solution:** Not logged in or session expired

```bash
npm logout
npm login
npm whoami  # Verify
```

### Issue: "409 Conflict - version already published"

**Solution:** Version already exists on npm

Increment version:
```bash
npm version patch
npm publish --access public
```

### Issue: "ENOMEM - file too large"

**Solution:** Package tarball too large (>100MB)

Check what's included:
```bash
npm pack
tar -tzf streampay-sdk-*.tgz | wc -l
du -sh streampay-sdk-*.tgz
```

Ensure `dist/` is minified and `.npmignore` excludes unnecessary files.

### Issue: "402 Payment Required"

**Solution:** Free npm account has reached package limit (currently no limit)

Contact npm support if this occurs.

## Best Practices

✅ **Always test before publishing:**
- `npm run build`
- `npm publish --dry-run`
- `npm install` in clean directory

✅ **Use semantic versioning:**
- `1.0.0` - Major.Minor.Patch
- `1.0.1` - Patch release (bug fixes)
- `1.1.0` - Minor release (new features, backwards compatible)
- `2.0.0` - Major release (breaking changes)

✅ **Keep version in sync:**
- `package.json` version
- Git tags
- Release notes

✅ **Document changes:**
- Clear commit messages
- Update CHANGELOG.md
- Write release notes

✅ **Security first:**
- Never commit `.env` files
- Use `npm audit` to check for vulnerabilities
- Keep dependencies up to date

✅ **Maintain backward compatibility:**
- Don't remove existing APIs
- Deprecate gradually
- Provide migration guides

## Security Best Practices

- ✅ Enable 2FA on npm account
- ✅ Use npm tokens with limited scope (for CI/CD)
- ✅ Regularly audit package for vulnerabilities
- ✅ Never publish secrets or private keys
- ✅ Review dependencies before each release

## Links & Resources

- **npm Registry**: https://registry.npmjs.org
- **npm Docs**: https://docs.npmjs.com
- **Semantic Versioning**: https://semver.org
- **npm CLI Reference**: https://docs.npmjs.com/cli

## Questions?

- 📧 Email: [support@streampay.io](mailto:support@streampay.io)
- 💬 Discord: [StreamPay Community](https://discord.gg/streampay)
- 📖 Docs: [docs.streampay.io](https://docs.streampay.io)

---

**Happy Publishing! 🚀**
