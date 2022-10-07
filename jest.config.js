module.exports = {

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: ["src/**"],

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: [
    "\\\\node_modules\\\\",
    "\\index.(tsx?|jsx?)$",
    "\\\\coverage\\\\",
  ],

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: [
    //   "json",
    "text", "lcov",
    //   "clover"
  ],

  // An array of file extensions your modules use
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],

  // A preset that is used as a base for Jest's configuration
  preset: "ts-jest",

  // A list of paths to directories that Jest should use to search for files in
  roots: [
    "src",
  ],

  // The test environment that will be used for testing
  testEnvironment: "node",

  // The regexp pattern or array of patterns that Jest uses to detect test files
  testRegex: "(\\.|/)(test|spec)\\.(jsx?|tsx?)$",

  // A map from regular expressions to paths to transformers
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },

  // An array of regexp pattern strings that are matched against all source file paths, matched files
  // will skip transformation
  transformIgnorePatterns: [
    "\\\\node_modules\\\\",
  ],
};
