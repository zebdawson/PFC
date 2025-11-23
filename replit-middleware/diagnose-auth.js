#!/usr/bin/env node

/**
 * Comprehensive OAuth & Pipeline Diagnostic Script
 *
 * This script helps diagnose authentication and pipeline configuration issues
 * by checking OAuth status, verifying pipeline access, and identifying mismatches.
 */

require('dotenv').config();
const axios = require('axios');
const chalk = require('chalk');

// ANSI colors fallback (in case chalk isn't available)
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
};

const baseURL = process.env.REPLIT_URL || 'http://localhost:3000';

async function runDiagnostics() {
  console.log('\n' + colors.bold('═'.repeat(80)));
  console.log(colors.bold('  🔍 PFC TICKETING - OAuth & Pipeline Diagnostic'));
  console.log(colors.bold('═'.repeat(80)) + '\n');

  const results = {
    oauthStatus: null,
    pipelines: null,
    issues: [],
    recommendations: []
  };

  // Step 1: Check OAuth Status
  console.log(colors.cyan('📌 Step 1: Checking OAuth Authorization Status...\n'));

  try {
    const statusRes = await axios.get(`${baseURL}/oauth/status`);
    results.oauthStatus = statusRes.data;

    if (statusRes.data.oauthAuthorized) {
      console.log(colors.green('   ✓ OAuth is AUTHORIZED'));
      console.log(`   Location ID: ${colors.bold(statusRes.data.locationId)}`);
      console.log(`   Company ID: ${statusRes.data.companyId || 'N/A'}`);
      console.log(`   User Type: ${statusRes.data.userType || 'N/A'}`);
      console.log(`   Expires: ${statusRes.data.expiresAt}`);
      console.log(`   Has Refresh Token: ${statusRes.data.hasRefreshToken ? 'Yes' : 'No'}`);
    } else {
      console.log(colors.red('   ✗ OAuth is NOT authorized'));
      console.log(colors.yellow(`   → Please visit: ${baseURL}/oauth/auth/ghl`));
      results.issues.push('OAuth not authorized - authorization required');
      results.recommendations.push(`Visit ${baseURL}/oauth/auth/ghl to authorize`);
    }
  } catch (error) {
    console.log(colors.red(`   ✗ Failed to check OAuth status: ${error.message}`));
    results.issues.push('Cannot connect to server - is it running?');
    results.recommendations.push('Start the server with: npm start');
    console.log(colors.yellow(`   → Make sure the server is running on ${baseURL}`));
    return printSummary(results);
  }

  console.log('\n');

  // Step 2: Fetch Available Pipelines
  console.log(colors.cyan('📌 Step 2: Fetching Available Pipelines for Your Location...\n'));

  if (!results.oauthStatus?.oauthAuthorized) {
    console.log(colors.yellow('   ⊘ Skipped - OAuth not authorized\n'));
  } else {
    try {
      const pipelinesRes = await axios.get(`${baseURL}/test/pipelines`);
      results.pipelines = pipelinesRes.data.pipelines;

      if (results.pipelines && results.pipelines.length > 0) {
        console.log(colors.green(`   ✓ Found ${results.pipelines.length} pipeline(s)\n`));

        results.pipelines.forEach((pipeline, idx) => {
          console.log(`   ${idx + 1}. ${colors.bold(pipeline.name)}`);
          console.log(`      Pipeline ID: ${colors.cyan(pipeline.id)}`);

          if (pipeline.stages && pipeline.stages.length > 0) {
            console.log(`      Stages (${pipeline.stages.length}):`);
            pipeline.stages.forEach((stage, sIdx) => {
              console.log(`         ${sIdx + 1}. ${stage.name} - ${colors.cyan(stage.id)}`);
            });
          }
          console.log('');
        });
      } else {
        console.log(colors.red('   ✗ No pipelines found in your location'));
        results.issues.push('No pipelines available in authorized location');
        results.recommendations.push('Create a pipeline in your GoHighLevel location first');
      }
    } catch (error) {
      console.log(colors.red(`   ✗ Failed to fetch pipelines: ${error.message}`));
      if (error.response?.status === 403) {
        results.issues.push('403 Forbidden when fetching pipelines - OAuth scope issue');
        results.recommendations.push('Re-authorize OAuth with updated scopes');
      }
    }
  }

  console.log('\n');

  // Step 3: Verify Current Configuration
  console.log(colors.cyan('📌 Step 3: Verifying Current Environment Configuration...\n'));

  const envPipelineId = process.env.PFC_PIPELINE_ID;
  const envStageId = process.env.PFC_DEFAULT_STAGE;
  const envLocationId = process.env.GHL_LOCATION_ID;

  console.log(`   ENV Location ID: ${colors.bold(envLocationId || 'NOT SET')}`);
  console.log(`   ENV Pipeline ID: ${colors.bold(envPipelineId || 'NOT SET')}`);
  console.log(`   ENV Stage ID: ${colors.bold(envStageId || 'NOT SET')}\n`);

  // Step 4: Check for Mismatches
  console.log(colors.cyan('📌 Step 4: Checking for Configuration Mismatches...\n'));

  if (results.oauthStatus?.oauthAuthorized && results.pipelines) {
    // Check if OAuth location matches env location
    if (envLocationId && envLocationId !== results.oauthStatus.locationId) {
      console.log(colors.red('   ✗ MISMATCH: Environment location ID differs from OAuth location'));
      console.log(`      ENV has: ${envLocationId}`);
      console.log(`      OAuth has: ${results.oauthStatus.locationId}`);
      results.issues.push('Location ID mismatch between .env and OAuth');
      results.recommendations.push(`Update GHL_LOCATION_ID in .env to: ${results.oauthStatus.locationId}`);
    } else if (envLocationId) {
      console.log(colors.green('   ✓ Location IDs match'));
    }

    // Check if pipeline ID exists in available pipelines
    if (envPipelineId) {
      const pipelineExists = results.pipelines.find(p => p.id === envPipelineId);

      if (pipelineExists) {
        console.log(colors.green(`   ✓ Pipeline ID "${envPipelineId}" EXISTS in your location`));
        console.log(`      Pipeline Name: ${pipelineExists.name}\n`);

        // Check if stage exists in that pipeline
        if (envStageId) {
          const stageExists = pipelineExists.stages?.find(s => s.id === envStageId);

          if (stageExists) {
            console.log(colors.green(`   ✓ Stage ID "${envStageId}" EXISTS in pipeline`));
            console.log(`      Stage Name: ${stageExists.name}`);
          } else {
            console.log(colors.red(`   ✗ Stage ID "${envStageId}" NOT FOUND in pipeline`));
            results.issues.push('Stage ID not found in configured pipeline');
            if (pipelineExists.stages && pipelineExists.stages.length > 0) {
              results.recommendations.push(`Update PFC_DEFAULT_STAGE to: ${pipelineExists.stages[0].id} (${pipelineExists.stages[0].name})`);
            }
          }
        } else {
          console.log(colors.yellow('   ⚠ PFC_DEFAULT_STAGE not set in environment'));
          results.issues.push('Default stage not configured');
          if (pipelineExists.stages && pipelineExists.stages.length > 0) {
            results.recommendations.push(`Set PFC_DEFAULT_STAGE to: ${pipelineExists.stages[0].id}`);
          }
        }
      } else {
        console.log(colors.red(`   ✗ CRITICAL: Pipeline ID "${envPipelineId}" NOT FOUND in your location!`));
        console.log(colors.red(`      This is the cause of your 403 error!`));
        results.issues.push(`Pipeline ID ${envPipelineId} does not exist in authorized location`);

        if (results.pipelines.length > 0) {
          results.recommendations.push(`Update PFC_PIPELINE_ID to: ${results.pipelines[0].id} (${results.pipelines[0].name})`);
          if (results.pipelines[0].stages?.length > 0) {
            results.recommendations.push(`Update PFC_DEFAULT_STAGE to: ${results.pipelines[0].stages[0].id}`);
          }
        }
      }
    } else {
      console.log(colors.yellow('   ⚠ PFC_PIPELINE_ID not set in environment'));
      results.issues.push('Pipeline ID not configured');
      if (results.pipelines.length > 0) {
        results.recommendations.push(`Set PFC_PIPELINE_ID to: ${results.pipelines[0].id}`);
      }
    }
  }

  console.log('\n');

  // Print Summary
  printSummary(results);
}

function printSummary(results) {
  console.log(colors.bold('═'.repeat(80)));
  console.log(colors.bold('  📊 DIAGNOSTIC SUMMARY'));
  console.log(colors.bold('═'.repeat(80)) + '\n');

  if (results.issues.length === 0) {
    console.log(colors.green('   ✓ No issues detected! Configuration looks good.\n'));
  } else {
    console.log(colors.red(`   Found ${results.issues.length} issue(s):\n`));
    results.issues.forEach((issue, idx) => {
      console.log(colors.red(`   ${idx + 1}. ${issue}`));
    });
    console.log('\n');
  }

  if (results.recommendations.length > 0) {
    console.log(colors.yellow('   📝 RECOMMENDED ACTIONS:\n'));
    results.recommendations.forEach((rec, idx) => {
      console.log(colors.yellow(`   ${idx + 1}. ${rec}`));
    });
    console.log('\n');
  }

  console.log(colors.bold('═'.repeat(80)));
  console.log(colors.cyan('   Next Steps:'));
  console.log(colors.cyan('   1. Fix any issues listed above'));
  console.log(colors.cyan('   2. Update your .env file with correct values'));
  console.log(colors.cyan('   3. Restart the server to apply changes'));
  console.log(colors.cyan('   4. Re-run this diagnostic to verify'));
  console.log(colors.bold('═'.repeat(80)) + '\n');
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error(colors.red('\n✗ Fatal error running diagnostics:'));
  console.error(error.message);
  console.error(error.stack);
  process.exit(1);
});
