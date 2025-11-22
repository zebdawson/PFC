const axios = require('axios');

const CLIENT_ID = '69213dae069722677a745910-mi9t4nId';
const CLIENT_SECRET = 'bfd6e333-dbf2-4621-bfb6-3a3a985d3fa9';
const LOCATION_ID = '7p8fgVVr84S9fxsJqMdA';

async function testOAuthCredentials() {
  console.log('Testing OAuth credentials...\n');

  // Step 1: Build authorization URL
  const authUrl = `https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&client_id=${CLIENT_ID}&scope=contacts.readonly contacts.write opportunities.readonly opportunities.write conversations.readonly conversations.write`;

  console.log('Authorization URL:');
  console.log(authUrl);
  console.log('\n1. Open this URL in your browser');
  console.log('2. Authorize the app');
  console.log('3. You will be redirected to a URL with a "code" parameter');
  console.log('4. Copy that code and we\'ll exchange it for an access token\n');
}

testOAuthCredentials();
