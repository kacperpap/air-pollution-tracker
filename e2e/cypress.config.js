const { defineConfig } = require('cypress')
const installLogsPrinter = require('cypress-terminal-report/src/installLogsPrinter');


module.exports = defineConfig({
  env: {
    TZ: 'UTC'
  },
  e2e: {
    baseUrl: process.env.CYPRESS_FRONTEND_URL,
    chromeWebSecurity: false,
    watchForFileChanges: false,
    supportFile: 'cypress/support/e2e.js',
    video: false,
    screenshotOnFailure: true,
    defaultCommandTimeout: 15000,
    viewportWidth: 1920,
    viewportHeight: 1080,
    setupNodeEvents(on, config) {
      config.env.API_BASE_URL = process.env.API_BASE_URL;
      installLogsPrinter(on, {
        printLogsToConsole: 'always',
        // --Nie działajacy zpais do pliku--
        // printLogsToFile: 'always',
        // outputRoot: './cypress/logs',
        // outputTarget: {
        //   'run.log': 'txt',
        // },
      });
      return config;
    }
  },
})