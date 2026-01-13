#!/bin/bash

# MEUGRIND System - Wrangler Deployment Script
# Deploy to Cloudflare Pages using Wrangler CLI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Parse command line arguments
ENVIRONMENT="production"
SKIP_TESTS=false
SKIP_BUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --env ENVIRONMENT    Deploy to environment (production|preview) [default: production]"
            echo "  --skip-tests         Skip running tests before deployment"
            echo "  --skip-build         Skip build step (use existing build)"
            echo "  --help               Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

print_header "🚀 MEUGRIND System - Wrangler Deployment"
print_info "Environment: $ENVIRONMENT"
print_info "Skip tests: $SKIP_TESTS"
print_info "Skip build: $SKIP_BUILD"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the meugrind-system directory."
    exit 1
fi

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    print_error "Wrangler CLI not found. Please install it:"
    echo "npm install -g wrangler"
    echo "or"
    echo "npm install wrangler --save-dev"
    exit 1
fi

# Check wrangler authentication
print_info "Checking Wrangler authentication..."
if ! wrangler whoami &> /dev/null; then
    print_warning "Not authenticated with Cloudflare. Please run:"
    echo "wrangler login"
    exit 1
fi

WRANGLER_USER=$(wrangler whoami 2>/dev/null | head -n 1 || echo "Unknown")
print_status "Authenticated as: $WRANGLER_USER"

# Check Node.js version
NODE_VERSION=$(node --version)
print_status "Node.js version: $NODE_VERSION"

# Check environment variables
print_info "Checking environment variables..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    print_warning "NEXT_PUBLIC_SUPABASE_URL not set locally. Make sure it's configured in Cloudflare Pages."
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    print_warning "NEXT_PUBLIC_SUPABASE_ANON_KEY not set locally. Make sure it's configured in Cloudflare Pages."
fi

# Install dependencies
print_status "Installing dependencies..."
npm ci

if [ "$SKIP_TESTS" = false ]; then
    # Run linting
    print_status "Running ESLint..."
    npm run lint

    # Run tests
    print_status "Running unit tests..."
    npm run test -- --watchAll=false

    print_status "Running property-based tests..."
    npm run test:property -- --watchAll=false
else
    print_warning "Skipping tests as requested"
fi

if [ "$SKIP_BUILD" = false ]; then
    # Build for production
    print_status "Building for production..."
    npm run build:production

    # Validate build output
    if [ ! -d "out" ]; then
        print_error "Build output directory 'out' not found!"
        exit 1
    fi

    print_status "Build output directory created successfully"

    # Check critical files
    CRITICAL_FILES=("out/index.html" "out/manifest.json")
    for file in "${CRITICAL_FILES[@]}"; do
        if [ ! -e "$file" ]; then
            print_error "Critical file missing: $file"
            exit 1
        fi
    done

    print_status "All critical files present"
else
    print_warning "Skipping build as requested"
    if [ ! -d "out" ]; then
        print_error "Build output directory 'out' not found! Cannot skip build."
        exit 1
    fi
fi

# Deploy with Wrangler
print_header "🌐 Deploying to Cloudflare Pages..."

if [ "$ENVIRONMENT" = "production" ]; then
    print_info "Deploying to production environment..."
    wrangler pages deploy out --project-name=meugrind-system --env=production
elif [ "$ENVIRONMENT" = "preview" ]; then
    print_info "Deploying to preview environment..."
    wrangler pages deploy out --project-name=meugrind-system --env=preview
else
    print_error "Invalid environment: $ENVIRONMENT. Use 'production' or 'preview'."
    exit 1
fi

if [ $? -eq 0 ]; then
    print_status "Deployment successful!"
    echo ""
    print_header "🎉 Deployment Complete!"
    echo ""
    
    if [ "$ENVIRONMENT" = "production" ]; then
        echo "🌍 Production URL: https://meugrind-system.pages.dev"
    else
        echo "🔍 Preview URL: Check the Wrangler output above for the preview URL"
    fi
    
    echo ""
    echo "Next steps:"
    echo "1. Test the deployed application"
    echo "2. Verify PWA installation works"
    echo "3. Test offline functionality"
    echo "4. Check Supabase integration"
    echo ""
    echo "Monitor your deployment at: https://dash.cloudflare.com/pages"
else
    print_error "Deployment failed!"
    exit 1
fi