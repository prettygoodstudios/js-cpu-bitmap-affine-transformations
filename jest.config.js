/** @returns {Promise<import('jest').Config>} */
module.exports = async () => {
    return {
      verbose: true,
      moduleFileExtensions: [
        "mjs",
        "js",
      ],
      testRegex: `tests.*\.mjs$`,
      coverageThreshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
      coverageReporters: ["json-summary", "lcov"],
    };
  };