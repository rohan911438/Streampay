@echo off
REM StreamPay SDK - Automated Publishing Script
REM This script will guide you through publishing to npm

echo.
echo ============================================================
echo     StreamPay SDK - npm Publishing Helper
echo ============================================================
echo.

REM Check if npm is installed
echo Checking npm installation...
cmd /c npm -v >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if logged in
echo.
echo Checking npm authentication...
cmd /c npm whoami >nul 2>&1
if errorlevel 1 (
    echo.
    echo You are NOT logged in to npm.
    echo.
    echo Opening npm login browser...
    echo.
    call npm login
    
    REM Verify login
    cmd /c npm whoami >nul 2>&1
    if errorlevel 1 (
        echo.
        echo ERROR: Login failed. Please try again.
        pause
        exit /b 1
    )
) else (
    echo ✓ Already logged in to npm
)

REM Get current username
for /f "delims=" %%i in ('npm whoami') do set NPM_USER=%%i
echo ✓ Logged in as: %NPM_USER%

REM Change to SDK directory
echo.
echo Navigating to SDK directory...
cd /d "%~dp0"
if errorlevel 1 (
    echo ERROR: Could not navigate to SDK directory
    pause
    exit /b 1
)

REM Verify package.json exists
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo This script must be run from the SDK root directory
    pause
    exit /b 1
)

REM Show current version
for /f "tokens=2 delims=: " %%i in ('findstr "\"version\"" package.json') do (
    set VERSION=%%i
)
set VERSION=%VERSION:,=%
set VERSION=%VERSION:"=%
echo Current version: %VERSION%

REM Build the SDK
echo.
echo Building SDK...
echo ============================================================
call npm run build
if errorlevel 1 (
    echo.
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo ✓ Build successful

REM Type check
echo.
echo Type checking...
call npm run typecheck
if errorlevel 1 (
    echo.
    echo ERROR: Type check failed!
    pause
    exit /b 1
)
echo ✓ Type check successful

REM Preview what will be published
echo.
echo ============================================================
echo Preview of files to be published:
echo ============================================================
echo.
call npm pack --dry-run

REM Ask for confirmation
echo.
echo ============================================================
set /p CONFIRM="Ready to publish? (yes/no): "

if /i "%CONFIRM%" neq "yes" (
    echo Publishing cancelled.
    pause
    exit /b 0
)

REM Publish to npm
echo.
echo Publishing to npm...
echo ============================================================
call npm publish --access public

if errorlevel 1 (
    echo.
    echo ERROR: Publishing failed!
    echo Please check the error message above.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo ✓ SUCCESS! Package published to npm
echo ============================================================
echo.
echo Your package is now available at:
echo https://www.npmjs.com/package/streampay-sdk
echo.
echo You can install it with:
echo npm install streampay-sdk
echo.
pause
