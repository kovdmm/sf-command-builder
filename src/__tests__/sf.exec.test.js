import { jest } from "@jest/globals";
import { stdout, stderr } from "node:process";

import { mockChildProcess, emitStdoutData, emitStderrData, emitClose, expectCommandToBe } from "./childProcess.mock.js";

const { spawn } = await import("node:child_process");
const { sf } = await import("../sf.js");

const generateRandomId = (prefix) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = prefix;
    while (id.length < 15) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
};

describe("sf.exec", () => {
    beforeEach(() => {
        console.log = jest.fn();
        console.error = jest.fn();
        jest.clearAllMocks();
    });

    describe("piped", () => {
        it("should execute command and pipe output", async () => {
            // Arrange
            const mockOutput = "Command executed successfully";

            // Act
            const resultPromise = sf.org.list.exec();
            emitStdoutData(mockOutput);
            emitClose(0);
            await resultPromise;

            // Assert
            expectCommandToBe("sf org list");
            expect(mockChildProcess.stdout.pipe).toHaveBeenCalledWith(stdout);
            expect(mockChildProcess.stderr.pipe).toHaveBeenCalledWith(stderr);
        });

        it("should throw error when command fails", async () => {
            // Arrange
            const errorMessage = "Command failed";

            // Act
            const resultPromise = sf.org.list.exec();
            emitStderrData(errorMessage);
            emitClose(1);

            // Assert
            await expect(resultPromise).rejects.toThrow("Command returned non-zero exit code: 1");
        });

        it("should handle empty output", async () => {
            // Act
            const resultPromise = sf.org.list.exec();
            emitClose(0);
            await resultPromise;

            // Assert
            expectCommandToBe("sf org list");
        });
    });

    describe("as json", () => {
        it("should parse JSON output from SF command", async () => {
            // Arrange
            const command = sf.org.list;
            const jsonOutput = { status: 0, result: { orgs: ["org1", "org2"] } };

            // Act
            const resultPromise = command.exec(true);
            emitStdoutData(JSON.stringify(jsonOutput));
            emitClose(0);
            const result = await resultPromise;

            // Assert
            expect(spawn).toHaveBeenCalledWith("sf org list --json", { shell: true, stdio: "pipe" });
            expect(result).toEqual(jsonOutput);
        });

        it("should return default object when stdout is empty", async () => {
            // Arrange
            const command = sf.org.list;

            // Act
            const resultPromise = command.exec(true);
            emitClose(0);
            const result = await resultPromise;

            // Assert
            expect(result).toEqual({ exitCode: -1 });
        });

        it("should handle complex JSON objects", async () => {
            // Arrange
            const command = sf.data.query.__query('"SELECT Id, (SELECT Id FROM Contacts) FROM Account"');
            const complexJsonOutput = {
                status: 0,
                result: {
                    records: [
                        {
                            Id: generateRandomId("001"),
                            Contacts: {
                                records: [{ Id: generateRandomId("003") }, { Id: generateRandomId("003") }],
                            },
                        },
                    ],
                },
            };

            // Act
            const resultPromise = command.exec(true);
            emitStdoutData(JSON.stringify(complexJsonOutput));
            emitClose(0);
            const result = await resultPromise;

            // Assert
            expect(spawn).toHaveBeenCalledWith(
                'sf data query --query "SELECT Id, (SELECT Id FROM Contacts) FROM Account" --json',
                { shell: true, stdio: "pipe" },
            );
            expect(result).toEqual(complexJsonOutput);
        });
    });
});
