#!/usr/bin/env node

/**
 * Script to check what pipelines are available for the OAuth-authorized location
 * Run this to verify that PFC_PIPELINE_ID belongs to the correct location
 */

const axios = require('axios');

async function checkPipelines() {
  try {
    // First check OAuth status
    console.log('Checking OAuth status...\n');
    const statusRes = await axios.get('https://pfc-ticketing.replit.app/oauth/status');

    console.log('OAuth Status:');
    console.log(`  Authorized: ${statusRes.data.authorized}`);
    console.log(`  Location ID: ${statusRes.data.locationId}`);
    console.log(`  User Type: ${statusRes.data.userType}\n`);

    if (!statusRes.data.authorized) {
      console.log('❌ Not authorized. Please visit https://pfc-ticketing.replit.app/oauth/auth/ghl');
      return;
    }

    const locationId = statusRes.data.locationId;

    // Get the access token (we'll need to make this endpoint if it doesn't exist)
    // For now, let's just check if we can access the test endpoint

    console.log('Environment Variables:');
    console.log(`  PFC_PIPELINE_ID from env: ${process.env.PFC_PIPELINE_ID}`);
    console.log(`  Expected location: ${process.env.GHL_LOCATION_ID}`);
    console.log(`  OAuth location: ${locationId}\n`);

    if (process.env.GHL_LOCATION_ID !== locationId) {
      console.log('⚠️  WARNING: OAuth location doesn\'t match GHL_LOCATION_ID in .env!');
      console.log(`  You authorized for location: ${locationId}`);
      console.log(`  But your .env has: ${process.env.GHL_LOCATION_ID}`);
      console.log('  This might be the source of the "token does not have access" error.\n');
    } else {
      console.log('✓ Location IDs match!\n');
    }

    console.log('To fix this issue, you need to:');
    console.log('1. Restart your Replit server to deploy the latest code changes');
    console.log('2. Visit https://pfc-ticketing.replit.app/test/pipelines to see available pipelines');
    console.log('3. Update PFC_PIPELINE_ID and PFC_DEFAULT_STAGE to match a pipeline from that location');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

checkPipelines();
