const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEPLOY_DIR = path.join(PROJECT_ROOT, 'deploy');
const PACKAGE_NAME = 'spideradmin-deploy.tar.gz';

console.log('🚀 Creating deployment package...\n');

// Step 1: Run build
console.log('📦 Building frontend...');
try {
  execSync('npm run build', { stdio: 'inherit', cwd: PROJECT_ROOT });
  console.log('✅ Frontend build complete\n');
} catch (err) {
  console.error('❌ Build failed:', err.message);
  process.exit(1);
}

// Step 2: Clean and create deploy directory
console.log('📁 Preparing deployment directory...');
if (fs.existsSync(DEPLOY_DIR)) {
  fs.rmSync(DEPLOY_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DEPLOY_DIR, { recursive: true });
console.log('✅ Deployment directory ready\n');

// Step 3: Copy necessary files
console.log('📋 Copying files...');

// Copy dist folder (built frontend)
copyRecursive(path.join(PROJECT_ROOT, 'dist'), path.join(DEPLOY_DIR, 'dist'));
console.log('  ✓ dist/');

// Copy server folder
copyRecursive(path.join(PROJECT_ROOT, 'server'), path.join(DEPLOY_DIR, 'server'));
console.log('  ✓ server/');

// Copy package files
fs.copyFileSync(
  path.join(PROJECT_ROOT, 'package.json'),
  path.join(DEPLOY_DIR, 'package.json')
);
console.log('  ✓ package.json');

fs.copyFileSync(
  path.join(PROJECT_ROOT, 'package-lock.json'),
  path.join(DEPLOY_DIR, 'package-lock.json')
);
console.log('  ✓ package-lock.json');

// Copy .env.production if it exists
const envProdPath = path.join(PROJECT_ROOT, '.env.production');
if (fs.existsSync(envProdPath)) {
  fs.copyFileSync(envProdPath, path.join(DEPLOY_DIR, '.env.production'));
  console.log('  ✓ .env.production');
} else {
  console.log('  ⚠️  .env.production not found (skipping)');
}

// Create deployment instructions
const deployInstructions = `# Deployment Instructions

## Prerequisites
- Node.js 20 or higher
- Environment variables configured

## Deployment Steps

1. Extract the package:
   \`\`\`bash
   tar -xzf ${PACKAGE_NAME}
   cd spideradmin-deploy
   \`\`\`

2. Install production dependencies:
   \`\`\`bash
   npm ci --omit=dev
   \`\`\`

3. Configure environment variables:
   - Edit .env.production or set environment variables
   - Required variables:
     - BACKEND_BASE_URL: Backend API URL (default: http://localhost:7071)
     - BACKEND_API_TOKEN: Token for backend authentication
     - BFF_PORT: Port for BFF server (default: 4000)
     - BFF_DEV_AUTH_TOKEN: (Optional) Token for dev auth gate

4. Start the application:
   \`\`\`bash
   NODE_ENV=production node server/index.cjs
   \`\`\`

   Or use PM2 for process management:
   \`\`\`bash
   pm2 start server/index.cjs --name spideradmin -i max
   \`\`\`

## Health Check
Access http://localhost:4000/health to verify the server is running.

## Application Access
The admin UI will be available at http://localhost:4000
`;

fs.writeFileSync(path.join(DEPLOY_DIR, 'DEPLOY.md'), deployInstructions);
console.log('  ✓ DEPLOY.md\n');

// Step 4: Create tarball
console.log('🗜️  Creating package...');
try {
  execSync(`tar -czf ${PACKAGE_NAME} -C deploy .`, {
    stdio: 'inherit',
    cwd: PROJECT_ROOT
  });
  console.log(`✅ Package created: ${PACKAGE_NAME}\n`);
} catch (err) {
  console.error('❌ Failed to create tarball:', err.message);
  process.exit(1);
}

// Step 5: Show package info
const stats = fs.statSync(path.join(PROJECT_ROOT, PACKAGE_NAME));
const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

console.log('📊 Package Details:');
console.log(`  File: ${PACKAGE_NAME}`);
console.log(`  Size: ${sizeInMB} MB`);
console.log(`  Location: ${PROJECT_ROOT}/${PACKAGE_NAME}\n`);

console.log('🎉 Deployment package ready!');
console.log('\n📖 Next steps:');
console.log(`  1. Upload ${PACKAGE_NAME} to your server`);
console.log(`  2. Follow instructions in DEPLOY.md (included in package)`);
console.log(`  3. Run: tar -xzf ${PACKAGE_NAME} && npm ci --omit=dev`);
console.log(`  4. Start: NODE_ENV=production node server/index.cjs`);

// Helper function to copy directories recursively
function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`Source path does not exist: ${src}`);
  }

  const stats = fs.statSync(src);

  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}
