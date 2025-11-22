require('dotenv').config();

console.log('\n🔍 Environment Variables Check\n');
console.log('=' .repeat(60));

console.log('\n📋 Required Variables:');
console.log(`GHL_API_KEY: ${process.env.GHL_API_KEY ? '✅ Set (' + process.env.GHL_API_KEY.substring(0, 20) + '...)' : '❌ Not set'}`);
console.log(`GHL_LOCATION_ID: ${process.env.GHL_LOCATION_ID || '❌ Not set'}`);
console.log(`ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Not set'}`);
console.log(`PFC_PIPELINE_ID: ${process.env.PFC_PIPELINE_ID || '❌ Not set'}`);
console.log(`PFC_DEFAULT_STAGE: ${process.env.PFC_DEFAULT_STAGE || '❌ Not set'}`);

console.log('\n📊 Stage ID Analysis:');
if (process.env.PFC_DEFAULT_STAGE) {
  const stageId = process.env.PFC_DEFAULT_STAGE;
  console.log(`  Value: "${stageId}"`);
  console.log(`  Length: ${stageId.length} characters`);
  console.log(`  Type: ${typeof stageId}`);
  console.log(`  Is UUID format: ${/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stageId) ? '✅ Yes' : '❌ No (should be UUID)'}`);

  if (stageId === 'new_request') {
    console.log('  ⚠️  WARNING: Still using placeholder value "new_request"');
    console.log('  ℹ️  Expected: 0e17f21a-e08a-4d05-8467-a02bccb2303c');
  }
} else {
  console.log('  ❌ PFC_DEFAULT_STAGE is not set!');
}

console.log('\n' + '='.repeat(60) + '\n');
