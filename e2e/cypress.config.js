const { defineConfig } = require('cypress')
const fs = require('fs');
const path = require('path');

module.exports = defineConfig({
  env: {
    TZ: 'UTC',
  },
  e2e: {
    baseUrl: process.env.CYPRESS_FRONTEND_URL,
    chromeWebSecurity: false,
    experimentalModifyObstructiveThirdPartyCode: true,
    watchForFileChanges: false,
    supportFile: 'cypress/support/e2e.js',
    video: false,
    screenshotOnFailure: true,
    defaultCommandTimeout: 30000,
    viewportWidth: 1920,
    viewportHeight: 1080,
    specPattern: 'cypress/e2e/**/*.cy.js',
    testIsolation: false,
    setupNodeEvents(on, config) {
      config.env.API_BASE_URL = process.env.API_BASE_URL;

      const testOrder = [
        'cypress/e2e/1-auth/auth.cy.js',
        'cypress/e2e/2-drone-flights/drone-flight.cy.js',
        'cypress/e2e/3-drone-flight-overview/drone-flight-overview.cy.js',
        'cypress/e2e/4-simulation/simulation.cy.js',
        'cypress/e2e/5-simulation-overview/simulation-overview.cy.js'
      ];

      testOrder.forEach(specPath => {
        if (!fs.existsSync(path.join(__dirname, specPath))) {
          throw new Error(`Test file not found: ${specPath}`);
        }
      });

      on('before:spec', (spec) => {
        console.log(`Starting test: ${spec.name}`);
      });

      on('after:spec', (spec, results) => {
        if (results && results.stats.failures > 0) {

          console.error(`Test failed: ${spec.name}`);
        }
        console.log(`Completed test: ${spec.name}`);
      });

      config.specPattern = testOrder;

      return config;
    }
  },
})