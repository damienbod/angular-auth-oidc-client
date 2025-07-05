// Karma configuration file
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      jasmine: {
        // you can add configuration options for Jasmine here
        // the possible options are listed at https://jasmine.github.io/api/edge/Configuration.html
        // for example, you can disable the random execution with `random: false`
        // or set a specific seed with `seed: 4321`
      },
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    jasmineHtmlReporter: {
      suppressAll: true // removes the duplicated traces
    },
    coverageReporter: {
      dir: require('path').join(__dirname, '../../coverage/integration-tests'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' }
      ]
    },
    files: [
      // Include test files
      { pattern: 'src/tests/**/*.spec.ts', included: true },
      // Serve assets (like silent-renew.html) but don't include them
      { pattern: 'src/assets/**/*', included: false, served: true, watched: false }
    ],
    proxies: {
      // Make assets available at the expected path
      '/assets/': '/base/src/assets/',
      // Handle silent-renew.html with query parameters
      '/base/src/assets/': '/base/src/assets/'
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['Chrome', 'ChromeHeadless'],
    restartOnFileChange: true,
    singleRun: false,
    
    // Increase timeouts for integration tests
    browserNoActivityTimeout: 60000,
    browserDisconnectTimeout: 20000,
    browserDisconnectTolerance: 3,
    captureTimeout: 60000
  });
};