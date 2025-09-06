const { initDatabase } = require('../database/init');

// Test API endpoints
async function testAPI() {
    console.log('🧪 Starting API tests...');
    
    try {
        // Test health endpoint
        console.log('1. Testing health endpoint...');
        const healthResponse = await fetch('http://localhost:3000/api/health');
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthData.message);
        
        // Test events endpoint
        console.log('2. Testing events endpoint...');
        const eventsResponse = await fetch('http://localhost:3000/api/events');
        const eventsData = await eventsResponse.json();
        console.log(`✅ Events count: ${eventsData.data.length}`);
        
        // Test students endpoint
        console.log('3. Testing students endpoint...');
        const studentsResponse = await fetch('http://localhost:3000/api/students');
        const studentsData = await studentsResponse.json();
        console.log(`✅ Students count: ${studentsData.data.length}`);
        
        // Test registrations endpoint
        console.log('4. Testing registrations endpoint...');
        const registrationsResponse = await fetch('http://localhost:3000/api/registrations');
        const registrationsData = await registrationsResponse.json();
        console.log(`✅ Registrations count: ${registrationsData.data.length}`);
        
        // Test reports endpoint
        console.log('5. Testing reports endpoint...');
        const reportsResponse = await fetch('http://localhost:3000/api/reports/event-popularity');
        const reportsData = await reportsResponse.json();
        console.log(`✅ Event popularity report: ${reportsData.data.length} events`);
        
        console.log('🎉 All API tests passed!');
        
    } catch (error) {
        console.error('❌ API test failed:', error.message);
        console.log('Make sure the server is running on http://localhost:3000');
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    testAPI();
}

module.exports = { testAPI };
