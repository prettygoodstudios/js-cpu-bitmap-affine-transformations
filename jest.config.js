/** @returns {Promise<import('jest').Config>} */
module.exports = async () => {
    return {
      verbose: true,
      moduleFileExtensions: [
        "mjs",
        "js",
      ],
      testRegex: `tests.*\.mjs$`,
    };
  };