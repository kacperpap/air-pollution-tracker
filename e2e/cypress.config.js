const { defineConfig } = require('cypress')
const installLogsPrinter = require('cypress-terminal-report/src/installLogsPrinter');


module.exports = defineConfig({
  env: {
    TZ: 'UTC'
  },
  e2e: {
    baseUrl: process.env.CYPRESS_FRONTEND_URL,
    chromeWebSecurity: false,
    experimentalModifyObstructiveThirdPartyCode: true,
    watchForFileChanges: false,
    supportFile: 'cypress/support/e2e.js',
    video: false,
    screenshotOnFailure: true,
    defaultCommandTimeout: 15000,
    viewportWidth: 1920,
    viewportHeight: 1080,
    setupNodeEvents(on, config) {
      config.env.API_BASE_URL = process.env.API_BASE_URL;
      return config;
    }
  },
})