# 🚀 Publishing StreamPay SDK - Complete Guide

## Quick Start (Choose Your Method)

### Method 1: Automated Script (Recommended) ⭐

**Windows (Command Prompt):**
```bash
cd "c:\Users\dell\Desktop\Solana Hackathon\streampay-sdk"
publish.bat
```

**Windows (PowerShell):**
```powershell
cd "c:\Users\dell\Desktop\Solana Hackathon\streampay-sdk"
.\publish.ps1
```

**macOS/Linux:**
```bash
cd streampay-sdk
node publish.js
```

Or directly:
```bash
npm run publish
```

### Method 2: Manual Steps

**Step 1: Open Command Prompt**
```bash
cd "c:\Users\dell\Desktop\Solana Hackathon\streampay-sdk"
```

**Step 2: Login to npm** (if not already logged in)
```bash
npm login
```
- A browser window will open
- Sign in to npmjs.com or create account
- Complete the login flow
- Return to terminal

**Step 3: Verify Login**
```bash
npm whoami
```
Should show your npm username

**Step 4: Build the SDK**
```bash
npm run build
npm run typecheck
```

**Step 5: Preview What Will Be Published**
```bash
npm pack --dry-run
```

**Step 6: Publish to npm**
```bash
npm publish --access public
```

**Step 7: Verify Publication**
```bash
npm view streampay-sdk
```

---

## 📋 Before Publishing Checklist

- [ ] npm installed (`npm -v` shows version)
- [ ] Have npm account (https://www.npmjs.com/signup)
- [ ] Email verified on npm account
- [ ] 2FA enabled (recommended for security)
- [ ] npm login successful (`npm whoami` shows username)
- [ ] Git status clean (if using version control)
- [ ] package.json version is correct
- [ ] Build passes (`npm run build` completes)
- [ ] Type check passes (`npm run typecheck` completes)
- [ ] README.md is up to date
- [ ] CHANGELOG.md is updated

---

## 🎯 What Gets Published

### Included Files
```
dist/                    # Compiled JavaScript
├── *.js               # All compiled modules
├── *.d.ts             # Type definitions
└── *.map              # Source maps

README.md              # Main documentation
LICENSE                # MIT License
package.json           # Package metadata
```

### Excluded Files (via .npmignore)
```
src/                   # Source TypeScript
node_modules/          # Dependencies
.git/                  # Git files
tests/                 # Test files
examples.ts            # Examples
*.json configs         # Config files
.env files             # Environment files
```

**Size**: ~35-40 KB (very lightweight!)

---

## ✅ After Publishing

### Verify Publication (immediately after)
```bash
# Check on npm website
npm view streampay-sdk

# Or visit
https://www.npmjs.com/package/streampay-sdk

# Or test install in another directory
mkdir test-streampay
cd test-streampay
npm init -y
npm install streampay-sdk

# Test import
node -e "const sdk = require('streampay-sdk'); console.log(typeof sdk.StreamPay)"
# Should output: function
```

### Share Your Package
- 🐦 Tweet about it
- 📧 Email community
- 💬 Post in Discord
- 📱 Share on social media
- 📖 Blog post (optional)

### Example Announcement
```
🎉 Excited to announce StreamPay SDK v1.0.0!

Privacy-first payment infrastructure for Solana now available on npm.

✨ Features:
- Cloak-protected payments
- MagicBlock optimization
- Full TypeScript support
- Zero dependencies

📦 npm install streampay-sdk
📚 Docs: https://docs.streampay.io
💻 GitHub: https://github.com/streampay/streampay-sdk-js

Ready to integrate? Start here:
https://www.npmjs.com/package/streampay-sdk
```

---

## 🔄 Future Releases

For subsequent versions:

```bash
# 1. Make code changes
# 2. Update CHANGELOG.md
# 3. Bump version (patch/minor/major)
npm version patch    # 1.0.0 → 1.0.1
# or
npm version minor    # 1.0.0 → 1.1.0
# or manually edit package.json

# 4. Build
npm run build

# 5. Test
npm run typecheck

# 6. Publish
npm publish --access public
```

---

## ❌ Troubleshooting

### "403 Forbidden - need admin review"
**Cause**: Package name already exists on npm or requires approval

**Solution**: 
- Use a scoped name: `@yourorg/streampay-sdk`
- Or pick a different name

Update package.json:
```json
{
  "name": "@yourorg/streampay-sdk"
}
```

Then publish:
```bash
npm publish --access public
```

### "401 Unauthorized"
**Cause**: Not logged in or session expired

**Solution**:
```bash
npm logout
npm login
npm whoami  # Verify
npm publish --access public
```

### "409 Conflict - version already published"
**Cause**: This exact version already exists

**Solution**:
```bash
npm version patch  # Bumps 1.0.0 → 1.0.1
npm publish --access public
```

### "ENEEDAUTH - need auth This command requires you to be logged in"
**Cause**: Not authenticated

**Solution**:
```bash
npm login
npm whoami  # Should show username now
npm publish --access public
```

### "Package name must not contain uppercase letters"
**Cause**: Uppercase letters in package.json name

**Solution**: 
Change package.json:
```json
{
  "name": "streampay-sdk"  // lowercase only
}
```

### Build or typecheck fails
**Cause**: TypeScript errors

**Solution**:
```bash
npm run build        # See specific error
npm run typecheck    # Full type analysis
# Fix errors in src/ files
npm run build        # Verify fix
npm publish --access public
```

---

## 🔐 Security Best Practices

### Before Publishing
1. ✅ Verify no `.env` files included
2. ✅ Verify no private keys in code
3. ✅ Check `.npmignore` is proper
4. ✅ Review `package.json` contents
5. ✅ Enable 2FA on npm account

### After Publishing
1. ✅ Verify package contents
2. ✅ Test installation in clean environment
3. ✅ Check on npm website
4. ✅ Announce to community

### Ongoing
1. ✅ Run `npm audit` regularly
2. ✅ Keep dependencies updated
3. ✅ Monitor GitHub issues
4. ✅ Respond to security reports

---

## 📦 Package Metadata (What Users See)

### On npm Website
- **Name**: streampay-sdk
- **Version**: 1.0.0
- **Description**: Privacy-first, cross-chain payment infrastructure SDK for Solana
- **Homepage**: https://streampay.io
- **Repository**: https://github.com/streampay/streampay-sdk-js
- **Keywords**: streampay, payment, solana, web3, privacy, cloak, magicblock
- **License**: MIT
- **Maintainer**: Your name/org
- **Weekly Downloads**: (starts at 0, grows with adoption)

### Installation
```bash
npm install streampay-sdk
```

### Usage
```typescript
import { StreamPay } from "streampay-sdk";

const sdk = new StreamPay("sp_live_abc123...");
const payment = await sdk.payments.create({...});
```

---

## 📊 What Happens During Publishing

```
npm publish --access public
    ↓
✓ Reads package.json
✓ Applies .npmignore rules
✓ Runs prepare script (npm run build)
✓ Creates tarball (.tgz)
✓ Calculates checksums
✓ Uploads to npm registry
✓ Registers package name
✓ Updates npm database
✓ Makes publicly searchable
    ↓
✓ Available at https://npmjs.com/package/streampay-sdk
✓ Installable with: npm install streampay-sdk
✓ Listed in npm search results
```

---

## 🎉 Success Indicators

After publishing successfully, you should see:

1. ✅ No errors in terminal
2. ✅ Final message: "published to https://registry.npmjs.org/streampay-sdk/-/streampay-sdk-1.0.0.tgz"
3. ✅ Can run: `npm view streampay-sdk`
4. ✅ Can install: `npm install streampay-sdk`
5. ✅ Appears on: https://www.npmjs.com/package/streampay-sdk
6. ✅ Works: `npm info streampay-sdk` shows your package

---

## 🔗 Next Steps After Publishing

1. **Create GitHub Repository**
   - Push source code
   - Add npm badge
   - Link to npm package

2. **Update Documentation**
   - Add npm install badge
   - Link to npm package
   - Update download/stats info

3. **Announce Release**
   - Social media
   - Email list
   - Community forums
   - Blog post

4. **Monitor Usage**
   - Check npm weekly downloads
   - Monitor GitHub issues
   - Respond to feedback
   - Plan future releases

5. **Plan Next Release**
   - Add new features
   - Fix bugs
   - Update dependencies
   - Bump version
   - Republish

---

## 📞 Support

- **npm Help**: https://docs.npmjs.com
- **npm Account**: https://www.npmjs.com/settings/~username
- **Package Page**: https://www.npmjs.com/package/streampay-sdk
- **GitHub Issues**: Report bugs
- **Discord**: Community support

---

## ✨ Congratulations! 🎉

Your StreamPay SDK is now part of the npm ecosystem!

**What to do next:**
1. Install it in projects: `npm install streampay-sdk`
2. Import and use: `import { StreamPay } from "streampay-sdk"`
3. Share with community
4. Collect feedback
5. Release v1.0.1, v1.1.0, etc.

**Happy publishing!** 🚀

---

*Last Updated: January 10, 2024*  
*StreamPay SDK v1.0.0*  
*License: MIT*
