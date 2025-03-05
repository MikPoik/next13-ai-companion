
// Debug script for testing Bolna API
const axios = require('axios');
const util = require('util');
const { getBolnaAgentJson } = require('../lib/bolna');

async function debugBolnaCall() {
  try {
    // Get your Bolna API Key from environment
    const apiKey = process.env.BOLNA_API_KEY;
    if (!apiKey) {
      console.error('BOLNA_API_KEY environment variable is not set');
      return;
    }

    // Create test agent JSON
    const testAgentJson = getBolnaAgentJson(
      "Test Agent",
      "Rachel",
      "elevenlabs",
      "21m00Tcm4TlvDq8ikWAM",
      "eleven_multilingual_v2",
      false,
      "neural",
      "en-US",
      "deepinfra",
      "Sao10K/L3.1-70B-Euryale-v2.2"
    );

    console.log("Request payload:", util.inspect(testAgentJson, { depth: null, colors: true }));

    // Call Bolna API to create agent
    const response = await axios.post(
      'https://api.bolna.dev/agent',
      testAgentJson,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("Success response:", util.inspect(response.data, { depth: null, colors: true }));
  } catch (error) {
    console.error("Error status:", error.response?.status);
    
    if (error.response?.data) {
      console.error("Error details:", util.inspect(error.response.data, { depth: null, colors: true }));
      
      // Extract and display location of missing fields
      if (error.response.data.detail && Array.isArray(error.response.data.detail)) {
        error.response.data.detail.forEach((errorDetail, index) => {
          if (errorDetail.loc) {
            console.error(`Missing field ${index + 1}:`, errorDetail.loc.join(' -> '));
          }
        });
      }
    } else {
      console.error("Error:", error.message);
    }
  }
}

debugBolnaCall();
