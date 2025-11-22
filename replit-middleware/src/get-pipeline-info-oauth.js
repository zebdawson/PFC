require('dotenv').config();
const axios = require('axios');

/**
 * Script to fetch pipelines using the OAuth endpoint
 * This uses the deployed server's OAuth token
 */
async function getPipelineInfo() {
  const baseURL = process.env.REPLIT_URL || 'https://pfc-ticketing.replit.app';

  console.log('\n🔍 Fetching Pipeline Information via OAuth...\n');

  try {
    // First check OAuth status
    console.log('Checking OAuth authorization...');
    const statusRes = await axios.get(`${baseURL}/oauth/status`);

    if (!statusRes.data.authorized) {
      console.error('❌ Not authorized! Please visit:', `${baseURL}/oauth/auth/ghl`);
      process.exit(1);
    }

    console.log(`✅ Authorized for location: ${statusRes.data.locationId}`);
    console.log(`   Company ID: ${statusRes.data.companyId}`);
    console.log(`   User Type: ${statusRes.data.userType}\n`);

    // Try to fetch pipelines via the test endpoint
    console.log('Fetching pipelines...');
    try {
      const pipelinesRes = await axios.get(`${baseURL}/test/pipelines`);

      if (pipelinesRes.data.success && pipelinesRes.data.pipelines) {
        const pipelines = pipelinesRes.data.pipelines;

        console.log(`✅ Found ${pipelines.length} pipeline(s)\n`);
        console.log('='.repeat(80));

        pipelines.forEach((pipeline, index) => {
          console.log(`\n${index + 1}. PIPELINE: ${pipeline.name}`);
          console.log(`   Pipeline ID: ${pipeline.id}`);
          console.log(`   Stages (${pipeline.stages?.length || 0}):`);

          if (pipeline.stages) {
            pipeline.stages.forEach((stage, stageIndex) => {
              console.log(`      ${stageIndex + 1}. ${stage.name}`);
              console.log(`         Stage ID: ${stage.id}`);
            });
          }

          console.log('\n   ' + '-'.repeat(76));
        });

        console.log('\n' + '='.repeat(80));
        console.log('\n📋 CONFIGURATION GUIDE:');
        console.log('\nUpdate your Replit Secrets with these values:\n');

        if (pipelines.length > 0) {
          const firstPipeline = pipelines[0];
          console.log(`PFC_PIPELINE_ID=${firstPipeline.id}`);

          if (firstPipeline.stages && firstPipeline.stages.length > 0) {
            console.log(`PFC_DEFAULT_STAGE=${firstPipeline.stages[0].id}`);
            console.log(`\n   (Using "${firstPipeline.name}" pipeline, "${firstPipeline.stages[0].name}" stage)`);
          }

          console.log('\n🔍 Current Configuration:');
          console.log(`   PFC_PIPELINE_ID (current): ${process.env.PFC_PIPELINE_ID}`);
          console.log(`   PFC_DEFAULT_STAGE (current): ${process.env.PFC_DEFAULT_STAGE}`);

          // Check if current pipeline ID matches any available pipeline
          const currentPipelineExists = pipelines.find(p => p.id === process.env.PFC_PIPELINE_ID);
          if (currentPipelineExists) {
            console.log(`\n   ✅ Current PFC_PIPELINE_ID exists in this location!`);
          } else {
            console.log(`\n   ❌ Current PFC_PIPELINE_ID (${process.env.PFC_PIPELINE_ID}) NOT found in this location!`);
            console.log(`   This is why you're getting the 403 error.`);
            console.log(`   Please update PFC_PIPELINE_ID to one of the IDs listed above.`);
          }
        } else {
          console.log('❌ No pipelines found. You need to create one in GHL first.');
        }

        console.log('\n' + '='.repeat(80) + '\n');

      } else {
        console.error('❌ Failed to fetch pipelines via /test/pipelines endpoint');
        console.error('   Response:', JSON.stringify(pipelinesRes.data, null, 2));
      }
    } catch (pipelineError) {
      console.error('❌ Error fetching pipelines:');
      console.error(`   ${pipelineError.message}`);
      if (pipelineError.response) {
        console.error(`   Status: ${pipelineError.response.status}`);
        console.error(`   Data: ${JSON.stringify(pipelineError.response.data, null, 2)}`);
      }
    }

  } catch (error) {
    console.error('\n❌ Error:');
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
