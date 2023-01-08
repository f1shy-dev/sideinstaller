/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // I want to make this as similar to a web environment as possible.
  modulePaths: [
    '<rootDir>/src',
  ],
  setupFiles: [
    '<rootDir>/jest.setup.js',
  ],
};
