require('dotenv').config();
const axios = require('axios');

/**
 * Script to fetch all pipelines and stages from GHL
 * This will help you get the Pipeline ID and Stage IDs you need
 */
async function getPipelineInfo() {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;

  const client = axios.create({
    baseURL: 'https://services.leadconnectorhq.com',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28'
    }
  });

  console.log('\n🔍 Fetching Pipeline Information from GHL...\n');
  console.log(`📍 Location ID: ${locationId}\n`);

  try {
    // Fetch ALL pipelines for this location
    const response = await client.get(`/opportunities/pipelines`, {
      params: {
        locationId: locationId
      }
    });

    const pipelines = response.data.pipelines || [];

    console.log(`✅ Found ${pipelines.length} pipeline(s)\n`);
    console.log('=' .repeat(80));

    pipelines.forEach((pipeline, index) => {
      console.log(`\n${index + 1}. PIPELINE: ${pipeline.name}`);
      console.log(`   Pipeline ID: ${pipeline.id}`);
      console.log(`   Stages (${pipeline.stages.length}):`);

      pipeline.stages.forEach((stage, stageIndex) => {
        console.log(`      ${stageIndex + 1}. ${stage.name}`);
        console.log(`         Stage ID: ${stage.id}`);
      });

      console.log('\n   ' + '-'.repeat(76));
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n📋 CONFIGURATION GUIDE:');
    console.log('\nTo configure your middleware, add these to Replit Secrets:\n');

    // Find "Job Requests" pipeline or use first one
    const jobPipeline = pipelines.find(p =>
      p.name.toLowerCase().includes('job') ||
      p.name.toLowerCase().includes('request') ||
      p.name.toLowerCase().includes('ticket')
    ) || pipelines[0];

    if (jobPipeline) {
      console.log(`PFC_PIPELINE_ID=${jobPipeline.id}`);

      if (jobPipeline.stages && jobPipeline.stages.length > 0) {
        console.log(`PFC_DEFAULT_STAGE=${jobPipeline.stages[0].id}`);
        console.log(`\n   (Using "${jobPipeline.name}" pipeline, "${jobPipeline.stages[0].name}" stage)`);
      }
    } else {
      console.log('❌ No pipelines found. You need to create one in GHL first.');
    }

    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Error fetching pipeline info:');
    console.error(`   ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    process.exit(1);
  }
}

// Run the script
getPipelineInfo();
