require('dotenv').config();
const ghlClient = require('./services/ghlClient');

/**
 * Get stage ID from an opportunity
 */
async function getStageFromOpportunity() {
  const opportunityId = 'wx5rX2Hv3IWVb9fM8quw'; // From the URL

  console.log('\n🔍 Fetching Opportunity Details from GHL...\n');

  try {
    const opportunity = await ghlClient.getOpportunity(opportunityId);

    console.log('=' .repeat(80));
    console.log(`\n✅ OPPORTUNITY: ${opportunity.name}`);
    console.log(`   Opportunity ID: ${opportunity.id}`);
    console.log(`   Pipeline ID: ${opportunity.pipelineId}`);
    console.log(`   Pipeline Stage ID: ${opportunity.pipelineStageId}`);
    console.log(`   Status: ${opportunity.status}`);
    console.log('\n' + '=' .repeat(80));
    console.log('\n📋 ADD THESE TO REPLIT SECRETS:\n');
    console.log(`PFC_PIPELINE_ID=${opportunity.pipelineId}`);
    console.log(`PFC_DEFAULT_STAGE=${opportunity.pipelineStageId}`);
    console.log(`\n   (This is the Stage ID for "${opportunity.pipelineStageName || 'New Request'}" stage)`);
    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Error fetching opportunity:');
    console.error(`   ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    process.exit(1);
  }
}

getStageFromOpportunity();
