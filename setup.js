const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Setting up Campus Event Management Platform...\n');

// Function to run commands
function runCommand(command, description) {
    return new Promise((resolve, reject) => {
        console.log(`📦 ${description}...`);
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Error: ${error.message}`);
                reject(error);
                return;
            }
            if (stderr) {
                console.log(`⚠️  Warning: ${stderr}`);
            }
            console.log(`✅ ${description} completed`);
            resolve();
        });
    });
}

async function setup() {
    try {
        // Install dependencies
        await runCommand('npm install', 'Installing dependencies');
        
        // Initialize database
        await runCommand('npm run init-db', 'Initializing database');
        
        // Seed sample data
        await runCommand('npm run seed-data', 'Seeding sample data');
        
        console.log('\n🎉 Setup completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Run: npm start');
        console.log('2. Open: http://localhost:3000 (Admin Dashboard)');
        console.log('3. Open: http://localhost:3000/student.html (Student Portal)');
        console.log('\n📚 Documentation:');
        console.log('- README.md: Complete setup and usage guide');
        console.log('- docs/: Detailed technical documentation');
        console.log('\n🧪 Testing:');
        console.log('- Run: node scripts/test-api.js (after starting server)');
        
    } catch (error) {
        console.error('\n💥 Setup failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure Node.js is installed (v14 or higher)');
        console.log('2. Check if port 3000 is available');
        console.log('3. Try running commands manually:');
        console.log('   - npm install');
        console.log('   - npm run init-db');
        console.log('   - npm run seed-data');
        console.log('   - npm start');
        process.exit(1);
    }
}

setup();
