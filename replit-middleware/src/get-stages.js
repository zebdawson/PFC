require('dotenv').config();
const ghlClient = require('./services/ghlClient');

/**
 * Get stages for the Job Requests pipeline
 */
async function getStages() {
  console.log('\n🔍 Fetching Pipeline Stages from GHL...\n');

  const pipelineId = 'EMd01MWjFA2f1qEuPwWU'; // From your URL

  try {
    const stages = await ghlClient.getPipelineStages(pipelineId);

    console.log('=' .repeat(80));
    console.log(`\n✅ PIPELINE: Job Requests`);
    console.log(`   Pipeline ID: ${pipelineId}\n`);
    console.log(`   Stages (${stages.length}):\n`);

    stages.forEach((stage, index) => {
      console.log(`   ${index + 1}. ${stage.name}`);
      console.log(`      Stage ID: ${stage.id}`);
      if (index === 0) {
        console.log(`      👈 Use this for PFC_DEFAULT_STAGE`);
      }
      console.log('');
    });

    console.log('=' .repeat(80));
    console.log('\n📋 ADD THESE TO REPLIT SECRETS:\n');
    console.log(`PFC_PIPELINE_ID=${pipelineId}`);
    console.log(`PFC_DEFAULT_STAGE=${stages[0].id}`);
    console.log(`\n   (Using "${stages[0].name}" as the default stage for new tickets)`);
    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Error fetching stages:');
    console.error(`   ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    process.exit(1);
  }
}

getStages();
