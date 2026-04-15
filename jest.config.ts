import { Config } from "@jest/types";

const config: Config.InitialOptions = {
    testMatch: ["**/*.(test|spec).ts"],
    extensionsToTreatAsEsm: [".ts"],
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                useESM: true,
                tsconfig: "./tsconfig.json",
            },
        ],
    },
    collectCoverageFrom: ["**/*.ts", "!**/node_modules/**", "!**/coverage/**", "!**/__tests__/**", "!jest.config.ts"],
};

export default config;
