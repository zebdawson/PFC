require('dotenv').config();
const axios = require('axios');

/**
 * Complete Configuration Helper
 * Gets ALL the IDs you need for your Replit deployment:
 * - Pipeline IDs
 * - Stage IDs
 * - User IDs (for department assignment)
 * - Location info
 */

async function getAllConfig() {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;

  if (!apiKey) {
    console.error('\n❌ Missing GHL_API_KEY in .env file\n');
    process.exit(1);
  }

  if (!locationId) {
    console.error('\n❌ Missing GHL_LOCATION_ID in .env file\n');
    process.exit(1);
  }

  const client = axios.create({
    baseURL: 'https://services.leadconnectorhq.com',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28'
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('🔧 PFC TICKETING SYSTEM - CONFIGURATION HELPER');
  console.log('='.repeat(80));
  console.log(`\n📍 Location ID: ${locationId}\n`);

  try {
    // ========================================
    // 1. GET PIPELINES
    // ========================================
    console.log('📊 STEP 1: Fetching Pipelines...\n');

    const pipelineResponse = await client.get('/opportunities/pipelines', {
      params: { locationId }
    });

    const pipelines = pipelineResponse.data.pipelines || [];
    console.log(`✅ Found ${pipelines.length} pipeline(s)\n`);

    pipelines.forEach((pipeline, index) => {
      console.log(`${index + 1}. ${pipeline.name}`);
      console.log(`   Pipeline ID: ${pipeline.id}`);
      console.log(`   Stages: ${pipeline.stages.map(s => s.name).join(' → ')}\n`);
    });

    // ========================================
    // 2. GET USERS (for department assignment)
    // ========================================
    console.log('\n' + '-'.repeat(80));
    console.log('👥 STEP 2: Fetching Team Members...\n');

    const usersResponse = await client.get('/users/', {
      params: { locationId }
    });

    const users = usersResponse.data.users || [];
    console.log(`✅ Found ${users.length} team member(s)\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || user.email || 'Unnamed User'}`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Role: ${user.role || 'N/A'}\n`);
    });

    // ========================================
    // 3. GENERATE CONFIGURATION
    // ========================================
    console.log('\n' + '='.repeat(80));
    console.log('📋 REPLIT SECRETS CONFIGURATION');
    console.log('='.repeat(80));
    console.log('\nCopy these values to your Replit Secrets:\n');

    // Find Job Requests pipeline
    const jobPipeline = pipelines.find(p =>
      p.name.toLowerCase().includes('job') ||
      p.name.toLowerCase().includes('request') ||
      p.name.toLowerCase().includes('ticket')
    ) || pipelines[0];

    if (jobPipeline) {
      console.log(`PFC_PIPELINE_ID=${jobPipeline.id}`);
      if (jobPipeline.stages && jobPipeline.stages.length > 0) {
        console.log(`PFC_DEFAULT_STAGE=${jobPipeline.stages[0].id}`);
      }
      console.log(`# Using pipeline: "${jobPipeline.name}"\n`);
    } else {
      console.log('# ⚠️ No pipelines found - create one in GHL first\n');
    }

    // Department user mapping
    console.log('# Department User IDs (assign these based on your team):');
    console.log('# You need to map each department to a user ID from the list above\n');

    users.forEach(user => {
      const name = user.name || user.email || 'Unknown';
      console.log(`# ${name}: ${user.id}`);
    });

    console.log('\nSTAFFING_USER_ID=');
    console.log('LOGISTICS_USER_ID=');
    console.log('FINANCE_USER_ID=');
    console.log('SCHEDULING_USER_ID=');
    console.log('ESOC_USER_ID=');

    // ========================================
    // 4. NEXT STEPS
    // ========================================
    console.log('\n' + '='.repeat(80));
    console.log('📝 NEXT STEPS:');
    console.log('='.repeat(80));
    console.log('\n1. Copy the values above');
    console.log('2. In Replit, click the Lock icon 🔒 (Secrets)');
    console.log('3. Paste each value as a new secret');
    console.log('4. Assign the department user IDs based on your team structure');
    console.log('5. Get your Claude API key from https://console.anthropic.com/');
    console.log('6. Add it as: ANTHROPIC_API_KEY=your-key-here');
    console.log('7. Click "Run" to restart your Repl\n');

    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Error fetching configuration:');
    console.error(`   ${error.message}`);

    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Details: ${JSON.stringify(error.response.data, null, 2)}`);
    }

    console.log('\n💡 Troubleshooting:');
    console.log('   - Verify your GHL_API_KEY is correct');
    console.log('   - Verify your GHL_LOCATION_ID is correct');
    console.log('   - Make sure the API key has proper permissions\n');

    process.exit(1);
  }
}

// Run the script
getAllConfig();
