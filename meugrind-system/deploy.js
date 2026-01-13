#!/usr/bin/env node

/**
 * MEUGRIND System Deployment Script
 * 
 * Handles complete build and deployment to Cloudflare Pages using Wrangler
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_NAME = 'meugrind-system';
const BUILD_DIR = 'out';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function execCommand(command, description) {
  log(`\n${colors.blue}📋 ${description}...${colors.reset}`);
  try {
    execSync(command, { stdio: 'inherit', cwd: __dirname });
    log(`${colors.green}✅ ${description} completed${colors.reset}`);
  } catch (error) {
    log(`${colors.red}❌ ${description} failed${colors.reset}`);
    process.exit(1);
  }
}

function checkPrerequisites() {
  log(`${colors.cyan}🔍 Checking prerequisites...${colors.reset}`);
  
  // Check if wrangler is installed
  try {
    execSync('wrangler --version', { stdio: 'pipe' });
    log(`${colors.green}✅ Wrangler CLI is installed${colors.reset}`);
  } catch (error) {
    log(`${colors.red}❌ Wrangler CLI not found. Please install it first:${colors.reset}`);
    log(`${colors.yellow}npm install -g wrangler${colors.reset}`);
    process.exit(1);
  }
  
  // Check if user is authenticated
  try {
    execSync('wrangler whoami', { stdio: 'pipe' });
    log(`${colors.green}✅ Wrangler is authenticated${colors.reset}`);
  } catch (error) {
    log(`${colors.red}❌ Wrangler not authenticated. Please login first:${colors.reset}`);
    log(`${colors.yellow}wrangler login${colors.reset}`);
    process.exit(1);
  }
}

function validateEnvironment() {
  log(`${colors.cyan}🔍 Validating environment variables...${colors.reset}`);
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    log(`${colors.yellow}⚠️  Missing environment variables: ${missingVars.join(', ')}${colors.reset}`);
    log(`${colors.yellow}You can set them via Cloudflare dashboard or wrangler commands${colors.reset}`);
  } else {
    log(`${colors.green}✅ All required environment variables are set${colors.reset}`);
  }
}

function cleanBuildDirectory() {
  if (fs.existsSync(BUILD_DIR)) {
    log(`${colors.yellow}🧹 Cleaning existing build directory...${colors.reset}`);
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
  }
}

function validateBuild() {
  if (!fs.existsSync(BUILD_DIR)) {
    log(`${colors.red}❌ Build directory '${BUILD_DIR}' not found${colors.reset}`);
    process.exit(1);
  }
  
  const indexPath = path.join(BUILD_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    log(`${colors.red}❌ index.html not found in build directory${colors.reset}`);
    process.exit(1);
  }
  
  log(`${colors.green}✅ Build validation passed${colors.reset}`);
}

function deployToCloudflare(environment = 'production') {
  const envFlag = environment === 'production' ? '--env production' : '--env preview';
  const projectFlag = `--project-name ${PROJECT_NAME}`;
  
  log(`\n${colors.magenta}🚀 Deploying to Cloudflare Pages (${environment})...${colors.reset}`);
  
  try {
    const command = `wrangler pages deploy ${BUILD_DIR} ${projectFlag} ${envFlag}`;
    execSync(command, { stdio: 'inherit', cwd: __dirname });
    
    log(`\n${colors.green}🎉 Deployment successful!${colors.reset}`);
    log(`${colors.cyan}Your MEUGRIND system is now live!${colors.reset}`);
    
    if (environment === 'production') {
      log(`${colors.yellow}Production URL: https://${PROJECT_NAME}.pages.dev${colors.reset}`);
    } else {
      log(`${colors.yellow}Preview URL will be shown above${colors.reset}`);
    }
    
  } catch (error) {
    log(`${colors.red}❌ Deployment failed${colors.reset}`);
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  const environment = args.includes('--preview') ? 'preview' : 'production';
  const skipBuild = args.includes('--skip-build');
  const skipTests = args.includes('--skip-tests');
  
  log(`${colors.bright}🚀 MEUGRIND System Deployment${colors.reset}`);
  log(`${colors.cyan}Environment: ${environment}${colors.reset}`);
  log(`${colors.cyan}Skip build: ${skipBuild}${colors.reset}`);
  log(`${colors.cyan}Skip tests: ${skipTests}${colors.reset}`);
  
  // Step 1: Check prerequisites
  checkPrerequisites();
  
  // Step 2: Validate environment
  validateEnvironment();
  
  if (!skipBuild) {
    // Step 3: Clean build directory
    cleanBuildDirectory();
    
    // Step 4: Run linting
    execCommand('npm run lint', 'Running ESLint');
    
    // Step 5: Run tests (if not skipped)
    if (!skipTests) {
      execCommand('npm run test -- --watchAll=false --passWithNoTests', 'Running tests');
    }
    
    // Step 6: Build for production
    execCommand('npm run build:production', 'Building for production');
    
    // Step 7: Validate build
    validateBuild();
  }
  
  // Step 8: Deploy to Cloudflare
  deployToCloudflare(environment);
  
  log(`\n${colors.green}🎯 Deployment completed successfully!${colors.reset}`);
}

// Handle errors
process.on('uncaughtException', (error) => {
  log(`${colors.red}❌ Uncaught exception: ${error.message}${colors.reset}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`${colors.red}❌ Unhandled rejection at: ${promise}, reason: ${reason}${colors.reset}`);
  process.exit(1);
});

// Run the deployment
if (require.main === module) {
  main();
}