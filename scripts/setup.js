const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up FAFF v0 - Internal Ticketing & Chat System');

try {
  const nodeVersion = process.version;
  console.log(`✅ Node.js ${nodeVersion} detected`);

  // Check if npm is available
  try {
    execSync('npm --version', { stdio: 'pipe' });
    console.log('✅ npm is available');
  } catch (error) {
    console.error('❌ npm is not available in PATH');
    process.exit(1);
  }

  console.log('📦 Installing root dependencies...');
  execSync('npm install --no-package-lock', { stdio: 'inherit' });
  
  console.log('🖥️  Setting up server...');
  if (fs.existsSync('server')) {
    process.chdir('server');
    execSync('npm install', { stdio: 'inherit' });
    process.chdir('..');
  } else {
    console.log('⚠️  Server directory not found, skipping server setup');
  }
  
  console.log('🌐 Setting up client...');
  if (fs.existsSync('client')) {
    process.chdir('client');
    execSync('npm install', { stdio: 'inherit' });
    process.chdir('..');
  } else {
    console.log('⚠️  Client directory not found, skipping client setup');
  }

  // Create environment files
  if (!fs.existsSync('.env')) {
    console.log('📄 Creating .env file...');
    fs.writeFileSync('.env', `DATABASE_URL=sqlite:./database.sqlite
ANTHROPIC_API_KEY=your_anthropic_api_key_here

PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=http://localhost:3000
QA_ENABLED=true
LINK_VALIDATION_ENABLED=true
LOG_LEVEL=info`);
    console.log('⚠️  Please update .env with your Anthropic API key');
  }

  if (!fs.existsSync('client/.env')) {
    console.log('📄 Creating client .env file...');
    if (!fs.existsSync('client')) {
      fs.mkdirSync('client', { recursive: true });
    }
    fs.writeFileSync('client/.env', `REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_ENVIRONMENT=development`);
  }

  if (!fs.existsSync('server/.env')) {
    console.log('📄 Creating server .env file...');
    if (!fs.existsSync('server')) {
      fs.mkdirSync('server', { recursive: true });
    }
    fs.writeFileSync('server/.env', `PORT=5000
NODE_ENV=development
DATABASE_URL=sqlite:./database.sqlite
ANTHROPIC_API_KEY=your_anthropic_api_key_here
JWT_SECRET=8f2e6c1a4b5d9e7f3a2c8b9e5f1d4a7c6b8e2f5a9c1d7e3b6f8a2e5c9f1b4d7a3c8e6f2b5a9d1c7e4f8b2a5c9e1d7f3b6a8c2e5f9b1d4a7c3e6f8b2a5c9e1d7f4a6b8c2e5f9b1d4a7c3e6f8b2a5c9e1d7f3a6b8c2e5f9b1d4a7c3e6f8b
CORS_ORIGIN=http://localhost:3000
QA_ENABLED=true
LINK_VALIDATION_ENABLED=true
LOG_LEVEL=info`);
  }

  // Setup database (only if server exists and has the required scripts)
  if (fs.existsSync('server/package.json')) {
    try {
      console.log('🗄️  Setting up database...');
      process.chdir('server');
      
      // Check if the database scripts exist
      const serverPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      if (serverPackage.scripts && serverPackage.scripts['db:migrate']) {
        execSync('npm run db:migrate', { stdio: 'inherit' });
        if (serverPackage.scripts['db:seed']) {
          execSync('npm run db:seed', { stdio: 'inherit' });
        }
      } else {
        console.log('⚠️  Database scripts not found, skipping database setup');
      }
      
      process.chdir('..');
    } catch (error) {
      console.log('⚠️  Database setup skipped (will be configured later)');
      process.chdir('..');
    }
  }

  console.log('✅ Setup complete!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Add your source code files to client/src and server/src directories');
  console.log('2. Update .env with your Anthropic API key');
  console.log('3. Run "npm run dev" to start both client and server');
  console.log('4. Open http://localhost:3000 in your browser');
  console.log('');
  console.log('🔧 Available commands:');
  console.log('- npm run dev          # Start both client and server');
  console.log('- npm run dev:client   # Start only client');
  console.log('- npm run dev:server   # Start only server');

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  console.log('');
  console.log('🔧 Manual setup steps:');
  console.log('1. cd server && npm install');
  console.log('2. cd ../client && npm install');
  console.log('3. Update .env files with your configuration');
  process.exit(1);
}