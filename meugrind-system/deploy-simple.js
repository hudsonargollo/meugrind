#!/usr/bin/env node

/**
 * Simple deployment script for MEUGRIND System
 * This creates a basic static build for deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Creating simple deployment build...');

// Create out directory
const outDir = path.join(__dirname, 'out');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Create a simple index.html
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MEUGRIND Productivity System</title>
    <link rel="manifest" href="/manifest.json">
    <link rel="icon" href="/icon.svg">
    <meta name="theme-color" content="#000000">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container {
            text-align: center;
            max-width: 600px;
            padding: 2rem;
        }
        .logo {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 1rem;
        }
        .subtitle {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        .status {
            background: rgba(255, 255, 255, 0.1);
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 2rem;
        }
        .btn {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            text-decoration: none;
            display: inline-block;
            margin: 0.5rem;
            transition: all 0.3s ease;
        }
        .btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 2rem;
        }
        .feature {
            background: rgba(255, 255, 255, 0.1);
            padding: 1rem;
            border-radius: 6px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">MEUGRIND</div>
        <div class="subtitle">Offline-First Productivity System</div>
        
        <div class="status">
            <h3>🚀 Deployment Successful!</h3>
            <p>Your MEUGRIND productivity system is now live on Cloudflare Pages.</p>
        </div>

        <div class="features">
            <div class="feature">
                <h4>📱 PWA Ready</h4>
                <p>Install on any device for offline access</p>
            </div>
            <div class="feature">
                <h4>🎵 Band Management</h4>
                <p>Setlists, tech riders, and performance logistics</p>
            </div>
            <div class="feature">
                <h4>📈 Influencer CRM</h4>
                <p>Brand deals, content pipeline, and metrics</p>
            </div>
            <div class="feature">
                <h4>☀️ Solar CRM</h4>
                <p>Lead management and sales pipeline</p>
            </div>
            <div class="feature">
                <h4>🍅 Pomodoro Timer</h4>
                <p>Focus sessions and productivity tracking</p>
            </div>
            <div class="feature">
                <h4>🔄 Offline Sync</h4>
                <p>Works without internet, syncs when connected</p>
            </div>
        </div>

        <div style="margin-top: 2rem;">
            <a href="#" class="btn" onclick="installPWA()">📱 Install App</a>
            <a href="https://github.com/your-username/meugrind-system" class="btn">📚 Documentation</a>
        </div>
    </div>

    <script>
        // PWA Installation
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
        });

        function installPWA() {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                    }
                    deferredPrompt = null;
                });
            } else {
                alert('To install this app, use your browser\\'s "Add to Home Screen" option.');
            }
        }

        // Service Worker Registration
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                        console.log('SW registered: ', registration);
                    })
                    .catch((registrationError) => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }
    </script>
</body>
</html>`;

// Write index.html
fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml);

// Copy manifest.json and other static files
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  const files = fs.readdirSync(publicDir);
  files.forEach(file => {
    const srcPath = path.join(publicDir, file);
    const destPath = path.join(outDir, file);
    if (fs.statSync(srcPath).isFile()) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✓ Copied ${file}`);
    }
  });
}

// Create a simple 404.html
const notFoundHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Not Found - MEUGRIND</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            text-align: center;
        }
        .container {
            max-width: 400px;
            padding: 2rem;
        }
        .error-code {
            font-size: 4rem;
            font-weight: bold;
            margin-bottom: 1rem;
        }
        .btn {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            text-decoration: none;
            display: inline-block;
            margin-top: 1rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-code">404</div>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist.</p>
        <a href="/" class="btn">← Back to Home</a>
    </div>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, '404.html'), notFoundHtml);

console.log('✅ Simple deployment build created successfully!');
console.log('📁 Build output: ./out/');
console.log('🌐 Ready for deployment to Cloudflare Pages');