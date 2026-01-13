# MEUGRIND System - Wrangler Deployment Script (PowerShell)
# Deploy to Cloudflare Pages using Wrangler CLI

param(
    [string]$Environment = "production",
    [switch]$SkipTests = $false,
    [switch]$SkipBuild = $false,
    [switch]$Help = $false
)

function Write-Success {
    param($Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Info {
    param($Message)
    Write-Host "ℹ $Message" -ForegroundColor Blue
}

function Write-Warning {
    param($Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Header {
    param($Message)
    Write-Host $Message -ForegroundColor Blue
}

if ($Help) {
    Write-Host "Usage: .\wrangler-deploy.ps1 [OPTIONS]"
    Write-Host "Options:"
    Write-Host "  -Environment ENVIRONMENT    Deploy to environment (production|preview) [default: production]"
    Write-Host "  -SkipTests                  Skip running tests before deployment"
    Write-Host "  -SkipBuild                  Skip build step (use existing build)"
    Write-Host "  -Help                       Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\wrangler-deploy.ps1                           # Deploy to production"
    Write-Host "  .\wrangler-deploy.ps1 -Environment preview      # Deploy to preview"
    Write-Host "  .\wrangler-deploy.ps1 -SkipTests               # Skip tests"
    exit 0
}

Write-Header "🚀 MEUGRIND System - Wrangler Deployment"
Write-Info "Environment: $Environment"
Write-Info "Skip tests: $SkipTests"
Write-Info "Skip build: $SkipBuild"
Write-Host ""

try {
    # Check if we're in the right directory
    if (-not (Test-Path "package.json")) {
        Write-Error "package.json not found. Please run this script from the meugrind-system directory."
        exit 1
    }

    # Check if wrangler is installed
    try {
        $wranglerVersion = wrangler --version 2>$null
        Write-Success "Wrangler CLI found: $wranglerVersion"
    } catch {
        Write-Error "Wrangler CLI not found. Please install it:"
        Write-Host "npm install -g wrangler"
        Write-Host "or"
        Write-Host "npm install wrangler --save-dev"
        exit 1
    }

    # Check wrangler authentication
    Write-Info "Checking Wrangler authentication..."
    try {
        $wranglerUser = wrangler whoami 2>$null | Select-Object -First 1
        if ($LASTEXITCODE -ne 0) {
            throw "Not authenticated"
        }
        Write-Success "Authenticated as: $wranglerUser"
    } catch {
        Write-Warning "Not authenticated with Cloudflare. Please run:"
        Write-Host "wrangler login"
        exit 1
    }

    # Check Node.js version
    $nodeVersion = node --version
    Write-Success "Node.js version: $nodeVersion"

    # Check environment variables
    Write-Info "Checking environment variables..."
    if (-not $env:NEXT_PUBLIC_SUPABASE_URL) {
        Write-Warning "NEXT_PUBLIC_SUPABASE_URL not set locally. Make sure it's configured in Cloudflare Pages."
    }

    if (-not $env:NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        Write-Warning "NEXT_PUBLIC_SUPABASE_ANON_KEY not set locally. Make sure it's configured in Cloudflare Pages."
    }

    # Install dependencies
    Write-Success "Installing dependencies..."
    npm ci
    if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }

    if (-not $SkipTests) {
        # Run linting
        Write-Success "Running ESLint..."
        npm run lint
        if ($LASTEXITCODE -ne 0) { throw "Linting failed" }

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

    if (-not $SkipBuild) {
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
        $criticalFiles = @("out/index.html", "out/manifest.json")
        foreach ($file in $criticalFiles) {
            if (-not (Test-Path $file)) {
                Write-Error "Critical file missing: $file"
                exit 1
            }
        }

        Write-Success "All critical files present"
    } else {
        Write-Warning "Skipping build as requested"
        if (-not (Test-Path "out")) {
            Write-Error "Build output directory 'out' not found! Cannot skip build."
            exit 1
        }
    }

    # Deploy with Wrangler
    Write-Header "🌐 Deploying to Cloudflare Pages..."

    if ($Environment -eq "production") {
        Write-Info "Deploying to production environment..."
        wrangler pages deploy out --project-name=meugrind-system --env=production
    } elseif ($Environment -eq "preview") {
        Write-Info "Deploying to preview environment..."
        wrangler pages deploy out --project-name=meugrind-system --env=preview
    } else {
        Write-Error "Invalid environment: $Environment. Use 'production' or 'preview'."
        exit 1
    }

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Deployment successful!"
        Write-Host ""
        Write-Header "🎉 Deployment Complete!"
        Write-Host ""
        
        if ($Environment -eq "production") {
            Write-Host "🌍 Production URL: https://meugrind-system.pages.dev" -ForegroundColor Green
        } else {
            Write-Host "🔍 Preview URL: Check the Wrangler output above for the preview URL" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "Next steps:"
        Write-Host "1. Test the deployed application"
        Write-Host "2. Verify PWA installation works"
        Write-Host "3. Test offline functionality"
        Write-Host "4. Check Supabase integration"
        Write-Host ""
        Write-Host "Monitor your deployment at: https://dash.cloudflare.com/pages"
    } else {
        Write-Error "Deployment failed!"
        exit 1
    }

} catch {
    Write-Error "Deployment failed: $_"
    exit 1
}