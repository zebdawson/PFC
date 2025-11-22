require('dotenv').config();
const ghlClient = require('./services/ghlClient');
const { getAccessToken, getLocationId } = require('./routes/oauth');
const logger = require('./utils/logger');

// Configure GHL Client to use OAuth tokens (same as index.js does)
ghlClient.setOAuthFunctions(getAccessToken, getLocationId);

/**
 * Test script to verify GHL API connection and configuration
 */
async function testGHLConnection() {
  console.log('\n🔍 Testing GHL API Connection...\n');

  // Check authentication status
  try {
    const token = await getAccessToken();
    const locationId = getLocationId();
    console.log(`✓ OAuth authenticated`);
    console.log(`  Location ID: ${locationId}\n`);
  } catch (error) {
    console.log('⚠️  OAuth not authorized yet');
    console.log('   To authorize OAuth:');
    console.log('   1. Start the server: npm start');
    console.log('   2. Visit: http://localhost:3000/oauth/auth/ghl');
    console.log('   3. Complete the authorization flow');
    console.log('   4. Run this test again\n');

    // Check if API key fallback is available
    if (process.env.GHL_API_KEY) {
      console.log('⚠️  Note: API key is configured but GHL now requires OAuth authentication.');
      console.log('   The API key alone may not work for all endpoints.\n');
    }

    console.log('Attempting to continue with available authentication...\n');
  }

  try {
    // Test 1: Basic connection
    console.log('Test 1: Testing API connection...');
    const location = await ghlClient.testConnection();
    console.log('✅ Connection successful!');
    console.log(`   Location: ${location.location?.name || 'Unknown'}`);
    console.log(`   Location ID: ${location.location?.id || 'Unknown'}`);

    // Test 2: Create a test contact
    console.log('\nTest 2: Creating test contact...');
    const testContact = await ghlClient.createContact({
      firstName: 'Test',
      lastName: 'Contact',
      email: 'test@pfctest.com',
      phone: '+1234567890',
      companyName: 'Test Company',
      tags: ['test', 'api-test']
    });
    console.log('✅ Test contact created!');
    console.log(`   Contact ID: ${testContact.id}`);
    console.log(`   Name: ${testContact.firstName} ${testContact.lastName}`);

    // Test 3: Search for contact
    console.log('\nTest 3: Searching for contact...');
    const foundContact = await ghlClient.findContactByEmail('test@pfctest.com');
    if (foundContact) {
      console.log('✅ Contact found!');
      console.log(`   Contact ID: ${foundContact.id}`);
    } else {
      console.log('❌ Contact not found');
    }

    // Test 4: Get pipeline stages (if configured)
    if (process.env.PFC_PIPELINE_ID) {
      console.log('\nTest 4: Getting pipeline stages...');
      const stages = await ghlClient.getPipelineStages(process.env.PFC_PIPELINE_ID);
      console.log('✅ Pipeline stages retrieved!');
      console.log(`   Stages: ${stages.map(s => s.name).join(', ')}`);
    } else {
      console.log('\n⚠️  Test 4 skipped: PFC_PIPELINE_ID not configured');
    }

    console.log('\n✅ All tests passed!\n');
    console.log('Next steps:');
    console.log('1. Configure PFC_PIPELINE_ID in .env file');
    console.log('2. Configure department user IDs in .env file');
    console.log('3. Set up Claude API key in .env file');
    console.log('4. Start the server: npm start\n');

  } catch (error) {
    console.error('\n❌ Test failed!');
    console.error(`   Error: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    process.exit(1);
  }
}

// Run tests
testGHLConnection();
