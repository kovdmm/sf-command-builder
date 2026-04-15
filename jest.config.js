/** @type {import('jest').Config} */
export default {
    testMatch: ["**/*.(test|spec).js"],
    collectCoverageFrom: ["**/*.js", "!**/node_modules/**", "!**/coverage/**", "!**/__tests__/**", "!jest.config.js"],
};
