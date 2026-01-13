#!/bin/bash

# MEUGRIND System Deployment Script
# This script handles local deployment testing and validation

set -e

echo "🚀 Starting MEUGRIND System Deployment Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the meugrind-system directory."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version)
print_status "Node.js version: $NODE_VERSION"

# Check if environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    print_warning "NEXT_PUBLIC_SUPABASE_URL not set. Make sure to configure environment variables."
fi

# Install dependencies
print_status "Installing dependencies..."
npm ci

# Run linting
print_status "Running ESLint..."
npm run lint

# Run tests
print_status "Running unit tests..."
npm run test -- --watchAll=false

print_status "Running property-based tests..."
npm run test:property -- --watchAll=false

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
CRITICAL_FILES=("out/index.html" "out/manifest.json" "out/_next")
for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -e "$file" ]; then
        print_error "Critical file/directory missing: $file"
        exit 1
    fi
done

print_status "All critical files present"

# Check PWA files
if [ -f "out/sw.js" ]; then
    print_status "Service worker found"
else
    print_warning "Service worker not found - PWA functionality may be limited"
fi

# Validate manifest.json
if command -v jq &> /dev/null; then
    if jq empty out/manifest.json 2>/dev/null; then
        print_status "manifest.json is valid JSON"
    else
        print_error "manifest.json is invalid JSON"
        exit 1
    fi
else
    print_warning "jq not installed - skipping manifest.json validation"
fi

# Check bundle size (if analyzer is available)
if [ -d ".next/analyze" ]; then
    print_status "Bundle analysis available in .next/analyze/"
fi

# Final validation
TOTAL_SIZE=$(du -sh out | cut -f1)
print_status "Total build size: $TOTAL_SIZE"

echo ""
echo "🎉 Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Commit and push your changes to trigger GitHub Actions"
echo "2. Or manually deploy the 'out' directory to Cloudflare Pages"
echo "3. Configure environment variables in Cloudflare Pages dashboard"
echo ""
echo "Build output is ready in the 'out' directory"