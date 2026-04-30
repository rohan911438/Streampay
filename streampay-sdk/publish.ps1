#!/usr/bin/env pwsh
<#
StreamPay SDK - npm Publishing Script
Automated script to build and publish the SDK to npm
#>

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "     StreamPay SDK - npm Publishing Helper" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if npm is installed
Write-Host "Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm -v 2>&1
    Write-Host "✓ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: npm is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if logged in
Write-Host ""
Write-Host "Checking npm authentication..." -ForegroundColor Yellow
try {
    $npmUser = npm whoami 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Logged in as: $npmUser" -ForegroundColor Green
    } else {
        throw "Not logged in"
    }
} catch {
    Write-Host "You are NOT logged in to npm." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opening npm login in browser..." -ForegroundColor Yellow
    Write-Host ""
    
    npm login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Login failed!" -ForegroundColor Red
        exit 1
    }
    
    $npmUser = npm whoami 2>&1
    Write-Host "✓ Logged in as: $npmUser" -ForegroundColor Green
}

# Change to SDK directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Verify package.json exists
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found!" -ForegroundColor Red
    Write-Host "This script must be run from the SDK root directory" -ForegroundColor Red
    exit 1
}

# Get current version
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$version = $packageJson.version
Write-Host "Current version: $version" -ForegroundColor Cyan

# Build the SDK
Write-Host ""
Write-Host "Building SDK..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build successful" -ForegroundColor Green

# Type check
Write-Host ""
Write-Host "Type checking..." -ForegroundColor Yellow
npm run typecheck
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Type check failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Type check successful" -ForegroundColor Green

# Preview what will be published
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Preview of files to be published:" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
npm pack --dry-run

# Ask for confirmation
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
$confirm = Read-Host "Ready to publish to npm? (yes/no)"

if ($confirm -ine "yes") {
    Write-Host "Publishing cancelled." -ForegroundColor Yellow
    exit 0
}

# Publish to npm
Write-Host ""
Write-Host "Publishing to npm..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
npm publish --access public

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Publishing failed!" -ForegroundColor Red
    Write-Host "Please check the error message above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "✓ SUCCESS! Package published to npm" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your package is now available at:" -ForegroundColor Cyan
Write-Host "https://www.npmjs.com/package/streampay-sdk" -ForegroundColor Green
Write-Host ""
Write-Host "You can install it with:" -ForegroundColor Cyan
Write-Host "npm install streampay-sdk" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to exit"
