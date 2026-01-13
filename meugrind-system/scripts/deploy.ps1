# MEUGRIND System Deployment Script (PowerShell)
# This script handles local deployment testing and validation

param(
    [switch]$SkipTests = $false
)

Write-Host "🚀 Starting MEUGRIND System Deployment Process..." -ForegroundColor Green

function Write-Success {
    param($Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Error "package.json not found. Please run this script from the meugrind-system directory."
    exit 1
}

# Check Node.js version
$nodeVersion = node --version
Write-Success "Node.js version: $nodeVersion"

# Check if environment variables are set
if (-not $env:NEXT_PUBLIC_SUPABASE_URL) {
    Write-Warning "NEXT_PUBLIC_SUPABASE_URL not set. Make sure to configure environment variables."
}

try {
    # Install dependencies
    Write-Success "Installing dependencies..."
    npm ci
    if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }

    # Run linting
    Write-Success "Running ESLint..."
    npm run lint
    if ($LASTEXITCODE -ne 0) { throw "Linting failed" }

    if (-not $SkipTests) {
        # Run tests
        Write-Success "Running unit tests..."
        npm run test -- --watchAll=false
        if ($LASTEXITCODE -ne 0) { throw "Unit tests failed" }

        Write-Success "Running property-based tests..."
        npm run test:property -- --watchAll=false
        if ($LASTEXITCODE -ne 0) { throw "Property tests failed" }
    } else {
        Write-Warning "Skipping tests as requested"
    }

    # Build for production
    Write-Success "Building for production..."
    npm run build:production
    if ($LASTEXITCODE -ne 0) { throw "Build failed" }

    # Validate build output
    if (-not (Test-Path "out")) {
        Write-Error "Build output directory 'out' not found!"
        exit 1
    }

    Write-Success "Build output directory created successfully"

    # Check critical files
    $criticalFiles = @("out/index.html", "out/manifest.json", "out/_next")
    foreach ($file in $criticalFiles) {
        if (-not (Test-Path $file)) {
            Write-Error "Critical file/directory missing: $file"
            exit 1
        }
    }

    Write-Success "All critical files present"

    # Check PWA files
    if (Test-Path "out/sw.js") {
        Write-Success "Service worker found"
    } else {
        Write-Warning "Service worker not found - PWA functionality may be limited"
    }

    # Check bundle size
    $buildSize = (Get-ChildItem -Path "out" -Recurse | Measure-Object -Property Length -Sum).Sum
    $buildSizeMB = [math]::Round($buildSize / 1MB, 2)
    Write-Success "Total build size: $buildSizeMB MB"

    Write-Host ""
    Write-Host "🎉 Deployment preparation complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Commit and push your changes to trigger GitHub Actions"
    Write-Host "2. Or manually deploy the 'out' directory to Cloudflare Pages"
    Write-Host "3. Configure environment variables in Cloudflare Pages dashboard"
    Write-Host ""
    Write-Host "Build output is ready in the 'out' directory"

} catch {
    Write-Error "Deployment preparation failed: $_"
    exit 1
}